/**
 * RealmProvider - High-performance Realm database provider for React Native
 *
 * This provider wraps the Realm SDK to provide a powerful object-oriented
 * database solution with support for relationships, real-time sync,
 * and offline-first capabilities.
 *
 * @module RealmProvider
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
  QueryOptions,
  QueryResult,
} from '../types';

/**
 * Realm configuration options
 */
export interface RealmConfig {
  /** Path to the Realm file */
  path?: string;
  /** Schema version for migrations */
  schemaVersion: number;
  /** Schema definitions */
  schema?: RealmSchemaDefinition[];
  /** Whether to delete realm on migration error */
  deleteRealmIfMigrationNeeded?: boolean;
  /** Encryption key (64-byte array) */
  encryptionKey?: ArrayBuffer;
  /** In-memory only mode */
  inMemory?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Compact on launch */
  shouldCompact?: (totalSize: number, usedSize: number) => boolean;
  /** Migration function */
  onMigration?: (oldRealm: any, newRealm: any) => void;
  /** Sync configuration for Realm Sync */
  sync?: RealmSyncConfig;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Realm Sync configuration
 */
export interface RealmSyncConfig {
  /** User authentication */
  user: any;
  /** Partition key */
  partitionValue?: string;
  /** Flexible sync configuration */
  flexible?: boolean;
  /** Initial subscriptions for flexible sync */
  initialSubscriptions?: {
    update: (subs: any, realm: any) => void;
    rerunOnOpen?: boolean;
  };
  /** Sync error handler */
  onError?: (error: any) => void;
  /** Client reset handler */
  clientReset?: {
    mode: 'discardLocal' | 'recoverOrDiscard' | 'recoverUnsyncedChanges' | 'manual';
    onBefore?: (realm: any) => void;
    onAfter?: (beforeRealm: any, afterRealm: any) => void;
  };
}

/**
 * Realm schema definition
 */
export interface RealmSchemaDefinition {
  /** Object type name */
  name: string;
  /** Primary key property */
  primaryKey?: string;
  /** Whether this is an embedded object */
  embedded?: boolean;
  /** Whether this is an asymmetric object (sync only) */
  asymmetric?: boolean;
  /** Property definitions */
  properties: Record<string, RealmPropertyDefinition>;
}

/**
 * Realm property definition
 */
export type RealmPropertyDefinition =
  | string
  | {
      type: string;
      optional?: boolean;
      default?: any;
      indexed?: boolean;
      mapTo?: string;
    };

/**
 * Key-value storage schema for Realm
 */
const KeyValueSchema: RealmSchemaDefinition = {
  name: 'KeyValuePair',
  primaryKey: 'key',
  properties: {
    key: 'string',
    value: 'string',
    type: 'string',
    createdAt: 'int',
    updatedAt: 'int',
    expiresAt: 'int?',
    tags: 'string?',
    size: 'int',
  },
};

/**
 * Realm query result
 */
export interface RealmQueryResult<T> {
  /** Results as array */
  toArray(): T[];
  /** Results count */
  length: number;
  /** Filter results */
  filtered(query: string, ...args: any[]): RealmQueryResult<T>;
  /** Sort results */
  sorted(descriptor: string | string[], reverse?: boolean): RealmQueryResult<T>;
  /** Slice results */
  slice(start?: number, end?: number): T[];
  /** Subscribe to changes */
  addListener(callback: (results: any, changes: any) => void): void;
  /** Remove listener */
  removeListener(callback: Function): void;
}

/**
 * Realm Provider class implementing StorageProvider interface
 *
 * @example
 * ```typescript
 * const provider = new RealmProvider({
 *   schemaVersion: 1,
 *   schema: [
 *     {
 *       name: 'User',
 *       primaryKey: 'id',
 *       properties: {
 *         id: 'string',
 *         name: 'string',
 *         email: 'string?',
 *         age: 'int?',
 *       },
 *     },
 *   ],
 * });
 *
 * await provider.initialize();
 * await provider.set('user:1', { name: 'John', email: 'john@example.com' });
 * ```
 */
export class RealmProvider implements StorageProvider {
  /** Provider name identifier */
  public readonly name = 'realm';

