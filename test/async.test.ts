import { describe, expect, it, vi } from 'vitest';
import { StorageError, createStorage } from '../src/index';
import { manualDriver, settle } from './helpers';

const record = (value: unknown) => JSON.stringify({ rns: 1, s: 1, d: value });

describe('asynchronous drivers', () => {
  it('reports loading, then the stored value, with one driver read for concurrent readers', async () => {
    const { driver, calls } = manualDriver({ name: record('Ada') });
    const item = createStorage({ driver }).item('name', { defaultValue: '' });
    expect(item.getSnapshot()).toMatchObject({ status: 'loading', value: '' });
    const listener = vi.fn();
    item.subscribe(listener);

    const reads = [item.get(), item.get(), item.load()];
    expect(calls.filter((call) => call.method === 'getItem')).toHaveLength(1);
    calls[0]!.resolve();
    expect(await reads[0]).toBe('Ada');
    expect(await reads[1]).toBe('Ada');
    expect(item.getSnapshot()).toMatchObject({ status: 'ready', value: 'Ada' });
    expect(listener).toHaveBeenCalled();
  });

  it('shows a write at once and sends writes to one key in call order', async () => {
    const { driver, data, calls } = manualDriver();
    const item = createStorage({ driver }).item('n', { defaultValue: 0 });
    const first = item.set(1);
    const second = item.set(2);
    expect(item.getSnapshot().value).toBe(2);
    await settle();
    // The second write waits for the first to finish.
    expect(calls.map((call) => call.value)).toEqual([record(1)]);
    calls[0]!.resolve();
    await first;
    await settle();
    expect(calls.map((call) => call.value)).toEqual([record(1), record(2)]);
    calls[1]!.resolve();
    await second;
    expect(data.get('n')).toBe(record(2));
  });

  it('goes back to the last saved value when the newest write fails', async () => {
    const { driver, calls } = manualDriver({ n: record(0) });
    const item = createStorage({ driver }).item('n', { defaultValue: -1 });
    const load = item.get();
    calls[0]!.resolve();
    await load;

    const write = item.set(5);
    expect(item.getSnapshot().value).toBe(5);
    await settle();
    calls[1]!.reject(new Error('disk full'));
    const error = await write.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(StorageError);
    expect(error).toMatchObject({ code: 'DRIVER_ERROR', key: 'n' });
    expect((error as Error).cause).toEqual(new Error('disk full'));
    expect(item.getSnapshot().value).toBe(0);
  });

  it('keeps a later write when an earlier one fails', async () => {
    const { driver, calls } = manualDriver();
    const item = createStorage({ driver }).item('n', { defaultValue: 0 });
    const first = item.set(1).catch(() => 'failed');
    const second = item.set(2);
    await settle();
    calls[0]!.reject(new Error('timeout'));
    expect(await first).toBe('failed');
    await settle();
    calls[1]!.resolve();
    await second;
    expect(item.getSnapshot().value).toBe(2);
  });

  it('forgets an optimistic value it never confirmed when every write fails', async () => {
    const { driver, calls } = manualDriver();
    const item = createStorage({ driver }).item('n', { defaultValue: 0 });
    const write = item.set(1).catch(() => 'failed');
    await settle();
    calls[0]!.reject(new Error('no'));
    await write;
    expect(item.getSnapshot().status).toBe('loading');
  });

  it('does not let a read that started before a write overwrite it', async () => {
    const { driver, calls } = manualDriver({ n: record(1) });
    const item = createStorage({ driver }).item('n', { defaultValue: 0 });
    const read = item.get();
    const write = item.set(2);
    calls[0]!.resolve();
    expect(await read).toBe(2);
    await settle();
    calls[1]!.resolve();
    await write;
    expect(item.getSnapshot().value).toBe(2);
  });

  it('reports a failed read in the snapshot and recovers on reload', async () => {
    const { driver, calls } = manualDriver({ n: record(3) });
    const item = createStorage({ driver }).item('n', { defaultValue: 0 });
    const read = item.get();
    calls[0]!.reject(new Error('locked'));
    await expect(read).rejects.toMatchObject({ code: 'DRIVER_ERROR' });
    const failed = item.getSnapshot();
    expect(failed).toMatchObject({ status: 'error', value: 0, error: { code: 'DRIVER_ERROR' } });
    expect(item.getSnapshot()).toBe(failed);

    const reload = item.load();
    calls[1]!.resolve();
    await reload;
    expect(item.getSnapshot()).toMatchObject({ status: 'ready', value: 3 });
  });

  it('removes expired values through the write queue', async () => {
    let now = 0;
    const { driver, data, calls } = manualDriver({
      t: JSON.stringify({ rns: 1, s: 1, e: 10, d: 'x' }),
    });
    const item = createStorage({ driver, now: () => now }).item('t');
    now = 10;
    const read = item.get();
    calls[0]!.resolve();
    await settle();
    expect(calls[1]).toMatchObject({ method: 'removeItem', key: 't' });
    calls[1]!.resolve();
    expect(await read).toBeUndefined();
    expect(data.has('t')).toBe(false);
  });

  it('reports a failed clean-up write instead of failing the read', async () => {
    const onError = vi.fn();
    const { driver, calls } = manualDriver({ t: JSON.stringify({ rns: 1, s: 1, e: 1, d: 'x' }) });
    const item = createStorage({ driver, onError, now: () => 5 }).item('t', {
      defaultValue: 'none',
    });
    const read = item.get();
    calls[0]!.resolve();
    await settle();
    calls[1]!.reject(new Error('read-only'));
    expect(await read).toBe('none');
    await settle();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'DRIVER_ERROR' }));
  });
});
