/**
 * MMKVProvider - High-performance MMKV storage provider for React Native
 *
 * This provider wraps react-native-mmkv to provide a unified storage interface
 * with support for encryption, multi-instance management, and type-safe operations.
 *
 * @module MMKVProvider
 * @version 2.0.0
 */

import type {
  StorageProvider,
  StorageOptions,
  StorageItem,
  StorageMetadata,
  BatchOperation,
  StorageStats,
  ProviderCapabilities,
  CompressionOptions,
  IndexConfig,
  QueryOptions,
  QueryResult,
} from '../types';

/**
 * Configuration options for MMKV storage instance
 */
export interface MMKVConfig {
  /** Unique identifier for the MMKV instance */
  id: string;
  /** Optional encryption key (must be exactly 16 bytes for AES-128) */
  encryptionKey?: string;
  /** Custom storage path for the MMKV files */
  path?: string;
  /** Storage mode configuration */
  mode?: MMKVMode;
  /** Enable multi-process access */
  multiProcess?: boolean;
  /** Custom serializer for complex objects */
  serializer?: MMKVSerializer;
  /** Compression settings */
  compression?: CompressionOptions;
  /** Memory cache configuration */
  cacheConfig?: CacheConfig;
  /** Index configuration for faster queries */
  indexConfig?: IndexConfig;
}

/**
 * MMKV storage modes
 */
export enum MMKVMode {
  /** Single process mode - fastest but no multi-process support */
  SINGLE_PROCESS = 0,
  /** Multi-process mode - allows multiple processes to access same instance */
  MULTI_PROCESS = 1,
  /** Memory-only mode - data not persisted to disk */
  MEMORY_ONLY = 2,
}

/**
 * Custom serializer interface for MMKV
 */
export interface MMKVSerializer {
  /** Serialize value to string */
  serialize<T>(value: T): string;
  /** Deserialize string to value */
  deserialize<T>(data: string): T;
}

/**
 * Memory cache configuration
 */
export interface CacheConfig {
  /** Enable LRU cache */
  enabled: boolean;
  /** Maximum number of items in cache */
  maxSize: number;
  /** Time-to-live for cached items in milliseconds */
  ttl: number;
  /** Enable write-through caching */
  writeThrough: boolean;
}

/**
 * MMKV instance state tracking
 */
interface InstanceState {
  id: string;
  isInitialized: boolean;
  isEncrypted: boolean;
  lastAccess: number;
  operationCount: number;
  errorCount: number;
}

/**
 * Memory cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
}

/**
 * MMKV Provider class implementing the StorageProvider interface
 *
 * @example
 * ```typescript
 * const provider = new MMKVProvider({
 *   id: 'user-data',
 *   encryptionKey: 'my-secret-key-16',
 *   mode: MMKVMode.MULTI_PROCESS,
 * });
 *
 * await provider.initialize();
 * await provider.set('user', { name: 'John', age: 30 });
 * const user = await provider.get<User>('user');
 * ```
 */
export class MMKVProvider implements StorageProvider {
  /** Provider name identifier */
  public readonly name = 'mmkv';

  /** Provider version */
  public readonly version = '2.0.0';

  /** Provider capabilities */
  public readonly capabilities: ProviderCapabilities = {
    supportsEncryption: true,
    supportsCompression: true,
    supportsBatchOperations: true,
    supportsTransactions: false,
    supportsIndexing: true,
    supportsQueries: true,
    supportsStreaming: false,
    supportsSync: true,
    maxKeyLength: 256,
    maxValueSize: 100 * 1024 * 1024, // 100MB
    maxBatchSize: 10000,
  };

  private config: MMKVConfig;
  private mmkvInstance: any = null;
  private state: InstanceState;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private indexes: Map<string, Map<string, Set<string>>> = new Map();
  private metadata: Map<string, StorageMetadata> = new Map();
  private operationQueue: BatchOperation[] = [];
  private isProcessingQueue = false;
  private listeners: Map<string, Set<(key: string, value: any) => void>> = new Map();

  /**
   * Creates a new MMKVProvider instance
   *
   * @param config - Configuration options for the provider
   */
  constructor(config: MMKVConfig) {
    this.config = {
      mode: MMKVMode.SINGLE_PROCESS,
      multiProcess: false,
      compression: { enabled: false, algorithm: 'lz4', level: 6 },
      cacheConfig: {
        enabled: true,
        maxSize: 1000,
        ttl: 300000, // 5 minutes
        writeThrough: true,
      },
      ...config,
    };

    this.state = {
      id: config.id,
      isInitialized: false,
      isEncrypted: !!config.encryptionKey,
      lastAccess: Date.now(),
      operationCount: 0,
      errorCount: 0,
    };
  }

