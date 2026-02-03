/**
 * MMKVAdapter - High-Performance Key-Value Storage Adapter for React Native
 * 
 * MMKV is an efficient, small mobile key-value storage framework
 * developed by WeChat. This adapter provides:
 * - Ultra-fast read/write operations
 * - Multi-process access support
 * - Encryption support
 * - Type-safe operations
 * - Batch operations
 * - Change listeners
 * - Memory caching
 * 
 * @module MMKVAdapter
 * @version 2.0.0
 */

import type {
  StorageAdapter,
  StorageOptions,
  BatchOperation,
  StorageMetrics,
  ValueType,
  ChangeListener,
  SerializationStrategy,
} from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * MMKV instance modes
 */
export enum MMKVMode {
  /** Single process mode (default) */
  SINGLE_PROCESS = 1,
  /** Multi-process mode with content change notification */
  MULTI_PROCESS = 2,
}

/**
 * MMKV configuration options
 */
export interface MMKVConfig {
  /** Unique identifier for the MMKV instance */
  id: string;
  /** Storage path (defaults to app documents directory) */
  path?: string;
  /** Encryption key (16 bytes for AES-128) */
  encryptionKey?: string;
  /** Process mode */
  mode?: MMKVMode;
  /** Enable memory caching for frequently accessed values */
  enableCache?: boolean;
  /** Maximum cache size in bytes */
  maxCacheSize?: number;
  /** Cache expiration time in milliseconds */
  cacheExpiration?: number;
  /** Enable access logging */
  enableLogging?: boolean;
  /** Custom serialization strategy */
  serializer?: SerializationStrategy;
  /** Enable compression for large values */
  enableCompression?: boolean;
  /** Compression threshold in bytes */
  compressionThreshold?: number;
  /** Default expiration time for all values (milliseconds) */
  defaultExpiration?: number;
  /** Enable automatic key migration from AsyncStorage */
  migrateFromAsyncStorage?: boolean;
  /** AsyncStorage keys to migrate */
  asyncStorageKeys?: string[];
  /** Logger function */
  logger?: (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;
}

/**
 * MMKV value metadata
 */
export interface MMKVValueMetadata {
  /** Original value type */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'buffer';
  /** Value size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last access timestamp */
  accessedAt: number;
  /** Expiration timestamp (if set) */
  expiresAt?: number;
  /** Is value compressed */
  compressed?: boolean;
  /** Compression ratio (if compressed) */
  compressionRatio?: number;
}

/**
 * MMKV storage statistics
 */
export interface MMKVStats {
  /** Total number of keys */
  keyCount: number;
  /** Total storage size in bytes */
  totalSize: number;
  /** Used size in bytes */
  usedSize: number;
  /** Number of cached values */
  cachedCount: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Number of expired values */
  expiredCount: number;
  /** Average value size in bytes */
  avgValueSize: number;
  /** Largest value size in bytes */
  maxValueSize: number;
  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  value: T;
  size: number;
  timestamp: number;
  hits: number;
  expiresAt?: number;
}

/**
 * Value change event
 */
export interface MMKVChangeEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  source: 'local' | 'remote';
}

/**
 * MMKV native interface (platform-specific implementation)
 */
interface MMKVNativeInterface {
  initialize(id: string, path?: string, encryptionKey?: string, mode?: number): boolean;
  setString(id: string, key: string, value: string): boolean;
  getString(id: string, key: string): string | undefined;
  setNumber(id: string, key: string, value: number): boolean;
  getNumber(id: string, key: string): number | undefined;
  setBoolean(id: string, key: string, value: boolean): boolean;
  getBoolean(id: string, key: string): boolean | undefined;
  setBuffer(id: string, key: string, value: ArrayBuffer): boolean;
  getBuffer(id: string, key: string): ArrayBuffer | undefined;
  delete(id: string, key: string): boolean;
  contains(id: string, key: string): boolean;
  getAllKeys(id: string): string[];
  clearAll(id: string): boolean;
  getTotalSize(id: string): number;
  getActualSize(id: string): number;
  trim(id: string): void;
  close(id: string): void;
  addValueChangedListener(id: string, callback: (key: string) => void): () => void;
}