  /** Provider version */
  public readonly version = '2.0.0';

  /** Provider capabilities */
  public readonly capabilities: ProviderCapabilities = {
    supportsEncryption: true,
    supportsCompression: false,
    supportsBatchOperations: true,
    supportsTransactions: true,
    supportsIndexing: true,
    supportsQueries: true,
    supportsStreaming: false,
    supportsSync: true,
    maxKeyLength: 1024,
    maxValueSize: 16 * 1024 * 1024, // 16MB
    maxBatchSize: 10000,
  };

  private config: RealmConfig;
  private realm: any = null;
  private isInitialized = false;
  private listeners: Map<string, Set<(key: string, value: any) => void>> = new Map();
  private operationCount = 0;
  private errorCount = 0;
  private lastAccess = Date.now();

  /**
   * Creates a new RealmProvider instance
   *
   * @param config - Configuration options
   */
  constructor(config: RealmConfig) {
    this.config = {
      deleteRealmIfMigrationNeeded: false,
      inMemory: false,
      readOnly: false,
      logging: false,
      ...config,
    };
  }

  /**
   * Initialize the Realm database
   *
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const Realm = await this.loadRealmModule();

      // Build configuration
      const realmConfig: any = {
        schemaVersion: this.config.schemaVersion,
        schema: [KeyValueSchema, ...(this.config.schema || [])].map((s) =>
          this.convertToRealmSchema(s)
        ),
      };

      if (this.config.path) {
        realmConfig.path = this.config.path;
      }

      if (this.config.encryptionKey) {
        realmConfig.encryptionKey = this.config.encryptionKey;
      }

      if (this.config.inMemory) {
        realmConfig.inMemory = true;
      }

      if (this.config.readOnly) {
        realmConfig.readOnly = true;
      }

      if (this.config.deleteRealmIfMigrationNeeded) {
        realmConfig.deleteRealmIfMigrationNeeded = true;
      }

      if (this.config.shouldCompact) {
        realmConfig.shouldCompact = this.config.shouldCompact;
      }

      if (this.config.onMigration) {
        realmConfig.onMigration = this.config.onMigration;
      }

      if (this.config.sync) {
        realmConfig.sync = this.buildSyncConfig(this.config.sync);
      }

      // Open Realm
      this.realm = await Realm.open(realmConfig);
      this.isInitialized = true;

      this.log('Realm database initialized successfully');
    } catch (error) {
      this.errorCount++;
      throw new Error(`Failed to initialize Realm: ${error}`);
    }
  }

  /**
   * Load Realm module dynamically
   */
  private async loadRealmModule(): Promise<any> {
    try {
      return require('realm');
    } catch {
      throw new Error('realm is not installed');
    }
  }

  /**
   * Convert schema definition to Realm format
   */
  private convertToRealmSchema(schema: RealmSchemaDefinition): any {
    return {
      name: schema.name,
      primaryKey: schema.primaryKey,
      embedded: schema.embedded,
      asymmetric: schema.asymmetric,
      properties: schema.properties,
    };
  }

  /**
   * Build sync configuration
   */
  private buildSyncConfig(sync: RealmSyncConfig): any {
    const config: any = {
      user: sync.user,
    };

    if (sync.flexible) {
      config.flexible = true;
      if (sync.initialSubscriptions) {
        config.initialSubscriptions = sync.initialSubscriptions;
      }
    } else if (sync.partitionValue !== undefined) {
      config.partitionValue = sync.partitionValue;
    }

    if (sync.onError) {
      config.onError = sync.onError;
    }

    if (sync.clientReset) {
      config.clientReset = sync.clientReset;
    }

    return config;
  }

