import type { AsyncStorageDriver } from '../driver';

/**
 * The part of `@react-native-async-storage/async-storage` the driver uses: the version 3
 * instance from `createAsyncStorage(name)` and the version 2 default export both match it.
 */
export interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<readonly string[]>;
}

/**
 * An asynchronous driver on top of AsyncStorage.
 *
 * ```ts
 * import { createAsyncStorage } from '@react-native-async-storage/async-storage';
 * const driver = asyncStorageDriver(createAsyncStorage('app'));
 * ```
 */
export function asyncStorageDriver(asyncStorage: AsyncStorageLike): AsyncStorageDriver {
  const driver: AsyncStorageDriver = {
    name: 'async-storage',
    sync: false,
    getItem: (key) => asyncStorage.getItem(key),
    setItem: (key, value) => asyncStorage.setItem(key, value),
    removeItem: (key) => asyncStorage.removeItem(key),
  };
  if (typeof asyncStorage.getAllKeys !== 'function') return driver;
  return { ...driver, getAllKeys: () => asyncStorage.getAllKeys!() };
}
