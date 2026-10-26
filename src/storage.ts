import type { StorageDriver } from './driver';
import { peekExpiry } from './envelope';
import { StorageError } from './errors';
import { StorageItem, type ItemOptions, type ItemOptionsWithDefault } from './item';
import { KeyStore } from './keyStore';
import type { InferSchema, Schema } from './schema';
import {
  DEFAULT_CACHE_SIZE,
  DEFAULT_MAX_VALUE_BYTES,
  NAMESPACE_SEPARATOR,
  assertInteger,
  assertKeyName,
  assertNamespace,
} from './validation';

export interface StorageOptions {
  /** Where values are saved: `mmkvDriver(...)`, `asyncStorageDriver(...)`, `memoryDriver()`… */
  driver: StorageDriver;
  /**
   * Prefix for every key (`"app"` stores `theme` as `app:theme`). `keys()` and `clear()` only
   * touch keys with this prefix, so several storages can share one backend.
   */
  namespace?: string;
  /** Largest encoded value in UTF-8 bytes. Default 1 MiB; a driver may lower it. */
  maxValueBytes?: number;
  /** Keys whose stored text stays cached while nothing subscribes to them. Default 500. */
  cacheSize?: number;
  /**
   * Called when stored data cannot be read (corrupt, failed validation, newer version) and the
   * default value is returned instead, or when a background clean-up write fails.
   */
  onError?: (error: StorageError) => void;
  /** Clock used for TTLs, in milliseconds since the epoch. Default `Date.now`. */
  now?: () => number;
}

const MAX_BYTES_LIMIT = 2 ** 31 - 1;
const MAX_CACHE_SIZE = 1_000_000;

/**
 * A namespace in one backend, with a cache that keeps hooks and items in sync.
 *
 * Create one per backend and namespace with {@link createStorage}, then declare typed items
 * with {@link Storage.item}.
 */
export class Storage {
  readonly driver: StorageDriver;
  readonly namespace: string | undefined;
  /** The value limit in effect: the smaller of the option and the driver's own limit. */
  readonly maxValueBytes: number;
  /** @internal */
  readonly store: KeyStore;
  private readonly onError: ((error: StorageError) => void) | undefined;
  private readonly clock: () => number;
  private readonly stopDriverListener: (() => void) | undefined;

  constructor(options: StorageOptions) {
    const { driver } = options;
    if (driver === null || typeof driver !== 'object' || typeof driver.getItem !== 'function') {
      throw new StorageError('INVALID_OPTION', 'driver must be a storage driver');
    }
    if (options.namespace !== undefined) assertNamespace(options.namespace);
    const ownLimit =
      options.maxValueBytes === undefined
        ? DEFAULT_MAX_VALUE_BYTES
        : assertInteger(options.maxValueBytes, 'maxValueBytes', 1, MAX_BYTES_LIMIT);
    const cacheSize =
      options.cacheSize === undefined
        ? DEFAULT_CACHE_SIZE
        : assertInteger(options.cacheSize, 'cacheSize', 0, MAX_CACHE_SIZE);
    this.driver = driver;
    this.namespace = options.namespace;
    const driverLimit =
      driver.maxValueBytes === undefined
        ? MAX_BYTES_LIMIT
        : assertInteger(driver.maxValueBytes, 'driver.maxValueBytes', 1, MAX_BYTES_LIMIT);
    this.maxValueBytes = Math.min(ownLimit, driverLimit);
    this.onError = options.onError;
    this.clock = options.now ?? Date.now;
    this.store = new KeyStore(driver, cacheSize, (key) => this.nameOf(key));
    this.stopDriverListener = driver.subscribe?.((key) => this.store.externalChange(key));
  }

  /**
   * Declares a typed value stored under `name`. Cheap: call it once at module level.
   *
   * With a `schema`, the item's type is the schema's output and `defaultValue` must match it.
   * Without one, pass the type (`storage.item<string>('token')`) or let `defaultValue` set it.
   */
  item<S extends Schema<unknown>>(
    name: string,
    options: ItemOptionsWithDefault<InferSchema<S>> & { schema: S },
  ): StorageItem<InferSchema<S>>;
  item<S extends Schema<unknown>>(
    name: string,
    options: ItemOptions<InferSchema<S>> & { schema: S },
  ): StorageItem<InferSchema<S> | undefined>;
  item<T>(name: string, options: ItemOptionsWithDefault<T>): StorageItem<T>;
  item<T>(name: string, options?: ItemOptions<T>): StorageItem<T | undefined>;
  item<T>(name: string, options: ItemOptions<T> = {}): StorageItem<T | undefined> {
    return new StorageItem<T | undefined>(this, name, options as ItemOptions<T | undefined>);
  }

  /** The key under which the driver stores `name`. Throws `INVALID_KEY` for a bad name. */
  fullKey(name: string): string {
    assertKeyName(name);
    return this.namespace === undefined ? name : `${this.prefix()}${name}`;
  }

  /** Names (without the namespace) of every stored key in this namespace. */
  async keys(): Promise<string[]> {
    return (await this.fullKeys()).map((key) => this.nameOf(key)!);
  }

  /** Removes every key in this namespace (every key, without a namespace). Returns the count. */
  async clear(): Promise<number> {
    const keys = await this.fullKeys();
    await Promise.all(keys.map((key) => this.store.write(key, null)));
    return keys.length;
  }

  /** Removes values whose TTL has passed. Returns how many were removed. */
  async purgeExpired(): Promise<number> {
    const now = this.now();
    let removed = 0;
    for (const key of await this.fullKeys()) {
      const raw = await this.store.read(key);
      // Text longer than the limit was not written by this storage; it is not parsed.
      if (raw === null || raw.length > this.maxValueBytes) continue;
      const expiresAt = peekExpiry(raw);
      if (expiresAt !== undefined && expiresAt <= now) {
        await this.store.write(key, null);
        removed += 1;
      }
    }
    return removed;
  }

  /** Stops listening to the driver. Items keep working but no longer see outside changes. */
  dispose(): void {
    this.stopDriverListener?.();
  }

  /** @internal */
  now(): number {
    const now = this.clock();
    if (!Number.isFinite(now)) {
      throw new StorageError('INVALID_OPTION', 'now() must return a finite number of milliseconds');
    }
    return now;
  }

  /** @internal Passes an error to `onError`, outside the current call stack. */
  report(error: StorageError): void {
    const onError = this.onError;
    if (!onError) return;
    // Deferred so a callback never runs inside a React render.
    void Promise.resolve().then(() => onError(error));
  }

  private prefix(): string {
    return `${this.namespace}${NAMESPACE_SEPARATOR}`;
  }

  private nameOf(key: string | undefined): string | undefined {
    if (key === undefined || this.namespace === undefined) return key;
    return key.slice(this.prefix().length);
  }

  private async fullKeys(): Promise<string[]> {
    const all = await this.store.call('list keys', undefined, () => {
      if (!this.driver.getAllKeys) {
        throw new StorageError('UNSUPPORTED', `The ${this.driver.name} driver cannot list keys`);
      }
      return this.driver.getAllKeys();
    });
    if (this.namespace === undefined) return [...all];
    const prefix = this.prefix();
    return all.filter((key) => key.startsWith(prefix));
  }
}

/** Creates a {@link Storage} on top of a driver. */
export function createStorage(options: StorageOptions): Storage {
  return new Storage(options);
}
