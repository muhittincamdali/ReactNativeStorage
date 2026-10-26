// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStorage, memoryDriver } from '../src/index';
import { useStorageItem } from '../src/react';
import { manualDriver } from './helpers';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useStorageItem', () => {
  it('has the stored value on the first render with a synchronous driver', () => {
    const driver = memoryDriver([['theme', '{"rns":1,"s":1,"d":"dark"}']]);
    const theme = createStorage({ driver }).item('theme', { defaultValue: 'light' });
    const renders: string[] = [];
    function Label() {
      const [value] = useStorageItem(theme);
      renders.push(value);
      return <span>{value}</span>;
    }
    render(<Label />);
    expect(renders[0]).toBe('dark');
    expect(screen.getByText('dark')).toBeTruthy();
  });

  it('updates every component that shows the item', async () => {
    const count = createStorage({ driver: memoryDriver() }).item('count', { defaultValue: 0 });
    function Counter({ label }: { label: string }) {
      const [value, setValue] = useStorageItem(count);
      return (
        <button type="button" onClick={() => void setValue((current) => current + 1)}>
          {label}:{value}
        </button>
      );
    }
    render(
      <>
        <Counter label="a" />
        <Counter label="b" />
      </>,
    );
    await act(async () => {
      screen.getByText('a:0').click();
    });
    expect(screen.getByText('a:1')).toBeTruthy();
    expect(screen.getByText('b:1')).toBeTruthy();
    await act(() => count.set(10));
    expect(screen.getByText('b:10')).toBeTruthy();
  });

  it('shows loading, then the value, with an asynchronous driver', async () => {
    const { driver, calls } = manualDriver({ name: '{"rns":1,"s":1,"d":"Ada"}' });
    const name = createStorage({ driver }).item('name', { defaultValue: '' });
    const { result } = renderHook(() => useStorageItem(name));
    expect(result.current[0]).toBe('');
    expect(result.current[2].status).toBe('loading');
    await act(async () => calls[0]!.resolve());
    expect(result.current[0]).toBe('Ada');
    expect(result.current[2].status).toBe('ready');
  });

  it('shows the error and recovers through reload', async () => {
    const { driver, calls } = manualDriver({ n: '{"rns":1,"s":1,"d":5}' });
    const n = createStorage({ driver }).item('n', { defaultValue: 0 });
    const { result } = renderHook(() => useStorageItem(n));
    await act(async () => calls[0]!.reject(new Error('locked')));
    expect(result.current[2]).toMatchObject({ status: 'error', error: { code: 'DRIVER_ERROR' } });
    await act(async () => {
      const reload = result.current[2].reload();
      calls[1]!.resolve();
      await reload;
    });
    expect(result.current[0]).toBe(5);
  });

  it('falls back to the default value when the TTL passes while mounted', async () => {
    vi.useFakeTimers({ now: 0 });
    const code = createStorage({ driver: memoryDriver(), now: () => Date.now() }).item<string>(
      'otp',
    );
    await code.set('123456', { ttl: 30_000 });
    const { result } = renderHook(() => useStorageItem(code));
    expect(result.current[0]).toBe('123456');
    expect(result.current[2].expiresAt).toBe(30_000);
    await act(async () => {
      vi.advanceTimersByTime(29_999);
    });
    expect(result.current[0]).toBe('123456');
    await act(async () => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current[0]).toBeUndefined();
  });

  it('never asks for a timer longer than JavaScript timers allow', async () => {
    vi.useFakeTimers({ now: 0 });
    const spy = vi.spyOn(globalThis, 'setTimeout');
    const item = createStorage({ driver: memoryDriver(), now: () => Date.now() }).item('long');
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    await item.set('x', { ttl: thirtyDays });
    const { result } = renderHook(() => useStorageItem(item));
    const delays = spy.mock.calls.map((call) => call[1] ?? 0);
    expect(Math.max(...delays)).toBe(2_147_483_647);
    // The early wake-up reschedules instead of expiring the value.
    await act(async () => {
      vi.advanceTimersByTime(2_147_483_647);
    });
    expect(result.current[0]).toBe('x');
    await act(async () => {
      vi.advanceTimersByTime(thirtyDays);
    });
    expect(result.current[0]).toBeUndefined();
  });

  it('stops its timer and listener on unmount', async () => {
    vi.useFakeTimers({ now: 0 });
    const item = createStorage({ driver: memoryDriver(), now: () => Date.now() }).item('a');
    await item.set(1, { ttl: 1_000 });
    const { unmount } = renderHook(() => useStorageItem(item));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
