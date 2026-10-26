/**
 * The contract between a {@link Storage} and the place it saves text: MMKV, AsyncStorage,
 * SecureStore, `localStorage` or memory. Keys and values are plain strings; the storage adds
 * the namespace, encoding, validation and expiry on top.
 *
 * A driver is either synchronous (`sync: true`, every method returns its result directly) or
 * asynchronous (every method may return a promise). Synchronous drivers let React hooks show
 * the stored value on the first render.
 */
export type StorageDriver = SyncStorageDriver | AsyncStorageDriver;

interface DriverBase {
  /** Human-readable name used in error messages, for example `"mmkv"`. */
  readonly name: string;
  /**
   * The largest value, in UTF-8 bytes, this backend stores reliably. The storage uses the
   * smaller of this and its own `maxValueBytes`.
   */
  readonly maxValueBytes?: number;
  /**
   * Calls `listener` with the full key when a value changes outside this storage, for example
   * through the same MMKV instance or in another browser tab; `null` means every key may have
   * changed. Returns a function that stops listening.
   */
  subscribe?(listener: (key: string | null) => void): () => void;
}

export interface SyncStorageDriver extends DriverBase {
  readonly sync: true;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Every key in the backend. Optional: without it, `keys()` and `clear()` throw `UNSUPPORTED`. */
  getAllKeys?(): readonly string[];
}

export interface AsyncStorageDriver extends DriverBase {
  readonly sync: false;
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
  getAllKeys?(): Promise<readonly string[]> | readonly string[];
}

/**
 * A driver that keeps everything in a `Map`. Use it in tests, on a server render, or as a
 * fallback when no persistent backend is available. Data is lost when the process ends.
 */
export function memoryDriver(initial?: Iterable<readonly [string, string]>): SyncStorageDriver & {
  /** The backing map, for assertions in tests. */
  readonly data: Map<string, string>;
} {
  const data = new Map<string, string>(initial);
  return {
    name: 'memory',
    sync: true,
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    getAllKeys: () => [...data.keys()],
  };
}
