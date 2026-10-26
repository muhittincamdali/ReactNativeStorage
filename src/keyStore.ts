import type { StorageDriver } from './driver';
import { StorageError } from './errors';

/** Result of looking a key up in the cache, without touching the driver. */
export type CacheLookup =
  | { state: 'hit'; raw: string | null }
  | { state: 'miss' }
  | { state: 'failed'; error: StorageError };

interface PendingWrites {
  sequence: number;
  /** Last value known to be in the backend; `undefined` when it was never read. */
  confirmed: string | null | undefined;
  tail: Promise<void>;
}

/**
 * The stored text of each key, between the items and the driver: a bounded cache, one shared
 * read per key, ordered writes per key and change listeners. Internal; items use it through
 * their storage.
 */
export class KeyStore {
  private readonly cache = new Map<string, string | null>();
  private readonly failures = new Map<string, StorageError>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly loads = new Map<string, Promise<string | null>>();
  private readonly pending = new Map<string, PendingWrites>();

  constructor(
    readonly driver: StorageDriver,
    private readonly cacheSize: number,
    /** Turns a full key into the name used in error messages. */
    private readonly nameOf: (key: string | undefined) => string | undefined,
  ) {}

  /** Cache lookup that never calls the driver. */
  peek(key: string): CacheLookup {
    if (this.cache.has(key)) return { state: 'hit', raw: this.cache.get(key) ?? null };
    const error = this.failures.get(key);
    return error ? { state: 'failed', error } : { state: 'miss' };
  }

  /** Reads through the cache from a synchronous driver. */
  readSync(key: string): string | null {
    const lookup = this.peek(key);
    if (lookup.state === 'hit') return lookup.raw;
    if (!this.driver.sync) throw new StorageError('UNSUPPORTED', 'The driver is asynchronous');
    const driver = this.driver;
    let raw: string | null;
    try {
      raw = this.callSync('read', key, () => driver.getItem(key));
    } catch (error) {
      // Kept so snapshots stay the same object until a retry, as useSyncExternalStore needs.
      this.fail(key, error as StorageError);
      throw error;
    }
    this.remember(key, raw);
    if (this.failures.delete(key)) this.notify(key);
    return raw;
  }

  /** Reads through the cache; concurrent reads of one key share one driver call. */
  read(key: string): Promise<string | null> {
    const lookup = this.peek(key);
    if (lookup.state === 'hit') return Promise.resolve(lookup.raw);
    if (this.driver.sync) {
      try {
        return Promise.resolve(this.readSync(key));
      } catch (error) {
        return Promise.reject(error);
      }
    }
    const inFlight = this.loads.get(key);
    if (inFlight) return inFlight;
    this.failures.delete(key);
    const load = this.call('read', key, () => this.driver.getItem(key)).then(
      (raw) => {
        // A write started meanwhile: its value is newer than what this read returned.
        if (this.loads.get(key) !== load) {
          const current = this.peek(key);
          return current.state === 'hit' ? current.raw : raw;
        }
        this.loads.delete(key);
        this.remember(key, raw);
        this.notify(key);
        return raw;
      },
      (error: unknown) => {
        if (this.loads.get(key) === load) {
          this.loads.delete(key);
          this.fail(key, error as StorageError);
          this.notify(key);
        }
        throw error;
      },
    );
    this.loads.set(key, load);
    return load;
  }

  /**
   * Updates the cache at once, then writes to the driver. Writes to one key reach an
   * asynchronous driver in call order; when the newest one fails, the cache returns to the last
   * value the driver confirmed.
   */
  write(key: string, raw: string | null): Promise<void> {
    const write = () =>
      raw === null ? this.driver.removeItem(key) : this.driver.setItem(key, raw);
    const operation = raw === null ? 'remove' : 'write';
    this.loads.delete(key);
    this.failures.delete(key);
    if (!this.driver.sync) return this.queueWrite(key, raw, operation, write);
    const previous = this.peek(key);
    // Cached first: a driver that reports its own writes (MMKV) then finds nothing new.
    this.remember(key, raw);
    try {
      this.callSync(operation, key, write);
    } catch (error) {
      if (previous.state === 'hit') this.remember(key, previous.raw);
      else this.cache.delete(key);
      return Promise.reject(error);
    }
    this.notify(key);
    return Promise.resolve();
  }