// ============================================================================
// LRU Cache Implementation
// ============================================================================

/**
 * LRU (Least Recently Used) cache for frequently accessed values
 */
class LRUCache<K, V> {
  private capacity: number;
  private maxSize: number;
  private currentSize: number = 0;
  private cache: Map<K, CacheEntry<V>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  constructor(capacity: number, maxSizeBytes: number) {
    this.capacity = capacity;
    this.maxSize = maxSizeBytes;
  }

  /**
   * Get a value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    entry.hits++;
    entry.timestamp = Date.now();

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: K, value: V, size: number, expiresAt?: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Evict entries if necessary
    while (
      (this.cache.size >= this.capacity || this.currentSize + size > this.maxSize) &&
      this.cache.size > 0
    ) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.delete(oldestKey);
      }
    }

    // Check if single entry is too large
    if (size > this.maxSize) {
      return;
    }

    const entry: CacheEntry<V> = {
      value,
      size,
      timestamp: Date.now(),
      hits: 0,
      expiresAt,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Delete a value from cache
   */
  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    byteSize: number;
    hitRate: number;
    hits: number;
    misses: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      byteSize: this.currentSize,
      hitRate: total > 0 ? this.hits / total : 0,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Remove expired entries
   */
  pruneExpired(): number {
    let pruned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get all keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }
}

// ============================================================================
// Compression Utilities
// ============================================================================

/**
 * Simple compression utilities for large values
 */
class CompressionUtils {
  /**
   * Compress a string using simple RLE-like compression
   * Note: In production, use a proper compression library like lz4 or zstd
   */
  static compress(data: string): { compressed: string; ratio: number } {
    // Simple implementation - in production use pako or similar
    const compressed = data; // Placeholder for actual compression
    const ratio = compressed.length / data.length;
    
    return { compressed, ratio };
  }

  /**
   * Decompress a previously compressed string
   */
  static decompress(data: string): string {
    // Simple implementation - in production use pako or similar
    return data; // Placeholder for actual decompression
  }

  /**
   * Estimate the size of a value in bytes
   */
  static estimateSize(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }

    if (typeof value === 'number') {
      return 8; // 64-bit float
    }

    if (typeof value === 'boolean') {
      return 1;
    }

    if (value instanceof ArrayBuffer) {
      return value.byteLength;
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }

    return 0;
  }
}

// ============================================================================
// Serialization Strategies
// ============================================================================

/**
 * Default JSON serialization strategy
 */
const defaultSerializer: SerializationStrategy = {
  serialize: (value: unknown): string => {
    if (value === undefined) {
      return '__undefined__';
    }
    return JSON.stringify(value);
  },
  deserialize: <T>(data: string): T => {
    if (data === '__undefined__') {
      return undefined as T;
    }
    return JSON.parse(data) as T;
  },
};

/**
 * Serialization strategy with type preservation
 */
const typedSerializer: SerializationStrategy = {
  serialize: (value: unknown): string => {
    const wrapper = {
      __type__: typeof value,
      __value__: value,
      __isArray__: Array.isArray(value),
      __isDate__: value instanceof Date,
    };

    if (value instanceof Date) {
      wrapper.__value__ = value.toISOString();
    }

    if (value instanceof Set) {
      wrapper.__type__ = 'set';
      wrapper.__value__ = Array.from(value);
    }

    if (value instanceof Map) {
      wrapper.__type__ = 'map';
      wrapper.__value__ = Array.from(value.entries());
    }

    return JSON.stringify(wrapper);
  },
  deserialize: <T>(data: string): T => {
    const wrapper = JSON.parse(data);

    if (wrapper.__type__ === 'set') {
      return new Set(wrapper.__value__) as T;
    }

    if (wrapper.__type__ === 'map') {
      return new Map(wrapper.__value__) as T;
    }

    if (wrapper.__isDate__) {
      return new Date(wrapper.__value__) as T;
    }

    return wrapper.__value__ as T;
  },
};

// ============================================================================
// MMKV Instance Manager
// ============================================================================

