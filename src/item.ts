import { StorageError } from './errors';
import type { StorageDriver } from './driver';
import type { KeyStore } from './keyStore';
import { RecordFormat, type Decoded, type Migration } from './record';
import type { Schema } from './schema';
import type { Storage } from './storage';
import { assertTtl } from './validation';

export type { Migration } from './record';

export interface ItemOptions<T> {
  /** Returned when nothing is stored, the value expired, or stored data could not be read. */
  defaultValue?: T;
  /** Checks values on write and on read: a Standard Schema (Zod, Valibot, ArkType…) or a type guard. */
  schema?: Schema<T>;
  /** Default lifetime of a written value in milliseconds. `set(value, { ttl })` overrides it. */
  ttl?: number;
  /** Schema version written with each value. Raise it when the shape changes. Default 1. */
  version?: number;
  /** `migrations[n]` upgrades a value from version `n - 1` to `n`. */
  migrations?: Readonly<Record<number, Migration>>;
  /**
   * Reads text this library did not write, for example a value saved with plain AsyncStorage
   * before you adopted it. Return the value in the current shape; it is validated and rewritten.
   */
  legacy?: (raw: string) => unknown;
}

/** What `readStored` found: the decoded record, with no fallback to the default value. */
export type StoredValue<T> =
  | { kind: 'missing' }
  | { kind: 'value'; value: T; expired: boolean }
  | { kind: 'error'; error: StorageError };

export type ItemOptionsWithDefault<T> = ItemOptions<T> & { defaultValue: T };

export interface SetOptions {
  /** Lifetime of this value in milliseconds, overriding the item's `ttl`. */
  ttl?: number;
}

/** The state of an item at one moment; the same object is returned until something changes. */
export interface ItemSnapshot<T> {
  /** `loading` until an asynchronous driver answers; `error` when the value could not be read. */
  readonly status: 'loading' | 'ready' | 'error';
  /** The stored value, or the default value while loading, after an error or when absent. */
  readonly value: T;
  readonly error: StorageError | undefined;
  /** When the stored value expires, in milliseconds since the epoch. */
  readonly expiresAt: number | undefined;
}

/** Longest delay a JavaScript timer accepts; a larger delay fires at once. */
const MAX_TIMER_DELAY = 2_147_483_647;

/** The timer functions every React Native, browser and Node runtime has, read at call time. */
interface Timers {
  setTimeout(callback: () => void, delay: number): unknown;
  clearTimeout(handle: unknown): void;
}
const timers = globalThis as unknown as Timers;

function snapshotOf<T>(
  status: ItemSnapshot<T>['status'],
  value: T,
  error?: StorageError,
  expiresAt?: number,
): ItemSnapshot<T> {
  return Object.freeze({ status, value, error, expiresAt });
}

/**
 * One typed value in a {@link Storage}. Create it with `storage.item(name, options)`.
 *
 * `subscribe` and `getSnapshot` follow the contract of React's `useSyncExternalStore`, which is
 * what `useStorageItem` builds on.
 */
export class StorageItem<T> {
  readonly name: string;
  /** The key in the driver, with the namespace. */
  readonly key: string;
  readonly defaultValue: T;
  private readonly storage: Storage;
  private readonly store: KeyStore;
  private readonly format: RecordFormat<T>;
  private readonly ttl: number | undefined;
  private readonly listeners = new Set<() => void>();
  private readonly loadingSnapshot: ItemSnapshot<T>;
  private decodedFor: { raw: string | null; decoded: Decoded<T> } | undefined;
  private snapshot: { source: unknown; expired: boolean; value: ItemSnapshot<T> } | undefined;
  private stopListening: (() => void) | undefined;
  private timer: unknown;

  constructor(storage: Storage, name: string, options: ItemOptions<T>) {
    this.key = storage.fullKey(name);
    this.name = name;
    this.storage = storage;
    this.store = storage.store;
    this.defaultValue = options.defaultValue as T;
    this.format = new RecordFormat(name, options, storage.maxValueBytes);
    if (options.ttl !== undefined) assertTtl(options.ttl, 0);
    this.ttl = options.ttl;
    this.loadingSnapshot = snapshotOf('loading', this.defaultValue);
  }

  /** Reads the value. Unreadable data gives the default value and is reported to `onError`. */
  async get(): Promise<T> {
    const raw = await this.store.read(this.key);
    const decoded = this.decode(raw);
    if (decoded.kind !== 'value') return this.defaultValue;
    if (decoded.expiresAt !== undefined && decoded.expiresAt <= this.storage.now()) {
      await this.cleanUp(raw, () => null);
      return this.defaultValue;
    }
    if (decoded.rewrite) {
      await this.cleanUp(raw, () => this.format.encode(decoded.value, decoded.expiresAt));
    }
    return decoded.value;
  }

