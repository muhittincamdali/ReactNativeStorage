import { IStorage, StorageConfig, StorageEntry } from '../types';
import { createDefaultConfig } from './StorageConfig';
import { JsonSerializer } from '../utils/serializer';

type MMKVInstance = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
};

export class Storage implements IStorage {
  private mmkv: MMKVInstance | null = null;
  private config: StorageConfig;
  private serializer: JsonSerializer;
  private memoryCache: Map<string, StorageEntry> = new Map();
  private initialized = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = createDefaultConfig(config);
    this.serializer = (this.config.serializer as JsonSerializer) ?? new JsonSerializer();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { MMKV } = require('react-native-mmkv');
      this.mmkv = new MMKV({
        id: this.config.instanceId ?? 'default-storage',
        encryptionKey: this.config.encryptionKey,
      });
      this.initialized = true;
      this.log('Storage initialized with MMKV backend');
    } catch (error) {
      throw new StorageInitError(
        `Failed to initialize MMKV: ${(error as Error).message}`
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.mmkv) {
      throw new StorageInitError('Storage not initialized. Call initialize() first.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    const cached = this.memoryCache.get(key);
    if (cached && !this.isExpired(cached)) {
      this.log(`Cache hit for key: ${key}`);
      return cached.value as T;
    }

    const raw = this.mmkv!.getString(key);
    if (raw === undefined) return null;

    try {
      const entry = this.serializer.deserialize<StorageEntry<T>>(raw);
      if (this.isExpired(entry)) {
        await this.remove(key);
        return null;
      }
      this.memoryCache.set(key, entry as StorageEntry);
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.ensureInitialized();

    const entry: StorageEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
    };

    const serialized = this.serializer.serialize(entry);
    this.mmkv!.set(key, serialized);
    this.memoryCache.set(key, entry as StorageEntry);
    this.log(`Set key: ${key}`);
  }

  async remove(key: string): Promise<void> {
    this.ensureInitialized();
    this.mmkv!.delete(key);
    this.memoryCache.delete(key);
    this.log(`Removed key: ${key}`);
  }

  async clear(): Promise<void> {
    this.ensureInitialized();
    this.mmkv!.clearAll();
    this.memoryCache.clear();
    this.log('Storage cleared');
  }

  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    return this.mmkv!.contains(key);
  }

  async keys(): Promise<string[]> {
    this.ensureInitialized();
    return this.mmkv!.getAllKeys();
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      results.set(key, value);
    });
    await Promise.all(promises);
    return results;
  }

  async setMultiple<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(({ key, value, ttl }) => this.set(key, value, ttl));
    await Promise.all(promises);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async increment(key: string, amount = 1): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + amount;
    await this.set(key, next);
    return next;
  }

  getCacheSize(): number {
    return this.memoryCache.size;
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  private isExpired(entry: StorageEntry): boolean {
    if (!entry.ttl || entry.ttl === 0) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.warn(`[Storage] ${message}`);
    }
  }
}

export class StorageInitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageInitError';
  }
}