  private queueWrite(
    key: string,
    raw: string | null,
    operation: string,
    write: () => unknown,
  ): Promise<void> {
    const lookup = this.peek(key);
    const state: PendingWrites = this.pending.get(key) ?? {
      sequence: 0,
      confirmed: lookup.state === 'hit' ? lookup.raw : undefined,
      tail: Promise.resolve(),
    };
    state.sequence += 1;
    const sequence = state.sequence;
    this.pending.set(key, state);
    this.remember(key, raw);
    this.notify(key);
    const result = state.tail.then(() => this.call(operation, key, write));
    const settled = result.then(
      () => {
        state.confirmed = raw;
      },
      () => {
        if (state.sequence !== sequence) return;
        if (state.confirmed === undefined) this.cache.delete(key);
        else this.remember(key, state.confirmed);
        this.notify(key);
      },
    );
    state.tail = settled;
    void settled.then(() => {
      if (this.pending.get(key) === state && state.sequence === sequence) this.pending.delete(key);
    });
    return result.then(() => undefined);
  }

  subscribe(key: string, listener: () => void): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      const current = this.listeners.get(key);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.listeners.delete(key);
    };
  }

  /** Called by the driver for changes made outside this storage; `null` means every key. */
  externalChange(key: string | null): void {
    if (key === null) {
      const known = new Set([
        ...this.cache.keys(),
        ...this.listeners.keys(),
        ...this.failures.keys(),
      ]);
      for (const each of known) this.externalChange(each);
      return;
    }
    if (!this.cache.has(key) && !this.listeners.has(key) && !this.failures.has(key)) return;
    if (this.pending.has(key)) return;
    const before = this.peek(key);
    this.failures.delete(key);
    this.loads.delete(key);
    this.cache.delete(key);
    if (this.driver.sync) {
      try {
        const raw = this.readSync(key);
        if (before.state === 'hit' && before.raw === raw) return;
      } catch {
        // The failure is cached; listeners read it from their snapshot.
      }
    }
    this.notify(key);
  }

  /** Records a failed read; the oldest unwatched failures go once there are more than cached keys. */
  private fail(key: string, error: StorageError): void {
    this.failures.delete(key);
    this.failures.set(key, error);
    const limit = Math.max(this.cacheSize, 1);
    for (const candidate of this.failures.keys()) {
      if (this.failures.size <= limit) break;
      if (!this.listeners.has(candidate)) this.failures.delete(candidate);
    }
  }

  private notify(key: string): void {
    const set = this.listeners.get(key);
    if (!set) return;
    for (const listener of [...set]) listener();
  }

  /** Puts `raw` at the young end of the cache and evicts old keys nobody watches or writes. */
  private remember(key: string, raw: string | null): void {
    this.cache.delete(key);
    this.cache.set(key, raw);
    if (this.cache.size <= this.cacheSize) return;
    for (const candidate of this.cache.keys()) {
      if (this.cache.size <= this.cacheSize) break;
      if (this.listeners.has(candidate) || this.pending.has(candidate)) continue;
      this.cache.delete(candidate);
    }
  }

  private driverError(operation: string, key: string | undefined, cause: unknown): StorageError {
    if (cause instanceof StorageError) return cause;
    const name = this.nameOf(key);
    const target = name === undefined ? '' : ` "${name}"`;
    return new StorageError(
      'DRIVER_ERROR',
      `The ${this.driver.name} driver failed to ${operation}${target}`,
      {
        key: name,
        cause,
      },
    );
  }

  callSync<R>(operation: string, key: string | undefined, run: () => R): R {
    try {
      return run();
    } catch (error) {
      throw this.driverError(operation, key, error);
    }
  }

  async call<R>(operation: string, key: string | undefined, run: () => R | Promise<R>): Promise<R> {
    try {
      return await run();
    } catch (error) {
      throw this.driverError(operation, key, error);
    }
  }
}