  /**
   * Get a value from storage by key
   *
   * @param key - The key to retrieve
   * @returns Promise resolving to the value or null
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount++;

    try {
      const item = this.realm.objectForPrimaryKey('KeyValuePair', key);

      if (!item) {
        return null;
      }

      // Check expiration
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await this.remove(key);
        return null;
      }

      return this.deserialize(item.value, item.type);
    } catch (error) {
      this.errorCount++;
      this.log(`Error getting key "${key}": ${error}`);
      return null;
    }
  }

  /**
   * Set a value in storage
   *
   * @param key - The key to set
   * @param value - The value to store
   * @param options - Optional storage options
   */
  async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount++;

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    try {
      const now = Date.now();
      const serialized = this.serialize(value);
      const type = this.getValueType(value);

      this.realm.write(() => {
        this.realm.create(
          'KeyValuePair',
          {
            key,
            value: serialized,
            type,
            createdAt: now,
            updatedAt: now,
            expiresAt: options?.ttl ? now + options.ttl : null,
            tags: options?.tags ? JSON.stringify(options.tags) : null,
            size: serialized.length,
          },
          'modified'
        );
      });

      this.notifyListeners(key, value);
    } catch (error) {
      this.errorCount++;
      throw new Error(`Error setting key "${key}": ${error}`);
    }
  }

