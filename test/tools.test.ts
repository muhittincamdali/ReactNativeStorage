import { describe, expect, it, vi } from 'vitest';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import {
  copyKeys,
  createStorage,
  getOrCreateSecret,
  memoryDriver,
  randomSecret,
  toStateStorage,
} from '../src/index';
import { manualDriver, settle } from './helpers';

function sequence(bytes: number[]) {
  let index = 0;
  return vi.fn((target: Uint8Array) => {
    for (let position = 0; position < target.length; position += 1) {
      target[position] = bytes[index % bytes.length]!;
      index += 1;
    }
    return target;
  });
}

describe('randomSecret', () => {
  it('returns the requested number of base62 characters', () => {
    const secret = randomSecret({ length: 40 });
    expect(secret).toMatch(/^[A-Za-z0-9]{40}$/);
    expect(randomSecret()).toHaveLength(32);
    expect(randomSecret()).not.toBe(randomSecret());
  });

  it('drops bytes that would bias the alphabet', () => {
    // 248…255 would map onto A…H a second time; they are skipped, 0 → A and 61 → 9 are kept.
    const secret = randomSecret({ length: 16, getRandomValues: sequence([248, 255, 0, 61]) });
    expect(secret).toBe('A9'.repeat(8));
  });

  it('gives up on a source that only returns unusable bytes instead of looping forever', () => {
    const random = sequence([255]);
    expect(() => randomSecret({ getRandomValues: random })).toThrow(/too few usable bytes/);
    expect(random).toHaveBeenCalledTimes(64);
  });

  it.each([15, 257, 16.5, NaN])('refuses a length of %s', (length) => {
    expect(() => randomSecret({ length })).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTION' }),
    );
  });

  it('explains what to install when there is no crypto.getRandomValues', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      expect(() => randomSecret()).toThrow(/react-native-get-random-values/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('getOrCreateSecret', () => {
  it('creates the secret once, even when called twice at the same time', async () => {
    const { driver, calls } = manualDriver();
    const item = createStorage({ driver }).item<string>('db-key');
    const first = getOrCreateSecret(item);
    const second = getOrCreateSecret(item);
    expect(second).toBe(first);
    calls[0]!.resolve();
    await settle();
    expect(calls.filter((call) => call.method === 'setItem')).toHaveLength(1);
    calls[1]!.resolve();
    const secret = await first;
    expect(secret).toMatch(/^[A-Za-z0-9]{32}$/);
    expect(await getOrCreateSecret(item)).toBe(secret);
  });

  it('returns a secret that is already stored', async () => {
    const item = createStorage({ driver: memoryDriver() }).item<string>('k');
    await item.set('existing-secret');
    expect(await getOrCreateSecret(item)).toBe('existing-secret');
  });
});

describe('copyKeys', () => {
  it('copies every key, skips existing ones and can remove the source', async () => {
    const from = memoryDriver([
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ]);
    const to = memoryDriver([['b', 'kept']]);
    const result = await copyKeys({ from, to, removeFromSource: true });
    expect(result).toEqual({ copied: ['a', 'c'], skipped: ['b'], missing: [] });
    expect(Object.fromEntries(to.data)).toEqual({ a: '1', b: 'kept', c: '3' });
    expect([...from.data.keys()]).toEqual(['b']);
  });

  it('copies a list or a filtered set of keys and can overwrite', async () => {
    const from = memoryDriver([
      ['user:1', 'x'],
      ['tmp', 'y'],
    ]);
    const to = memoryDriver([['user:1', 'old']]);
    expect(
      await copyKeys({ from, to, keys: (key) => key.startsWith('user:'), overwrite: true }),
    ).toEqual({
      copied: ['user:1'],
      skipped: [],
      missing: [],
    });
    expect(to.data.get('user:1')).toBe('x');
    expect(await copyKeys({ from, to, keys: ['nope', 'nope'] })).toEqual({
      copied: [],
      skipped: [],
      missing: ['nope'],
    });
  });

  it('refuses invalid keys and drivers that cannot list without a key list', async () => {
    const to = memoryDriver();
    await expect(copyKeys({ from: memoryDriver(), to, keys: [''] })).rejects.toMatchObject({
      code: 'INVALID_KEY',
    });
    const { getAllKeys: _unused, ...unlisted } = memoryDriver();
    await expect(copyKeys({ from: unlisted, to })).rejects.toMatchObject({ code: 'UNSUPPORTED' });
  });

  it('moves plain AsyncStorage text that an item then reads through legacy', async () => {
    const from = memoryDriver([['onboarded', 'true']]);
    const to = memoryDriver();
    await copyKeys({ from, to });
    const onboarded = createStorage({ driver: to }).item('onboarded', {
      defaultValue: false,
      legacy: (raw) => raw === 'true',
    });
    expect(await onboarded.get()).toBe(true);
  });
});

describe('toStateStorage', () => {
  it('persists and rehydrates a Zustand store', async () => {
    type Cart = { items: string[]; add: (item: string) => void };
    const driver = memoryDriver();
    const storage = createStorage({ driver, namespace: 'state' });
    const make = () =>
      createStore<Cart>()(
        persist(
          (set) => ({
            items: [],
            add: (item) => set((state) => ({ items: [...state.items, item] })),
          }),
          {
            name: 'cart',
            storage: createJSONStorage(() => toStateStorage(storage)),
          },
        ),
      );
    const first = make();
    first.getState().add('apple');
    await settle();
    expect(driver.data.has('state:cart')).toBe(true);

    const second = make();
    await second.persist.rehydrate();
    expect(second.getState().items).toEqual(['apple']);
    await second.persist.clearStorage();
    expect(driver.data.has('state:cart')).toBe(false);
  });

  it('returns null for a missing name', async () => {
    expect(
      await toStateStorage(createStorage({ driver: memoryDriver() })).getItem('none'),
    ).toBeNull();
  });
});