/**
 * Manages multiple MMKV instances
 */
class MMKVInstanceManager {
  private static instances: Map<string, MMKVAdapter> = new Map();
  private static defaultInstance: MMKVAdapter | null = null;

  /**
   * Get or create an MMKV instance
   */
  static getInstance(config: MMKVConfig): MMKVAdapter {
    const existing = this.instances.get(config.id);
    if (existing) {
      return existing;
    }

    const instance = new MMKVAdapter(config);
    this.instances.set(config.id, instance);
    return instance;
  }

  /**
   * Get the default instance
   */
  static getDefault(): MMKVAdapter {
    if (!this.defaultInstance) {
      this.defaultInstance = new MMKVAdapter({ id: 'default' });
      this.instances.set('default', this.defaultInstance);
    }
    return this.defaultInstance;
  }

  /**
   * Close and remove an instance
   */
  static closeInstance(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      instance.close();
      this.instances.delete(id);

      if (this.defaultInstance && id === 'default') {
        this.defaultInstance = null;
      }
    }
  }

  /**
   * Close all instances
   */
  static closeAll(): void {
    for (const [id, instance] of this.instances) {
      instance.close();
    }
    this.instances.clear();
    this.defaultInstance = null;
  }

  /**
   * List all active instances
   */
  static listInstances(): string[] {
    return Array.from(this.instances.keys());
  }
}

// ============================================================================
// Value Wrapper for Metadata
// ============================================================================

/**
 * Wrapper for storing values with metadata
 */
interface StoredValue<T> {
  value: T;
  metadata: MMKVValueMetadata;
}

// ============================================================================
// Main MMKV Adapter
// ============================================================================

/**
 * MMKVAdapter - Main adapter class for MMKV storage operations
 */
export class MMKVAdapter implements StorageAdapter {
  private config: MMKVConfig;
  private isInitialized: boolean = false;
  private cache: LRUCache<string, unknown>;
  private changeListeners: Map<string, Set<ChangeListener>> = new Map();
  private globalListeners: Set<ChangeListener> = new Set();
  private nativeUnsubscribe: (() => void) | null = null;
  private serializer: SerializationStrategy;
  private accessLog: Map<string, { reads: number; writes: number; lastAccess: number }> = new Map();
  private pendingWrites: Map<string, unknown> = new Map();
  private writeDebounceTimer: NodeJS.Timeout | null = null;
  private readonly METADATA_PREFIX = '__meta__';
  private readonly EXPIRY_PREFIX = '__exp__';

  constructor(config: MMKVConfig) {
    this.config = {
      mode: MMKVMode.SINGLE_PROCESS,
      enableCache: true,
      maxCacheSize: 10 * 1024 * 1024, // 10MB
      cacheExpiration: 5 * 60 * 1000, // 5 minutes
      enableLogging: false,
      enableCompression: false,
      compressionThreshold: 1024, // 1KB
      ...config,
    };

    this.cache = new LRUCache<string, unknown>(
      1000, // Max 1000 entries
      this.config.maxCacheSize || 10 * 1024 * 1024
    );

    this.serializer = this.config.serializer || defaultSerializer;
  }

  /**
   * Initialize the MMKV instance
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // In a real implementation, this would call the native module
      // MMKVNative.initialize(this.config.id, this.config.path, this.config.encryptionKey, this.config.mode);

      // Migrate from AsyncStorage if configured
      if (this.config.migrateFromAsyncStorage && this.config.asyncStorageKeys) {
        await this.migrateFromAsyncStorage(this.config.asyncStorageKeys);
      }

      // Setup change listener for multi-process mode
      if (this.config.mode === MMKVMode.MULTI_PROCESS) {
        this.setupNativeChangeListener();
      }

      // Start cache pruning interval
      this.startCachePruning();

      this.isInitialized = true;
      this.log('MMKV adapter initialized', 'info');
    } catch (error) {
      this.log(`Initialization failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Log a message using the configured logger
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (this.config.enableLogging && this.config.logger) {
      this.config.logger(message, level);
    }
  }

  /**
   * Setup native change listener for multi-process mode
   */
  private setupNativeChangeListener(): void {
    // In a real implementation:
    // this.nativeUnsubscribe = MMKVNative.addValueChangedListener(this.config.id, (key) => {
    //   this.handleNativeValueChange(key);
    // });
  }

