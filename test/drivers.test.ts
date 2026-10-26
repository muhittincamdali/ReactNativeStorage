// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  SECURE_STORE_MAX_VALUE_BYTES,
  asyncStorageDriver,
  createStorage,
  encodeSecureStoreKey,
  mmkvDriver,
  secureStoreDriver,
  webStorageDriver,
  type MMKVLike,
} from '../src/index';

/** Behaves like a react-native-mmkv 4 instance: listeners fire on every write, ours included. */
function fakeMMKV(version: 3 | 4 = 4) {
  const data = new Map<string, string>();
  const listeners = new Set<(key: string) => void>();
  const emit = (key: string) => listeners.forEach((listener) => listener(key));
  const mmkv: MMKVLike = {
    set: (key, value) => {
      data.set(key, value);
      emit(key);
    },
    getString: (key) => data.get(key),
    getAllKeys: () => [...data.keys()],
    addOnValueChangedListener: (listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
  };
  const remove = (key: string) => {
    data.delete(key);
    emit(key);
    return true;
  };
  if (version === 4) mmkv.remove = remove;
  else mmkv.delete = (key) => void remove(key);
  return { mmkv, data, listeners };
}

describe('mmkvDriver', () => {
  it.each([3, 4] as const)('reads, writes, lists and removes with MMKV %i', async (version) => {
    const { mmkv, data } = fakeMMKV(version);
    const storage = createStorage({ driver: mmkvDriver(mmkv), namespace: 'app' });
    const item = storage.item('n', { defaultValue: 0 });
    await item.set(7);
    expect(data.get('app:n')).toBe('{"rns":1,"s":1,"d":7}');
    expect(item.getSnapshot()).toMatchObject({ status: 'ready', value: 7 });
    expect(await storage.keys()).toEqual(['n']);
    await item.remove();
    expect(data.size).toBe(0);
  });

  it('passes changes made directly on the MMKV instance to subscribers', () => {
    const { mmkv } = fakeMMKV();
    const item = createStorage({ driver: mmkvDriver(mmkv) }).item('flag', { defaultValue: false });
    const listener = vi.fn();
    item.subscribe(listener);
    expect(item.getSnapshot().value).toBe(false);
    mmkv.set('flag', '{"rns":1,"s":1,"d":true}');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(item.getSnapshot().value).toBe(true);
  });

  it('does not notify twice for its own writes', async () => {
    const { mmkv } = fakeMMKV();
    const item = createStorage({ driver: mmkvDriver(mmkv) }).item('n', { defaultValue: 0 });
    const listener = vi.fn();
    item.subscribe(listener);
    await item.set(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops listening to MMKV after dispose', () => {
    const { mmkv, listeners } = fakeMMKV();
    const storage = createStorage({ driver: mmkvDriver(mmkv) });
    expect(listeners.size).toBe(1);
    storage.dispose();
    expect(listeners.size).toBe(0);
  });

  it('fails clearly on an object without remove() or delete()', async () => {
    const mmkv = { set: () => undefined, getString: () => undefined, getAllKeys: () => [] };
    const item = createStorage({ driver: mmkvDriver(mmkv) }).item('x');
    await expect(item.remove()).rejects.toMatchObject({ code: 'DRIVER_ERROR' });
  });
});

describe('webStorageDriver', () => {
  it('stores in localStorage and sees changes from other tabs', async () => {
    window.localStorage.clear();
    const storage = createStorage({
      driver: webStorageDriver(window.localStorage, window),
      namespace: 'web',
    });
    const item = storage.item('theme', { defaultValue: 'light' });
    const listener = vi.fn();
    item.subscribe(listener);
    await item.set('dark');
    expect(window.localStorage.getItem('web:theme')).toBe('{"rns":1,"s":1,"d":"dark"}');
    expect(await storage.keys()).toEqual(['theme']);

    // Another tab writes: the browser updates localStorage and fires a storage event.
    window.localStorage.setItem('web:theme', '{"rns":1,"s":1,"d":"sepia"}');
    window.dispatchEvent(new StorageEvent('storage', { key: 'web:theme' }));
    expect(item.getSnapshot().value).toBe('sepia');

    // Another tab clears everything: the event has no key.
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(item.getSnapshot().value).toBe('light');
    storage.dispose();
  });

  it('reports a quota error as a driver error and keeps the old value', async () => {
    const full = {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    const item = createStorage({ driver: webStorageDriver(full) }).item('a', { defaultValue: 1 });
    await expect(item.set(2)).rejects.toMatchObject({ code: 'DRIVER_ERROR' });
    expect(item.getSnapshot().value).toBe(1);
  });
});

describe('secureStoreDriver', () => {
  const SAFE = /^[A-Za-z0-9._-]+$/;

  it('writes keys SecureStore accepts and maps different keys to different names', () => {
    const samples = ['app:token', 'a_b', 'a__b', 'a_5f_b', 'ş', '🙂', 'a b', 'A.b-c', '_', '__'];
    const encoded = samples.map(encodeSecureStoreKey);
    for (const key of encoded) expect(key).toMatch(SAFE);
    expect(new Set(encoded).size).toBe(samples.length);
    expect(encodeSecureStoreKey('app:token')).toBe('app_3a_token');
  });

  it('stays collision-free on random keys', () => {
    let seed = 3;
    const seen = new Map<string, string>();
    for (let round = 0; round < 5_000; round += 1) {
      let key = '';
      for (let index = 0; index < 4; index += 1) {
        seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
        key += '_:a5f'[seed % 5];
      }
      const encoded = encodeSecureStoreKey(key);
      expect(seen.get(encoded) ?? key).toBe(key);
      seen.set(encoded, key);
    }
  });

  it('passes options through, limits values to 2048 bytes and cannot list keys', async () => {
    const data = new Map<string, string>();
    const options = { keychainAccessible: 1 };
    const secureStore = {
      getItemAsync: vi.fn(async (key: string) => data.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => void data.set(key, value)),
      deleteItemAsync: vi.fn(async (key: string) => void data.delete(key)),
    };
    const storage = createStorage({
      driver: secureStoreDriver(secureStore, options),
      namespace: 'auth',
    });
    expect(storage.maxValueBytes).toBe(SECURE_STORE_MAX_VALUE_BYTES);
    const token = storage.item<string>('token');
    await token.set('abc');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_3a_token',
      expect.any(String),
      options,
    );
    expect(await token.get()).toBe('abc');
    await expect(token.set('x'.repeat(3_000))).rejects.toMatchObject({ code: 'VALUE_TOO_LARGE' });
    await expect(storage.keys()).rejects.toMatchObject({ code: 'UNSUPPORTED' });
    await token.remove();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('auth_3a_token', options);
  });
});

describe('asyncStorageDriver', () => {
  it('works with and without getAllKeys', async () => {
    const data = new Map<string, string>();
    const base = {
      getItem: async (key: string) => data.get(key) ?? null,
      setItem: async (key: string, value: string) => void data.set(key, value),
      removeItem: async (key: string) => void data.delete(key),
    };
    const listed = createStorage({
      driver: asyncStorageDriver({ ...base, getAllKeys: async () => [...data.keys()] }),
    });
    await listed.item('a').set(1);
    expect(await listed.keys()).toEqual(['a']);
    expect(
      await createStorage({ driver: asyncStorageDriver(base) })
        .item('a')
        .get(),
    ).toBe(1);
    await expect(createStorage({ driver: asyncStorageDriver(base) }).clear()).rejects.toMatchObject(
      {
        code: 'UNSUPPORTED',
      },
    );
  });
});
