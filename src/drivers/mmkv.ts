import type { SyncStorageDriver } from '../driver';

/**
 * The part of a `react-native-mmkv` instance the driver uses. Version 4 (`createMMKV()`) and
 * version 3 (`new MMKV()`) both match it.
 */
export interface MMKVLike {
  set(key: string, value: string): void;
  getString(key: string): string | undefined;
  getAllKeys(): string[];
  /** Version 4. */
  remove?(key: string): unknown;
  /** Version 3. */
  delete?(key: string): void;
  addOnValueChangedListener?(listener: (key: string) => void): { remove(): void };
}

/**
 * A synchronous driver on top of an MMKV instance.
 *
 * ```ts
 * import { createMMKV } from 'react-native-mmkv';
 * const driver = mmkvDriver(createMMKV({ id: 'app' }));
 * ```
 *
 * Changes made through the same MMKV instance elsewhere in the app (for example by code that
 * calls `mmkv.set` directly) reach subscribed items through MMKV's change listener.
 */
export function mmkvDriver(mmkv: MMKVLike): SyncStorageDriver {
  const remove = (key: string): void => {
    if (typeof mmkv.remove === 'function') mmkv.remove(key);
    else if (typeof mmkv.delete === 'function') mmkv.delete(key);
    else throw new TypeError('The MMKV instance has neither remove() nor delete()');
  };
  const driver: SyncStorageDriver = {
    name: 'mmkv',
    sync: true,
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => mmkv.set(key, value),
    removeItem: remove,
    getAllKeys: () => mmkv.getAllKeys(),
  };
  const addListener = mmkv.addOnValueChangedListener;
  if (typeof addListener !== 'function') return driver;
  return {
    ...driver,
    subscribe: (listener) => {
      const subscription = addListener.call(mmkv, listener);
      return () => subscription.remove();
    },
  };
}