  /**
   * Remove a value from storage
   *
   * @param key - The key to remove
   */
  async remove(key: string): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount++;

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    try {
      const item = this.realm.objectForPrimaryKey('KeyValuePair', key);

      if (item) {
        this.realm.write(() => {
          this.realm.delete(item);
        });

        this.notifyListeners(key, undefined);
      }
    } catch (error) {
      this.errorCount++;
      throw new Error(`Error removing key "${key}": ${error}`);
    }
  }

  /**
   * Check if a key exists
   *
   * @param key - The key to check
   * @returns Promise resolving to true if key exists
   */
  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateAccessTime();

    const item = this.realm.objectForPrimaryKey('KeyValuePair', key);

    if (!item) {
      return false;
    }

    // Check expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get all keys
   *
   * @param prefix - Optional prefix filter
   * @returns Promise resolving to array of keys
   */
  async keys(prefix?: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateAccessTime();

    let results = this.realm.objects('KeyValuePair');

    // Filter expired
    results = results.filtered('expiresAt == null OR expiresAt > $0', Date.now());

    // Filter by prefix
    if (prefix) {
      results = results.filtered('key BEGINSWITH $0', prefix);
    }

    return results.map((item: any) => item.key);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount++;

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    try {
      this.realm.write(() => {
        const allItems = this.realm.objects('KeyValuePair');
        this.realm.delete(allItems);
      });
    } catch (error) {
      this.errorCount++;
      throw new Error(`Error clearing storage: ${error}`);
    }
  }

  /**
   * Get multiple values
   *
   * @param keys - Array of keys
   * @returns Promise resolving to map of values
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount += keys.length;

    const results = new Map<string, T | null>();

    for (const key of keys) {
      const value = await this.get<T>(key);
      results.set(key, value);
    }

    return results;
  }

  /**
   * Set multiple values
   *
   * @param entries - Array of key-value pairs
   * @param options - Optional storage options
   */
  async setMany<T>(entries: Array<{ key: string; value: T }>, options?: StorageOptions): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount += entries.length;

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    try {
      const now = Date.now();

      this.realm.write(() => {
        for (const entry of entries) {
          const serialized = this.serialize(entry.value);
          const type = this.getValueType(entry.value);

          this.realm.create(
            'KeyValuePair',
            {
              key: entry.key,
              value: serialized,
              type,
              createdAt: now,
              updatedAt: now,
              expiresAt: options?.ttl ? now + options.ttl : null,
              tags: options?.tags ? JSON.stringify(options.tags) : null,
              size: serialized.length,
            },
            'modified'
          );
        }
      });

      for (const entry of entries) {
        this.notifyListeners(entry.key, entry.value);
      }
    } catch (error) {
      this.errorCount++;
      throw new Error(`Error setting multiple keys: ${error}`);
    }
  }

  /**
   * Remove multiple values
   *
   * @param keys - Array of keys to remove
   */
  async removeMany(keys: string[]): Promise<void> {
    this.ensureInitialized();
    this.updateAccessTime();
    this.operationCount += keys.length;

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    try {
      this.realm.write(() => {
        for (const key of keys) {
          const item = this.realm.objectForPrimaryKey('KeyValuePair', key);
          if (item) {
            this.realm.delete(item);
          }
        }
      });

      for (const key of keys) {
        this.notifyListeners(key, undefined);
      }
    } catch (error) {
      this.errorCount++;
      throw new Error(`Error removing multiple keys: ${error}`);
    }
  }

  /**
   * Execute batch operations atomically
   *
   * @param operations - Array of batch operations
   * @returns Promise resolving to results
   */
  async batch(operations: BatchOperation[]): Promise<Array<{ success: boolean; error?: string }>> {
    this.ensureInitialized();
    this.updateAccessTime();

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    const results: Array<{ success: boolean; error?: string }> = [];

    try {
      this.realm.write(() => {
        for (const op of operations) {
          try {
            switch (op.type) {
              case 'set': {
                const now = Date.now();
                const serialized = this.serialize(op.value);
                const type = this.getValueType(op.value);

                this.realm.create(
                  'KeyValuePair',
                  {
                    key: op.key,
                    value: serialized,
                    type,
                    createdAt: now,
                    updatedAt: now,
                    expiresAt: op.options?.ttl ? now + op.options.ttl : null,
                    tags: op.options?.tags ? JSON.stringify(op.options.tags) : null,
                    size: serialized.length,
                  },
                  'modified'
                );
                results.push({ success: true });
                break;
              }
              case 'remove': {
                const item = this.realm.objectForPrimaryKey('KeyValuePair', op.key);
                if (item) {
                  this.realm.delete(item);
                }
                results.push({ success: true });
                break;
              }
              case 'clear': {
                const allItems = this.realm.objects('KeyValuePair');
                this.realm.delete(allItems);
                results.push({ success: true });
                break;
              }
              default:
                results.push({ success: false, error: 'Unknown operation' });
            }
          } catch (error) {
            results.push({ success: false, error: String(error) });
          }
        }
      });
    } catch (error) {
      this.errorCount++;
      throw new Error(`Batch operation failed: ${error}`);
    }

    return results;
  }

  /**
   * Execute a write transaction
   *
   * @param callback - Transaction callback
   */
  async transaction<T>(callback: () => T): Promise<T> {
    this.ensureInitialized();
    this.updateAccessTime();

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    return new Promise((resolve, reject) => {
      try {
        this.realm.write(() => {
          const result = callback();
          resolve(result);
        });
      } catch (error) {
        this.errorCount++;
        reject(error);
      }
    });
  }

  /**
   * Query with options
   *
   * @param options - Query options
   * @returns Promise resolving to query results
   */
  async queryStorage<T>(options: QueryOptions): Promise<QueryResult<T>> {
    this.ensureInitialized();
    this.updateAccessTime();

    const startTime = Date.now();
    let results = this.realm.objects('KeyValuePair');

    // Filter expired
    results = results.filtered('expiresAt == null OR expiresAt > $0', Date.now());

    // Filter by prefix
    if (options.prefix) {
      results = results.filtered('key BEGINSWITH $0', options.prefix);
    }

    // Get total before pagination
    const total = results.length;

    // Sorting
    if (options.sort) {
      const sortField = options.sort.field === 'key' ? 'key' : options.sort.field === 'createdAt' ? 'createdAt' : 'updatedAt';
      results = results.sorted(sortField, options.sort.order === 'desc');
    }

    // Convert to array for filtering and pagination
    let items: StorageItem<T>[] = [];

    for (const item of results) {
      const value = this.deserialize<T>(item.value, item.type);

      // Apply filter
      if (options.filter && !this.matchesFilter(value, options.filter)) {
        continue;
      }

      items.push({
        key: item.key,
        value,
        metadata: {
          key: item.key,
          size: item.size,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          expiresAt: item.expiresAt || undefined,
          tags: item.tags ? JSON.parse(item.tags) : [],
          compressed: false,
          encrypted: !!this.config.encryptionKey,
        },
      });
    }

    // Apply pagination
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
   * Subscribe to changes for a key
   *
   * @param key - Key to watch
   * @param callback - Change callback
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
   * Subscribe to all changes on a Realm object type
   *
   * @param schemaName - Schema name to watch
   * @param callback - Change callback
   * @returns Unsubscribe function
   */
  subscribeToCollection(
    schemaName: string,
    callback: (changes: { insertions: number[]; modifications: number[]; deletions: number[] }) => void
  ): () => void {
    this.ensureInitialized();

    const results = this.realm.objects(schemaName);

    const listener = (_: any, changes: any) => {
      callback({
        insertions: [...changes.insertions],
        modifications: [...changes.modifications],
        deletions: [...changes.deletions],
      });
    };

    results.addListener(listener);

    return () => {
      results.removeListener(listener);
    };
  }

  /**
   * Get storage statistics
   *
   * @returns Promise resolving to stats
   */
  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const items = this.realm.objects('KeyValuePair');
    let totalSize = 0;

    for (const item of items) {
      totalSize += item.size || 0;
    }

    return {
      totalKeys: items.length,
      totalSize,
      cacheSize: 0,
      cacheHitRate: 0,
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      lastAccess: this.lastAccess,
      isEncrypted: !!this.config.encryptionKey,
      indexCount: 0,
    };
  }

  /**
   * Get metadata for a key
   *
   * @param key - The key
   * @returns Promise resolving to metadata
   */
  async getMetadata(key: string): Promise<StorageMetadata | null> {
    this.ensureInitialized();

    const item = this.realm.objectForPrimaryKey('KeyValuePair', key);

    if (!item) {
      return null;
    }

    return {
      key: item.key,
      size: item.size,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      expiresAt: item.expiresAt || undefined,
      tags: item.tags ? JSON.parse(item.tags) : [],
      compressed: false,
      encrypted: !!this.config.encryptionKey,
    };
  }

  /**
   * Export all data
   *
   * @returns Promise resolving to exported data
   */
  async export(): Promise<Record<string, any>> {
    this.ensureInitialized();

    const items = this.realm.objects('KeyValuePair');
    const data: Record<string, any> = {};

    for (const item of items) {
      data[item.key] = this.deserialize(item.value, item.type);
    }

    return {
      provider: this.name,
      version: this.version,
      exportedAt: Date.now(),
      data,
    };
  }

  /**
   * Import data
   *
   * @param data - Data to import
   * @param options - Import options
   * @returns Promise resolving to import results
   */
  async import(
    data: Record<string, any>,
    options?: { overwrite?: boolean }
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    this.ensureInitialized();

    if (this.config.readOnly) {
      throw new Error('Cannot import to read-only Realm');
    }

    const result = { imported: 0, skipped: 0, errors: [] as string[] };
    const entries = data.data || data;

    this.realm.write(() => {
      for (const [key, value] of Object.entries(entries)) {
        try {
          const exists = this.realm.objectForPrimaryKey('KeyValuePair', key) !== null;

          if (exists && !options?.overwrite) {
            result.skipped++;
            continue;
          }

          const now = Date.now();
          const serialized = this.serialize(value);
          const type = this.getValueType(value);

          this.realm.create(
            'KeyValuePair',
            {
              key,
              value: serialized,
              type,
              createdAt: now,
              updatedAt: now,
              size: serialized.length,
            },
            'modified'
          );

          result.imported++;
        } catch (error) {
          result.errors.push(`Error importing ${key}: ${error}`);
        }
      }
    });

    return result;
  }

  /**
   * Clean up expired items
   *
   * @returns Promise resolving to count of removed items
   */
  async cleanup(): Promise<number> {
    this.ensureInitialized();

    if (this.config.readOnly) {
      throw new Error('Cannot cleanup read-only Realm');
    }

    const expired = this.realm
      .objects('KeyValuePair')
      .filtered('expiresAt != null AND expiresAt < $0', Date.now());

    const count = expired.length;

    this.realm.write(() => {
      this.realm.delete(expired);
    });

    return count;
  }

  /**
   * Compact the Realm file
   *
   * @returns Promise resolving when compaction is complete
   */
  async compact(): Promise<void> {
    this.ensureInitialized();

    // Close and reopen with compaction
    this.realm.compact();
  }

  /**
   * Refresh the Realm to get latest changes from sync
   */
  refresh(): void {
    this.ensureInitialized();
    this.realm.refresh();
  }

  /**
   * Wait for upload/download to complete (for sync)
   */
  async waitForSync(): Promise<void> {
    this.ensureInitialized();

    if (this.realm.syncSession) {
      await this.realm.syncSession.uploadAllLocalChanges();
      await this.realm.syncSession.downloadAllServerChanges();
    }
  }

  /**
   * Create an object in a schema table
   *
   * @param schemaName - Schema name
   * @param object - Object to create
   * @param updateMode - Update mode
   * @returns Created object
   */
  createObject<T>(schemaName: string, object: Partial<T>, updateMode?: 'never' | 'modified' | 'all'): T {
    this.ensureInitialized();

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    let result: T;

    this.realm.write(() => {
      result = this.realm.create(schemaName, object, updateMode);
    });

    return result!;
  }

  /**
   * Query objects from a schema table
   *
   * @param schemaName - Schema name
   * @returns Query results
   */
  queryObjects<T>(schemaName: string): RealmQueryResult<T> {
    this.ensureInitialized();
    return this.realm.objects(schemaName);
  }

  /**
   * Get an object by primary key
   *
   * @param schemaName - Schema name
   * @param key - Primary key value
   * @returns Object or null
   */
  getObject<T>(schemaName: string, key: any): T | null {
    this.ensureInitialized();
    return this.realm.objectForPrimaryKey(schemaName, key);
  }

  /**
   * Delete an object
   *
   * @param object - Object to delete
   */
  deleteObject(object: any): void {
    this.ensureInitialized();

    if (this.config.readOnly) {
      throw new Error('Cannot write to read-only Realm');
    }

    this.realm.write(() => {
      this.realm.delete(object);
    });
  }

  /**
   * Destroy the Realm instance
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    // Remove all listeners
    this.listeners.clear();

    // Close Realm
    this.realm.close();
    this.realm = null;
    this.isInitialized = false;
  }

  /**
   * Delete the Realm file completely
   */
  async deleteRealm(): Promise<void> {
    this.ensureInitialized();

    const Realm = await this.loadRealmModule();
    const path = this.realm.path;

    await this.destroy();
    Realm.deleteFile({ path });
  }

  // Helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('RealmProvider is not initialized');
    }
  }

  private updateAccessTime(): void {
    this.lastAccess = Date.now();
  }

  private serialize(value: any): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(data: string, type: string): T {
    return JSON.parse(data);
  }

  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private matchesFilter(value: any, filter: Record<string, any>): boolean {
    if (typeof value !== 'object') return false;

    for (const [field, filterValue] of Object.entries(filter)) {
      const actualValue = field.split('.').reduce((obj, key) => obj?.[key], value);
      if (actualValue !== filterValue) return false;
    }

    return true;
  }

  private notifyListeners(key: string, value: any): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(key, value);
        } catch (error) {
          this.log(`Error in listener for key "${key}": ${error}`);
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
          this.log(`Error in wildcard listener: ${error}`);
        }
      }
    }
  }

  private log(message: string): void {
    if (this.config.logging) {
      console.log(`[RealmProvider] ${message}`);
    }
  }
}

/**
 * Create a new RealmProvider instance
 *
 * @param schemaVersion - Schema version
 * @param options - Configuration options
 * @returns RealmProvider instance
 */
export function createRealmProvider(schemaVersion: number, options?: Partial<RealmConfig>): RealmProvider {
  return new RealmProvider({ schemaVersion, ...options });
}

/**
 * Create an encrypted RealmProvider instance
 *
 * @param schemaVersion - Schema version
 * @param encryptionKey - 64-byte encryption key
 * @param options - Additional configuration options
 * @returns Encrypted RealmProvider instance
 */
export function createEncryptedRealmProvider(
  schemaVersion: number,
  encryptionKey: ArrayBuffer,
  options?: Partial<RealmConfig>
): RealmProvider {
  if (encryptionKey.byteLength !== 64) {
    throw new Error('Encryption key must be exactly 64 bytes');
  }
  return new RealmProvider({ schemaVersion, encryptionKey, ...options });
}

export default RealmProvider;