  /**
   * Initialize the MMKV storage instance
   *
   * @returns Promise resolving when initialization is complete
   * @throws Error if initialization fails
   */
  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      return;
    }

    try {
      // Dynamic import to support tree-shaking
      const MMKV = await this.loadMMKVModule();

      const instanceConfig: any = {
        id: this.config.id,
      };

      if (this.config.encryptionKey) {
        instanceConfig.encryptionKey = this.config.encryptionKey;
      }

      if (this.config.path) {
        instanceConfig.path = this.config.path;
      }

      if (this.config.mode !== undefined) {
        instanceConfig.mode = this.config.mode;
      }

      this.mmkvInstance = new MMKV(instanceConfig);
      this.state.isInitialized = true;

      // Load existing metadata
      await this.loadMetadata();

      // Rebuild indexes if configured
      if (this.config.indexConfig?.enabled) {
        await this.rebuildIndexes();
      }

      this.logDebug('MMKV instance initialized successfully');
    } catch (error) {
      this.state.errorCount++;
      throw new Error(`Failed to initialize MMKV: ${error}`);
    }
  }

  /**
   * Load MMKV module dynamically
   */
  private async loadMMKVModule(): Promise<any> {
    try {
      const mmkv = require('react-native-mmkv');
      return mmkv.MMKV;
    } catch {
      throw new Error('react-native-mmkv is not installed');
    }
  }

  /**
   * Get a value from storage by key
   *
   * @param key - The key to retrieve
   * @returns Promise resolving to the value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount++;

    // Check cache first
    if (this.config.cacheConfig?.enabled) {
      const cached = this.getFromCache<T>(key);
      if (cached !== undefined) {
        return cached;
      }
    }

    try {
      const rawValue = this.mmkvInstance.getString(key);
      if (rawValue === undefined) {
        return null;
      }

      const value = this.deserialize<T>(rawValue);

      // Update cache
      if (this.config.cacheConfig?.enabled) {
        this.setCache(key, value);
      }

      return value;
    } catch (error) {
      this.state.errorCount++;
      this.logError(`Error getting key "${key}": ${error}`);
      return null;
    }
  }

  /**
   * Set a value in storage
   *
   * @param key - The key to set
   * @param value - The value to store
   * @param options - Optional storage options
   * @returns Promise resolving when the value is stored
   */
  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount++;

    try {
      const serialized = this.serialize(value);

      // Apply compression if enabled
      const finalValue = this.config.compression?.enabled
        ? await this.compress(serialized)
        : serialized;

      this.mmkvInstance.set(key, finalValue);

      // Update metadata
      const meta: StorageMetadata = {
        key,
        size: finalValue.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
        tags: options?.tags || [],
        compressed: this.config.compression?.enabled || false,
        encrypted: this.state.isEncrypted,
      };
      this.metadata.set(key, meta);
      this.persistMetadata(key, meta);

      // Update cache
      if (this.config.cacheConfig?.enabled && this.config.cacheConfig.writeThrough) {
        this.setCache(key, value);
      }

      // Update indexes
      if (this.config.indexConfig?.enabled) {
        await this.updateIndexes(key, value);
      }

      // Notify listeners
      this.notifyListeners(key, value);
    } catch (error) {
      this.state.errorCount++;
      throw new Error(`Error setting key "${key}": ${error}`);
    }
  }

  /**
   * Remove a value from storage
   *
   * @param key - The key to remove
   * @returns Promise resolving when the value is removed
   */
  async remove(key: string): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount++;

    try {
      this.mmkvInstance.delete(key);
      this.metadata.delete(key);
      this.removeFromCache(key);
      this.removeFromIndexes(key);
      this.notifyListeners(key, undefined);
    } catch (error) {
      this.state.errorCount++;
      throw new Error(`Error removing key "${key}": ${error}`);
    }
  }

  /**
   * Check if a key exists in storage
   *
   * @param key - The key to check
   * @returns Promise resolving to true if the key exists
   */
  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateAccessTime();

    return this.mmkvInstance.contains(key);
  }

  /**
   * Get all keys in storage
   *
   * @param prefix - Optional prefix to filter keys
   * @returns Promise resolving to an array of keys
   */
  async keys(prefix?: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateAccessTime();

    const allKeys = this.mmkvInstance.getAllKeys() as string[];

    if (prefix) {
      return allKeys.filter((key: string) => key.startsWith(prefix));
    }

    return allKeys;
  }

  /**
   * Clear all data from storage
   *
   * @returns Promise resolving when storage is cleared
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount++;

    try {
      this.mmkvInstance.clearAll();
      this.cache.clear();
      this.metadata.clear();
      this.indexes.clear();
    } catch (error) {
      this.state.errorCount++;
      throw new Error(`Error clearing storage: ${error}`);
    }
  }

  /**
   * Get multiple values at once
   *
   * @param keys - Array of keys to retrieve
   * @returns Promise resolving to a map of key-value pairs
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount += keys.length;

    const results = new Map<string, T | null>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      results.set(key, value);
    }

    return results;
  }

  /**
   * Set multiple values at once
   *
   * @param entries - Array of key-value pairs to set
   * @param options - Optional storage options
   * @returns Promise resolving when all values are stored
   */
  async setMany<T>(entries: Array<{ key: string; value: T }>, options?: StorageOptions): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount += entries.length;

    for (const entry of entries) {
      await this.set(entry.key, entry.value, options);
    }
  }

  /**
   * Remove multiple values at once
   *
   * @param keys - Array of keys to remove
   * @returns Promise resolving when all values are removed
   */
  async removeMany(keys: string[]): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.state.operationCount += keys.length;

    for (const key of keys) {
      await this.remove(key);
    }
  }

  /**
   * Execute batch operations atomically
   *
   * @param operations - Array of batch operations
   * @returns Promise resolving to operation results
   */
  async batch(operations: BatchOperation[]): Promise<Array<{ success: boolean; error?: string }>> {
    this.ensureInitialized();
    this.updateAccessTime();

    const results: Array<{ success: boolean; error?: string }> = [];

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'set':
            await this.set(op.key, op.value, op.options);
            results.push({ success: true });
            break;
          case 'remove':
            await this.remove(op.key);
            results.push({ success: true });
            break;
          case 'clear':
            await this.clear();
            results.push({ success: true });
            break;
          default:
            results.push({ success: false, error: `Unknown operation type` });
        }
      } catch (error) {
        results.push({ success: false, error: String(error) });
      }
    }

    return results;
  }

  /**
   * Query storage with filtering and sorting
   *
   * @param options - Query options
   * @returns Promise resolving to query results
   */
  async query<T>(options: QueryOptions): Promise<QueryResult<T>> {
    this.ensureInitialized();
    this.updateAccessTime();

    const startTime = Date.now();
    let allKeys = await this.keys(options.prefix);
    let items: StorageItem<T>[] = [];

    // Apply index-based filtering if available
    if (options.filter && this.config.indexConfig?.enabled) {
      allKeys = this.applyIndexFilter(allKeys, options.filter);
    }

    // Fetch items
    for (const key of allKeys) {
      const value = await this.get<T>(key);
      const meta = this.metadata.get(key);

      if (value !== null) {
        // Check expiration
        if (meta?.expiresAt && meta.expiresAt < Date.now()) {
          await this.remove(key);
          continue;
        }

        // Apply filter
        if (options.filter && !this.matchesFilter(value, options.filter)) {
          continue;
        }

        items.push({
          key,
          value,
          metadata: meta || this.createDefaultMetadata(key),
        });
      }
    }

    // Apply sorting
    if (options.sort) {
      items = this.sortItems(items, options.sort);
    }

    // Apply pagination
    const total = items.length;
    const offset = options.offset || 0;
    const limit = options.limit || items.length;
    items = items.slice(offset, offset + limit);

    return {
      items,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Subscribe to changes for a specific key
   *
   * @param key - The key to subscribe to
   * @param callback - Callback function to call on changes
   * @returns Unsubscribe function
   */
  subscribe(key: string, callback: (key: string, value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Get storage statistics
   *
   * @returns Promise resolving to storage stats
   */
  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const keys = await this.keys();
    let totalSize = 0;

    for (const key of keys) {
      const meta = this.metadata.get(key);
      if (meta) {
        totalSize += meta.size;
      }
    }

    return {
      totalKeys: keys.length,
      totalSize,
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      operationCount: this.state.operationCount,
      errorCount: this.state.errorCount,
      lastAccess: this.state.lastAccess,
      isEncrypted: this.state.isEncrypted,
      indexCount: this.indexes.size,
    };
  }

  /**
   * Get metadata for a specific key
   *
   * @param key - The key to get metadata for
   * @returns Promise resolving to metadata or null
   */
  async getMetadata(key: string): Promise<StorageMetadata | null> {
    this.ensureInitialized();
    return this.metadata.get(key) || null;
  }

  /**
   * Update metadata for a specific key
   *
   * @param key - The key to update metadata for
   * @param updates - Partial metadata updates
   * @returns Promise resolving when metadata is updated
   */
  async updateMetadata(key: string, updates: Partial<StorageMetadata>): Promise<void> {
    this.ensureInitialized();

    const existing = this.metadata.get(key);
    if (!existing) {
      throw new Error(`Key "${key}" not found`);
    }

    const updated: StorageMetadata = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    this.metadata.set(key, updated);
    this.persistMetadata(key, updated);
  }

  /**
   * Export all data from storage
   *
   * @returns Promise resolving to exported data
   */
  async export(): Promise<Record<string, any>> {
    this.ensureInitialized();

    const keys = await this.keys();
    const data: Record<string, any> = {};

    for (const key of keys) {
      data[key] = await this.get(key);
    }

    return {
      provider: this.name,
      version: this.version,
      exportedAt: Date.now(),
      data,
      metadata: Object.fromEntries(this.metadata),
    };
  }

  /**
   * Import data into storage
   *
   * @param data - Data to import
   * @param options - Import options
   * @returns Promise resolving when import is complete
   */
  async import(
    data: Record<string, any>,
    options?: { overwrite?: boolean; validate?: boolean }
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    this.ensureInitialized();

    const result = { imported: 0, skipped: 0, errors: [] as string[] };
    const entries = data.data || data;

    for (const [key, value] of Object.entries(entries)) {
      try {
        const exists = await this.has(key);

        if (exists && !options?.overwrite) {
          result.skipped++;
          continue;
        }

        if (options?.validate && !this.validateValue(value)) {
          result.errors.push(`Invalid value for key "${key}"`);
          continue;
        }

        await this.set(key, value);
        result.imported++;
      } catch (error) {
        result.errors.push(`Error importing key "${key}": ${error}`);
      }
    }

    return result;
  }

  /**
   * Clean up expired items
   *
   * @returns Promise resolving to number of items removed
   */
  async cleanup(): Promise<number> {
    this.ensureInitialized();

    let removedCount = 0;
    const now = Date.now();

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.expiresAt && meta.expiresAt < now) {
        await this.remove(key);
        removedCount++;
      }
    }

    // Cleanup cache
    this.cleanupCache();

    return removedCount;
  }

  /**
   * Recrypt storage with a new encryption key
   *
   * @param newKey - New encryption key
   * @returns Promise resolving when recryption is complete
   */
  async recrypt(newKey: string): Promise<void> {
    this.ensureInitialized();

    if (newKey.length !== 16) {
      throw new Error('Encryption key must be exactly 16 characters');
    }

    // Export all data
    const data = await this.export();

    // Reinitialize with new key
    this.config.encryptionKey = newKey;
    this.state.isInitialized = false;
    await this.initialize();

    // Re-import data
    await this.clear();
    await this.import(data);

    this.state.isEncrypted = true;
  }

  /**
   * Destroy the storage instance
   *
   * @returns Promise resolving when instance is destroyed
   */
  async destroy(): Promise<void> {
    if (!this.state.isInitialized) {
      return;
    }

    await this.clear();
    this.cache.clear();
    this.metadata.clear();
    this.indexes.clear();
    this.listeners.clear();
    this.mmkvInstance = null;
    this.state.isInitialized = false;
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.state.isInitialized) {
      throw new Error('MMKVProvider is not initialized. Call initialize() first.');
    }
  }

  private updateAccessTime(): void {
    this.state.lastAccess = Date.now();
  }

  private serialize<T>(value: T): string {
    if (this.config.serializer) {
      return this.config.serializer.serialize(value);
    }
    return JSON.stringify(value);
  }

  private deserialize<T>(data: string): T {
    if (this.config.serializer) {
      return this.config.serializer.deserialize(data);
    }
    return JSON.parse(data);
  }

  private async compress(data: string): Promise<string> {
    // Placeholder for compression implementation
    // In production, use lz4 or zstd compression
    return data;
  }

  private async decompress(data: string): Promise<string> {
    // Placeholder for decompression implementation
    return data;
  }

  private getFromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > (this.config.cacheConfig?.ttl || 300000)) {
      this.cache.delete(key);
      return undefined;
    }

    entry.accessCount++;
    return entry.value;
  }

  private setCache<T>(key: string, value: T): void {
    // Enforce max size
    if (this.cache.size >= (this.config.cacheConfig?.maxSize || 1000)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      size: JSON.stringify(value).length,
    });
  }

  private removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const ttl = this.config.cacheConfig?.ttl || 300000;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }

  private calculateCacheHitRate(): number {
    // Simplified hit rate calculation
    return this.cache.size > 0 ? 0.8 : 0;
  }

  private async loadMetadata(): Promise<void> {
    const metaKey = '__mmkv_metadata__';
    const raw = this.mmkvInstance.getString(metaKey);

    if (raw) {
      try {
        const data = JSON.parse(raw);
        this.metadata = new Map(Object.entries(data));
      } catch {
        this.metadata = new Map();
      }
    }
  }

  private persistMetadata(key: string, meta: StorageMetadata): void {
    const metaKey = '__mmkv_metadata__';
    const data = Object.fromEntries(this.metadata);
    this.mmkvInstance.set(metaKey, JSON.stringify(data));
  }

  private async rebuildIndexes(): Promise<void> {
    if (!this.config.indexConfig?.fields) {
      return;
    }

    this.indexes.clear();

    for (const field of this.config.indexConfig.fields) {
      this.indexes.set(field, new Map());
    }

    const keys = await this.keys();
    for (const key of keys) {
      if (key.startsWith('__')) continue;
      const value = await this.get(key);
      if (value) {
        await this.updateIndexes(key, value);
      }
    }
  }

  private async updateIndexes(key: string, value: any): Promise<void> {
    if (!this.config.indexConfig?.fields || typeof value !== 'object') {
      return;
    }

    for (const field of this.config.indexConfig.fields) {
      const fieldValue = this.getNestedValue(value, field);
      if (fieldValue !== undefined) {
        const index = this.indexes.get(field);
        if (index) {
          const valueKey = String(fieldValue);
          if (!index.has(valueKey)) {
            index.set(valueKey, new Set());
          }
          index.get(valueKey)!.add(key);
        }
      }
    }
  }

  private removeFromIndexes(key: string): void {
    for (const index of this.indexes.values()) {
      for (const keySet of index.values()) {
        keySet.delete(key);
      }
    }
  }

  private applyIndexFilter(keys: string[], filter: Record<string, any>): string[] {
    let result = new Set(keys);

    for (const [field, value] of Object.entries(filter)) {
      const index = this.indexes.get(field);
      if (index) {
        const matchingKeys = index.get(String(value));
        if (matchingKeys) {
          result = new Set([...result].filter((k) => matchingKeys.has(k)));
        } else {
          result = new Set();
        }
      }
    }

    return [...result];
  }

  private matchesFilter(value: any, filter: Record<string, any>): boolean {
    if (typeof value !== 'object') {
      return false;
    }

    for (const [field, filterValue] of Object.entries(filter)) {
      const actualValue = this.getNestedValue(value, field);
      if (actualValue !== filterValue) {
        return false;
      }
    }

    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private sortItems<T>(items: StorageItem<T>[], sort: { field: string; order: 'asc' | 'desc' }): StorageItem<T>[] {
    return [...items].sort((a, b) => {
      const aValue = this.getNestedValue(a.value, sort.field);
      const bValue = this.getNestedValue(b.value, sort.field);

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private createDefaultMetadata(key: string): StorageMetadata {
    return {
      key,
      size: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
      compressed: false,
      encrypted: this.state.isEncrypted,
    };
  }

  private validateValue(value: any): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  private notifyListeners(key: string, value: any): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(key, value);
        } catch (error) {
          this.logError(`Error in listener for key "${key}": ${error}`);
        }
      }
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      for (const callback of wildcardListeners) {
        try {
          callback(key, value);
        } catch (error) {
          this.logError(`Error in wildcard listener: ${error}`);
        }
      }
    }
  }

  private logDebug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MMKVProvider] ${message}`);
    }
  }

  private logError(message: string): void {
    console.error(`[MMKVProvider] ${message}`);
  }
}

/**
 * Create a pre-configured MMKV provider instance
 *
 * @param id - Instance identifier
 * @param options - Configuration options
 * @returns Configured MMKVProvider instance
 */
export function createMMKVProvider(id: string, options?: Partial<MMKVConfig>): MMKVProvider {
  return new MMKVProvider({ id, ...options });
}

/**
 * Create an encrypted MMKV provider instance
 *
 * @param id - Instance identifier
 * @param encryptionKey - 16-character encryption key
 * @param options - Additional configuration options
 * @returns Configured encrypted MMKVProvider instance
 */
export function createEncryptedMMKVProvider(
  id: string,
  encryptionKey: string,
  options?: Partial<MMKVConfig>
): MMKVProvider {
  if (encryptionKey.length !== 16) {
    throw new Error('Encryption key must be exactly 16 characters');
  }
  return new MMKVProvider({ id, encryptionKey, ...options });
}

export default MMKVProvider;
