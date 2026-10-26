import type { Storage } from './storage';

/**
 * The string key-value interface that state libraries persist through: Zustand's `persist`
 * (`createJSONStorage`), Jotai's `createJSONStorage`, Redux Persist and TanStack Query's
 * `createAsyncStoragePersister` all accept it.
 */
export interface StateStorage {
  getItem(name: string): Promise<string | null>;
  setItem(name: string, value: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Exposes a {@link Storage} as a {@link StateStorage}. Each name becomes an item in the
 * storage's namespace, with the same key checks, size limit and change notifications.
 *
 * ```ts
 * persist(createStore, { name: 'cart', storage: createJSONStorage(() => toStateStorage(storage)) })
 * ```
 */
export function toStateStorage(storage: Storage): StateStorage {
  return {
    getItem: async (name) => (await storage.item(name, { schema: isString }).get()) ?? null,
    setItem: (name, value) => storage.item(name, { schema: isString }).set(value),
    removeItem: (name) => storage.item(name).remove(),
  };
}