  /**
   * Reads what is stored without falling back to the default value and without removing or
   * rewriting anything, for callers that must tell an empty slot from data they cannot use.
   * @internal
   */
  async readStored(): Promise<StoredValue<T>> {
    const raw = await this.store.read(this.key);
    const decoded = this.format.decode(raw);
    if (decoded.kind !== 'value') return decoded;
    const expired = decoded.expiresAt !== undefined && decoded.expiresAt <= this.storage.now();
    return { kind: 'value', value: decoded.value, expired };
  }

  /**
   * The driver behind this item. Items of different storages can share one.
   * @internal
   */
  get driver(): StorageDriver {
    return this.store.driver;
  }

  /**
   * Validates, encodes and saves a value. Pass a function to update from the current value.
   * Rejects with `VALIDATION_FAILED`, `UNSERIALIZABLE`, `VALUE_TOO_LARGE`, `INVALID_OPTION` or
   * `DRIVER_ERROR`; nothing is written then.
   */
  async set(value: T | ((current: T) => T), options: SetOptions = {}): Promise<void> {
    const next =
      typeof value === 'function' ? (value as (current: T) => T)(await this.get()) : value;
    const ttl = options.ttl ?? this.ttl;
    const expiresAt = ttl === undefined ? undefined : assertTtl(ttl, this.storage.now());
    this.format.validate(next);
    await this.store.write(this.key, this.format.encode(next, expiresAt));
  }

  /** Deletes the stored value; reads return the default value afterwards. */
  remove(): Promise<void> {
    return this.store.write(this.key, null);
  }

  /** Reads the value into the cache, so `getSnapshot` stops reporting `loading`. */
  async load(): Promise<void> {
    try {
      await this.get();
    } catch {
      // The failure is in the snapshot (`status: 'error'`); `get()` rethrows it for callers.
    }
  }

  /** The current state, without waiting. For `useSyncExternalStore`. */
  readonly getSnapshot = (): ItemSnapshot<T> => {
    const lookup = this.store.peek(this.key);
    if (lookup.state === 'hit') return this.snapshotFor(lookup.raw);
    if (lookup.state === 'failed') return this.snapshotFor(lookup.error);
    if (!this.store.driver.sync) return this.loadingSnapshot;
    try {
      return this.snapshotFor(this.store.readSync(this.key));
    } catch (error) {
      return this.snapshotFor(error as StorageError);
    }
  };

  /** Calls `listener` after every change. For `useSyncExternalStore`. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.stopListening = this.store.subscribe(this.key, () => this.emit());
      this.scheduleExpiry();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size > 0) return;
      this.stopListening?.();
      this.stopListening = undefined;
      this.clearTimer();
    };
  };

  private emit(): void {
    this.scheduleExpiry();
    for (const listener of [...this.listeners]) listener();
  }

  private snapshotFor(source: string | null | StorageError): ItemSnapshot<T> {
    if (source instanceof StorageError) {
      if (this.snapshot?.source !== source) {
        const value = snapshotOf('error', this.defaultValue, source);
        this.snapshot = { source, expired: false, value };
      }
      return this.snapshot.value;
    }
    const decoded = this.decode(source);
    const expired =
      decoded.kind === 'value' &&
      decoded.expiresAt !== undefined &&
      decoded.expiresAt <= this.storage.now();
    if (this.snapshot?.source === decoded && this.snapshot.expired === expired) {
      return this.snapshot.value;
    }
    let value: ItemSnapshot<T>;
    if (decoded.kind === 'error') value = snapshotOf('error', this.defaultValue, decoded.error);
    else if (decoded.kind === 'missing' || expired) value = snapshotOf('ready', this.defaultValue);
    else value = snapshotOf('ready', decoded.value, undefined, decoded.expiresAt);
    this.snapshot = { source: decoded, expired, value };
    return value;
  }

  /** Decodes stored text once per distinct text; reports unreadable data to `onError` once. */
  private decode(raw: string | null): Decoded<T> {
    if (this.decodedFor?.raw === raw) return this.decodedFor.decoded;
    const decoded = this.format.decode(raw);
    if (decoded.kind === 'error') this.storage.report(decoded.error);
    this.decodedFor = { raw, decoded };
    return decoded;
  }

  /** Removes an expired value or rewrites a migrated one, unless it changed in the meantime. */
  private async cleanUp(expected: string | null, next: () => string | null): Promise<void> {
    const lookup = this.store.peek(this.key);
    if (lookup.state === 'hit' && lookup.raw !== expected) return;
    try {
      await this.store.write(this.key, next());
    } catch (error) {
      this.storage.report(error as StorageError);
    }
  }

  private scheduleExpiry(): void {
    this.clearTimer();
    if (this.listeners.size === 0) return;
    const { expiresAt } = this.getSnapshot();
    if (expiresAt === undefined) return;
    // A delay past the timer limit wakes up early; `emit` then schedules the rest.
    const delay = Math.min(Math.max(expiresAt - this.storage.now(), 0) + 1, MAX_TIMER_DELAY);
    this.timer = timers.setTimeout(() => {
      this.timer = undefined;
      this.emit();
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer === undefined) return;
    timers.clearTimeout(this.timer);
    this.timer = undefined;
  }
}