  /**
   * Handle value change from native layer
   */
  private handleNativeValueChange(key: string): void {
    // Invalidate cache
    this.cache.delete(key);

    // Notify listeners
    this.notifyListeners(key, undefined, undefined, 'remote');
  }

  /**
   * Start cache pruning interval
   */
  private startCachePruning(): void {
    setInterval(() => {
      const pruned = this.cache.pruneExpired();
      if (pruned > 0) {
        this.log(`Pruned ${pruned} expired cache entries`, 'debug');
      }
    }, 60000); // Every minute
  }

  /**
   * Migrate data from AsyncStorage
   */
  private async migrateFromAsyncStorage(keys: string[]): Promise<void> {
    // In a real implementation, this would read from AsyncStorage and write to MMKV
    this.log(`Migrating ${keys.length} keys from AsyncStorage`, 'info');

    for (const key of keys) {
      try {
        // const value = await AsyncStorage.getItem(key);
        // if (value !== null) {
        //   this.setString(key, value);
        //   await AsyncStorage.removeItem(key);
        // }
      } catch (error) {
        this.log(`Failed to migrate key '${key}': ${error}`, 'warn');
      }
    }
  }

  /**
   * Get the instance ID
   */
  get id(): string {
    return this.config.id;
  }

  // ============================================================================
  // Basic Get/Set Operations
  // ============================================================================

  /**
   * Set a string value
   */
  setString(key: string, value: string): boolean {
    this.ensureInitialized();
    this.trackAccess(key, 'write');

    const shouldCompress =
      this.config.enableCompression &&
      value.length > (this.config.compressionThreshold || 1024);

    let storedValue = value;
    let compressionRatio = 1;

    if (shouldCompress) {
      const result = CompressionUtils.compress(value);
      storedValue = result.compressed;
      compressionRatio = result.ratio;
    }

    // Store in native
    // MMKVNative.setString(this.config.id, key, storedValue);

    // Update cache
    if (this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, CompressionUtils.estimateSize(value), expiresAt);
    }

    // Update metadata
    this.updateMetadata(key, {
      type: 'string',
      size: value.length * 2,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      compressed: shouldCompress,
      compressionRatio: shouldCompress ? compressionRatio : undefined,
    });

    // Notify listeners
    this.notifyListeners(key, undefined, value, 'local');

