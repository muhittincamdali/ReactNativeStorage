import type { SyncStorageDriver } from '../driver';

/** The part of the Web Storage API (`localStorage`, `sessionStorage`) the driver uses. */
export interface WebStorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The part of `window` that reports changes made in other tabs. */
export interface StorageEventTarget {
  addEventListener(type: 'storage', listener: (event: { key: string | null }) => void): void;
  removeEventListener(type: 'storage', listener: (event: { key: string | null }) => void): void;
}

/**
 * A synchronous driver on top of `localStorage` or `sessionStorage`, for React Native Web and
 * Expo web. Pass `window` as `events` to see changes made in other tabs.
 *
 * ```ts
 * const driver = webStorageDriver(window.localStorage, window);
 * ```
 */
export function webStorageDriver(
  storage: WebStorageLike,
  events?: StorageEventTarget,
): SyncStorageDriver {
  const driver: SyncStorageDriver = {
    name: 'web-storage',
    sync: true,
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    getAllKeys: () => {
      const keys: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null) keys.push(key);
      }
      return keys;
    },
  };
  if (!events) return driver;
  return {
    ...driver,
    subscribe: (listener) => {
      // A `null` key means another tab called clear().
      const handler = (event: { key: string | null }): void => listener(event.key);
      events.addEventListener('storage', handler);
      return () => events.removeEventListener('storage', handler);
    },
  };
}