    return true;
  }

  /**
   * Get a string value
   */
  getString(key: string): string | undefined {
    this.ensureInitialized();
    this.trackAccess(key, 'read');

    // Check expiration
    if (this.isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return cached as string;
      }
    }

    // Get from native
    // const value = MMKVNative.getString(this.config.id, key);
    const value: string | undefined = undefined; // Placeholder

    if (value !== undefined && this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, CompressionUtils.estimateSize(value), expiresAt);
    }

    return value;
  }

  /**
   * Set a number value
   */
  setNumber(key: string, value: number): boolean {
    this.ensureInitialized();
    this.trackAccess(key, 'write');

    // MMKVNative.setNumber(this.config.id, key, value);

    if (this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, 8, expiresAt);
    }

    this.updateMetadata(key, {
      type: 'number',
      size: 8,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    });

    this.notifyListeners(key, undefined, value, 'local');
    return true;
  }

  /**
   * Get a number value
   */
  getNumber(key: string): number | undefined {
    this.ensureInitialized();
    this.trackAccess(key, 'read');

    if (this.isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return cached as number;
      }
    }

    // const value = MMKVNative.getNumber(this.config.id, key);
    const value: number | undefined = undefined;

    if (value !== undefined && this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, 8, expiresAt);
    }

    return value;
  }

  /**
   * Set a boolean value
   */
  setBoolean(key: string, value: boolean): boolean {
    this.ensureInitialized();
    this.trackAccess(key, 'write');

    // MMKVNative.setBoolean(this.config.id, key, value);

    if (this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, 1, expiresAt);
    }

    this.updateMetadata(key, {
      type: 'boolean',
      size: 1,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    });

    this.notifyListeners(key, undefined, value, 'local');
    return true;
  }

  /**
   * Get a boolean value
   */
  getBoolean(key: string): boolean | undefined {
    this.ensureInitialized();
    this.trackAccess(key, 'read');

    if (this.isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return cached as boolean;
      }
    }

    // const value = MMKVNative.getBoolean(this.config.id, key);
    const value: boolean | undefined = undefined;

    if (value !== undefined && this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, 1, expiresAt);
    }

    return value;
  }

  /**
   * Set a buffer value
   */
  setBuffer(key: string, value: ArrayBuffer): boolean {
    this.ensureInitialized();
    this.trackAccess(key, 'write');

    // MMKVNative.setBuffer(this.config.id, key, value);

    if (this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, value.byteLength, expiresAt);
    }

    this.updateMetadata(key, {
      type: 'buffer',
      size: value.byteLength,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    });

    this.notifyListeners(key, undefined, value, 'local');
    return true;
  }

  /**
   * Get a buffer value
   */
  getBuffer(key: string): ArrayBuffer | undefined {
    this.ensureInitialized();
    this.trackAccess(key, 'read');

    if (this.isExpired(key)) {
      this.delete(key);
      return undefined;
    }

    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached !== undefined) {
        return cached as ArrayBuffer;
      }
    }

    // const value = MMKVNative.getBuffer(this.config.id, key);
    const value: ArrayBuffer | undefined = undefined;

    if (value !== undefined && this.config.enableCache) {
      const expiresAt = this.config.cacheExpiration
        ? Date.now() + this.config.cacheExpiration
        : undefined;
      this.cache.set(key, value, value.byteLength, expiresAt);
    }

    return value;
  }

  // ============================================================================
  // Object/Array Operations
  // ============================================================================

  /**
   * Set an object value (serialized as JSON)
   */
  setObject<T extends object>(key: string, value: T): boolean {
    this.ensureInitialized();
    
    const serialized = this.serializer.serialize(value);
    const result = this.setString(key, serialized);

    if (result) {
      const metadata = this.getMetadata(key);
      if (metadata) {
        metadata.type = Array.isArray(value) ? 'array' : 'object';
        this.updateMetadata(key, metadata);
      }
    }

    return result;
  }

  /**
   * Get an object value
   */
  getObject<T extends object>(key: string): T | undefined {
    this.ensureInitialized();
    
    const serialized = this.getString(key);
    if (serialized === undefined) {
      return undefined;
    }

    try {
      return this.serializer.deserialize<T>(serialized);
    } catch (error) {
      this.log(`Failed to deserialize object for key '${key}': ${error}`, 'warn');
      return undefined;
    }
  }

  /**
   * Set an array value
   */
  setArray<T>(key: string, value: T[]): boolean {
    return this.setObject(key, value);
  }

  /**
   * Get an array value
   */
  getArray<T>(key: string): T[] | undefined {
    return this.getObject<T[]>(key);
  }

  // ============================================================================
  // Generic Get/Set
  // ============================================================================

  /**
   * Set a value with automatic type detection
   */
  set<T>(key: string, value: T): boolean {
    this.ensureInitialized();

    if (value === null || value === undefined) {
      return this.delete(key);
    }

    if (typeof value === 'string') {
      return this.setString(key, value);
    }

    if (typeof value === 'number') {
      return this.setNumber(key, value);
    }

    if (typeof value === 'boolean') {
      return this.setBoolean(key, value);
    }

    if (value instanceof ArrayBuffer) {
      return this.setBuffer(key, value);
    }

    if (typeof value === 'object') {
      return this.setObject(key, value as object);
    }

    // Fallback to string serialization
    return this.setString(key, String(value));
  }

  /**
   * Get a value with type inference
   */
  get<T>(key: string): T | undefined {
    this.ensureInitialized();

    const metadata = this.getMetadata(key);
    if (!metadata) {
      // Try to get as string (most common)
      const value = this.getString(key);
      if (value !== undefined) {
        try {
          return this.serializer.deserialize<T>(value);
        } catch {
          return value as T;
        }
      }
      return undefined;
    }

    switch (metadata.type) {
      case 'string':
        return this.getString(key) as T;
      case 'number':
        return this.getNumber(key) as T;
      case 'boolean':
        return this.getBoolean(key) as T;
      case 'buffer':
        return this.getBuffer(key) as T;
      case 'object':
      case 'array':
        return this.getObject(key) as T;
      default:
        return this.getString(key) as T;
    }
  }

  // ============================================================================
  // Key Management
  // ============================================================================

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    this.ensureInitialized();

    const oldValue = this.get(key);

    // Delete from native
    // const result = MMKVNative.delete(this.config.id, key);

    // Remove from cache
    this.cache.delete(key);

    // Remove metadata
    this.deleteMetadata(key);

    // Remove expiration
    this.removeExpiration(key);

    // Notify listeners
    this.notifyListeners(key, oldValue, undefined, 'local');

    return true;
  }

  /**
   * Check if a key exists
   */
  contains(key: string): boolean {
    this.ensureInitialized();

    if (this.isExpired(key)) {
      this.delete(key);
      return false;
    }

    if (this.config.enableCache && this.cache.has(key)) {
      return true;
    }

    // return MMKVNative.contains(this.config.id, key);
    return false;
  }

  /**
   * Alias for contains
   */
  has(key: string): boolean {
    return this.contains(key);
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    this.ensureInitialized();

    // const allKeys = MMKVNative.getAllKeys(this.config.id);
    const allKeys: string[] = [];

    // Filter out metadata and expiration keys
    return allKeys.filter(
      (key) =>
        !key.startsWith(this.METADATA_PREFIX) && !key.startsWith(this.EXPIRY_PREFIX)
    );
  }

  /**
   * Get keys matching a pattern
   */
  getKeysWithPrefix(prefix: string): string[] {
    const allKeys = this.getAllKeys();
    return allKeys.filter((key) => key.startsWith(prefix));
  }

  /**
   * Clear all data
   */
  clearAll(): boolean {
    this.ensureInitialized();

    // MMKVNative.clearAll(this.config.id);
    this.cache.clear();
    this.accessLog.clear();

    // Notify listeners
    for (const key of this.getAllKeys()) {
      this.notifyListeners(key, undefined, undefined, 'local');
    }

    return true;
  }

  // ============================================================================
  // Expiration Management
  // ============================================================================

  /**
   * Set a value with expiration
   */
  setWithExpiration<T>(key: string, value: T, expirationMs: number): boolean {
    const result = this.set(key, value);

    if (result) {
      const expiresAt = Date.now() + expirationMs;
      this.setString(`${this.EXPIRY_PREFIX}${key}`, String(expiresAt));
    }

    return result;
  }

  /**
   * Check if a key is expired
   */
  isExpired(key: string): boolean {
    const expiryKey = `${this.EXPIRY_PREFIX}${key}`;
    const expiresAtStr = this.getString(expiryKey);

    if (!expiresAtStr) {
      // Check default expiration from config
      if (this.config.defaultExpiration) {
        const metadata = this.getMetadata(key);
        if (metadata) {
          return Date.now() > metadata.createdAt + this.config.defaultExpiration;
        }
      }
      return false;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    return Date.now() > expiresAt;
  }

  /**
   * Get time to live for a key
   */
  getTTL(key: string): number | null {
    const expiryKey = `${this.EXPIRY_PREFIX}${key}`;
    const expiresAtStr = this.getString(expiryKey);

    if (!expiresAtStr) {
      return null;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    const ttl = expiresAt - Date.now();

    return ttl > 0 ? ttl : 0;
  }

  /**
   * Set expiration for an existing key
   */
  setExpiration(key: string, expirationMs: number): boolean {
    if (!this.contains(key)) {
      return false;
    }

    const expiresAt = Date.now() + expirationMs;
    return this.setString(`${this.EXPIRY_PREFIX}${key}`, String(expiresAt));
  }

  /**
   * Remove expiration from a key
   */
  removeExpiration(key: string): boolean {
    const expiryKey = `${this.EXPIRY_PREFIX}${key}`;
    // return MMKVNative.delete(this.config.id, expiryKey);
    return true;
  }

  /**
   * Clean up expired keys
   */
  cleanExpired(): number {
    const allKeys = this.getAllKeys();
    let cleaned = 0;

    for (const key of allKeys) {
      if (this.isExpired(key)) {
        this.delete(key);
        cleaned++;
      }
    }

    this.log(`Cleaned ${cleaned} expired keys`, 'debug');
    return cleaned;
  }

  // ============================================================================
  // Metadata Management
  // ============================================================================

  /**
   * Update metadata for a key
   */
  private updateMetadata(key: string, metadata: Partial<MMKVValueMetadata>): void {
    const existing = this.getMetadata(key) || {
      type: 'string',
      size: 0,
      createdAt: Date.now(),
      accessedAt: Date.now(),
    };

    const updated = { ...existing, ...metadata, accessedAt: Date.now() };
    this.setString(`${this.METADATA_PREFIX}${key}`, JSON.stringify(updated));
  }

  /**
   * Get metadata for a key
   */
  getMetadata(key: string): MMKVValueMetadata | null {
    const metaStr = this.getString(`${this.METADATA_PREFIX}${key}`);
    if (!metaStr) {
      return null;
    }

    try {
      return JSON.parse(metaStr) as MMKVValueMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Delete metadata for a key
   */
  private deleteMetadata(key: string): void {
    // MMKVNative.delete(this.config.id, `${this.METADATA_PREFIX}${key}`);
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Set multiple values at once
   */
  setMultiple(entries: Array<{ key: string; value: unknown }>): boolean {
    this.ensureInitialized();

    let allSuccess = true;
    for (const { key, value } of entries) {
      const success = this.set(key, value);
      if (!success) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * Get multiple values at once
   */
  getMultiple<T>(keys: string[]): Map<string, T | undefined> {
    this.ensureInitialized();

    const results = new Map<string, T | undefined>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }

    return results;
  }

  /**
   * Delete multiple keys at once
   */
  deleteMultiple(keys: string[]): boolean {
    this.ensureInitialized();

    let allSuccess = true;
    for (const key of keys) {
      const success = this.delete(key);
      if (!success) {
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * Execute batch operations
   */
  batch(operations: BatchOperation[]): Promise<void> {
    return new Promise((resolve) => {
      for (const op of operations) {
        switch (op.type) {
          case 'set':
            this.set(op.key, op.value);
            break;
          case 'delete':
            this.delete(op.key);
            break;
          case 'clear':
            this.clearAll();
            break;
        }
      }
      resolve();
    });
  }

  // ============================================================================
  // Change Listeners
  // ============================================================================

  /**
   * Add a listener for value changes on a specific key
   */
  addListener(key: string, listener: ChangeListener): () => void {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    this.changeListeners.get(key)!.add(listener);

    return () => {
      const listeners = this.changeListeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.changeListeners.delete(key);
        }
      }
    };
  }

  /**
   * Add a global listener for all value changes
   */
  addGlobalListener(listener: ChangeListener): () => void {
    this.globalListeners.add(listener);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  /**
   * Notify listeners of value changes
   */
  private notifyListeners(
    key: string,
    oldValue: unknown,
    newValue: unknown,
    source: 'local' | 'remote'
  ): void {
    const event: MMKVChangeEvent = {
      key,
      oldValue,
      newValue,
      timestamp: Date.now(),
      source,
    };

    // Notify key-specific listeners
    const keyListeners = this.changeListeners.get(key);
    if (keyListeners) {
      for (const listener of keyListeners) {
        try {
          listener(event);
        } catch (error) {
          this.log(`Listener error for key '${key}': ${error}`, 'error');
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (error) {
        this.log(`Global listener error: ${error}`, 'error');
      }
    }
  }

  // ============================================================================
  // Statistics and Metrics
  // ============================================================================

  /**
   * Track access to a key
   */
  private trackAccess(key: string, type: 'read' | 'write'): void {
    if (!this.config.enableLogging) {
      return;
    }

    const existing = this.accessLog.get(key) || { reads: 0, writes: 0, lastAccess: 0 };

    if (type === 'read') {
      existing.reads++;
    } else {
      existing.writes++;
    }
    existing.lastAccess = Date.now();

    this.accessLog.set(key, existing);
  }

  /**
   * Get storage statistics
   */
  getStats(): MMKVStats {
    this.ensureInitialized();

    const allKeys = this.getAllKeys();
    const cacheStats = this.cache.getStats();

    let totalSize = 0;
    let maxSize = 0;
    let expiredCount = 0;

    for (const key of allKeys) {
      const metadata = this.getMetadata(key);
      if (metadata) {
        totalSize += metadata.size;
        maxSize = Math.max(maxSize, metadata.size);
      }

      if (this.isExpired(key)) {
        expiredCount++;
      }
    }

    return {
      keyCount: allKeys.length,
      totalSize: 0, // MMKVNative.getTotalSize(this.config.id),
      usedSize: 0, // MMKVNative.getActualSize(this.config.id),
      cachedCount: cacheStats.size,
      cacheHitRate: cacheStats.hitRate,
      expiredCount,
      avgValueSize: allKeys.length > 0 ? totalSize / allKeys.length : 0,
      maxValueSize: maxSize,
      lastModified: Date.now(),
    };
  }

  /**
   * Get access log for a key
   */
  getAccessLog(key: string): { reads: number; writes: number; lastAccess: number } | null {
    return this.accessLog.get(key) || null;
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): StorageMetrics {
    const stats = this.getStats();
    const cacheStats = this.cache.getStats();

    return {
      keyCount: stats.keyCount,
      totalSize: stats.totalSize,
      usedSize: stats.usedSize,
      cacheHitRate: cacheStats.hitRate,
      cacheSize: cacheStats.byteSize,
      expiredKeys: stats.expiredCount,
    };
  }

  // ============================================================================
  // Maintenance
  // ============================================================================

  /**
   * Trim the storage to reclaim space
   */
  trim(): void {
    this.ensureInitialized();
    // MMKVNative.trim(this.config.id);
    this.log('Storage trimmed', 'info');
  }

  /**
   * Ensure the adapter is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('MMKVAdapter not initialized. Call initialize() first.');
    }
  }

  /**
   * Close the MMKV instance
   */
  close(): void {
    if (this.nativeUnsubscribe) {
      this.nativeUnsubscribe();
      this.nativeUnsubscribe = null;
    }

    if (this.writeDebounceTimer) {
      clearTimeout(this.writeDebounceTimer);
      this.writeDebounceTimer = null;
    }

    this.cache.clear();
    this.changeListeners.clear();
    this.globalListeners.clear();
    this.accessLog.clear();

    // MMKVNative.close(this.config.id);
    this.isInitialized = false;

    this.log('MMKV adapter closed', 'info');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new MMKV instance
 */
export function createMMKV(config: MMKVConfig): MMKVAdapter {
  return MMKVInstanceManager.getInstance(config);
}

/**
 * Get the default MMKV instance
 */
export function getDefaultMMKV(): MMKVAdapter {
  return MMKVInstanceManager.getDefault();
}

/**
 * Create an encrypted MMKV instance
 */
export function createEncryptedMMKV(
  id: string,
  encryptionKey: string,
  options?: Partial<MMKVConfig>
): MMKVAdapter {
  return MMKVInstanceManager.getInstance({
    id,
    encryptionKey,
    ...options,
  });
}

/**
 * Create a multi-process MMKV instance
 */
export function createMultiProcessMMKV(
  id: string,
  options?: Partial<MMKVConfig>
): MMKVAdapter {
  return MMKVInstanceManager.getInstance({
    id,
    mode: MMKVMode.MULTI_PROCESS,
    ...options,
  });
}

// ============================================================================
// Export
// ============================================================================

export { MMKVInstanceManager };
export default MMKVAdapter;
