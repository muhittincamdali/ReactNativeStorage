/**
 * SQLiteProvider - Full-featured SQLite storage provider for React Native
 *
 * This provider wraps expo-sqlite or react-native-sqlite-storage to provide
 * a robust relational storage solution with support for transactions,
 * migrations, and complex queries.
 *
 * @module SQLiteProvider
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
 * SQLite database configuration
 */
export interface SQLiteConfig {
  /** Database name (file name) */
  name: string;
  /** Database version for migrations */
  version: number;
  /** Storage location */
  location?: 'default' | 'Documents' | 'Library';
  /** Enable WAL mode for better performance */
  walMode?: boolean;
  /** Enable foreign keys */
  foreignKeys?: boolean;
  /** Custom table name for key-value storage */
  tableName?: string;
  /** Page size in bytes */
  pageSize?: number;
  /** Cache size in pages */
  cacheSize?: number;
  /** Enable query logging */
  logging?: boolean;
  /** Migration scripts */
  migrations?: SQLiteMigration[];
  /** Schema definitions for typed tables */
  schema?: SQLiteSchema[];
}

/**
 * Migration definition
 */
export interface SQLiteMigration {
  /** Version number */
  version: number;
  /** Migration description */
  description: string;
  /** Up migration SQL statements */
  up: string[];
  /** Down migration SQL statements */
  down: string[];
}

/**
 * Schema definition for typed tables
 */
export interface SQLiteSchema {
  /** Table name */
  name: string;
  /** Column definitions */
  columns: SQLiteColumn[];
  /** Index definitions */
  indexes?: SQLiteIndex[];
  /** Primary key columns */
  primaryKey?: string[];
  /** Unique constraints */
  unique?: string[][];
}

/**
 * Column definition
 */
export interface SQLiteColumn {
  /** Column name */
  name: string;
  /** SQLite data type */
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NULL';
  /** Whether column is nullable */
  nullable?: boolean;
  /** Default value */
  defaultValue?: any;
  /** Whether column is primary key */
  primaryKey?: boolean;
  /** Whether column auto-increments */
  autoIncrement?: boolean;
  /** Foreign key reference */
  references?: { table: string; column: string };
}

/**
 * Index definition
 */
export interface SQLiteIndex {
  /** Index name */
  name: string;
  /** Columns included in index */
  columns: string[];
  /** Whether index is unique */
  unique?: boolean;
  /** Partial index WHERE clause */
  where?: string;
}

/**
 * Query builder for constructing SQL queries
 */
export interface SQLiteQueryBuilder {
  select(columns?: string[]): SQLiteQueryBuilder;
  from(table: string): SQLiteQueryBuilder;
  where(condition: string, params?: any[]): SQLiteQueryBuilder;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): SQLiteQueryBuilder;
  limit(count: number): SQLiteQueryBuilder;
  offset(count: number): SQLiteQueryBuilder;
  join(table: string, condition: string): SQLiteQueryBuilder;
  groupBy(columns: string[]): SQLiteQueryBuilder;
  having(condition: string): SQLiteQueryBuilder;
  build(): { sql: string; params: any[] };
}

/**
 * Transaction context
 */
export interface TransactionContext {
  execute(sql: string, params?: any[]): Promise<any>;
  executeBatch(statements: Array<{ sql: string; params?: any[] }>): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * SQLite Provider class implementing StorageProvider interface
 *
 * @example
 * ```typescript
 * const provider = new SQLiteProvider({
 *   name: 'app.db',
 *   version: 1,
 *   walMode: true,
 *   migrations: [
 *     {
 *       version: 1,
 *       description: 'Initial schema',
 *       up: ['CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)'],
 *       down: ['DROP TABLE users'],
 *     }
 *   ],
 * });
 *
 * await provider.initialize();
 * await provider.set('user:1', { name: 'John', email: 'john@example.com' });
 * ```
 */
export class SQLiteProvider implements StorageProvider {
  /** Provider name identifier */
  public readonly name = 'sqlite';

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
    maxKeyLength: 512,
    maxValueSize: 1024 * 1024 * 1024, // 1GB
    maxBatchSize: 10000,
  };

  private config: SQLiteConfig;
  private db: any = null;
  private isInitialized = false;
  private currentVersion = 0;
  private metadata: Map<string, StorageMetadata> = new Map();
  private operationCount = 0;
  private errorCount = 0;
  private lastAccess = Date.now();

  /**
   * Creates a new SQLiteProvider instance
   *
   * @param config - Configuration options
   */
  constructor(config: SQLiteConfig) {
    this.config = {
      location: 'default',
      walMode: true,
      foreignKeys: true,
      tableName: 'key_value_store',
      pageSize: 4096,
      cacheSize: 2000,
      logging: false,
      migrations: [],
      schema: [],
      ...config,
    };
  }

  /**
   * Initialize the SQLite database
   *
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await this.openDatabase();

      // Configure database
      await this.configureDatabase();

      // Create key-value table
      await this.createKeyValueTable();

      // Run migrations
      await this.runMigrations();

      // Create schema tables
      await this.createSchemaTables();

      this.isInitialized = true;
      this.log('SQLite database initialized successfully');
    } catch (error) {
      this.errorCount++;
      throw new Error(`Failed to initialize SQLite: ${error}`);
    }
  }

  /**
   * Open the SQLite database
   */
  private async openDatabase(): Promise<any> {
    try {
      // Try expo-sqlite first
      const SQLite = require('expo-sqlite');
      return SQLite.openDatabase(this.config.name);
    } catch {
      try {
        // Fall back to react-native-sqlite-storage
        const SQLite = require('react-native-sqlite-storage');
        SQLite.enablePromise(true);
        return SQLite.openDatabase({
          name: this.config.name,
          location: this.config.location,
        });
      } catch {
        throw new Error('No SQLite library found. Install expo-sqlite or react-native-sqlite-storage');
      }
    }
  }

  /**
   * Configure database settings
   */
  private async configureDatabase(): Promise<void> {
    const statements: string[] = [];

    if (this.config.walMode) {
      statements.push('PRAGMA journal_mode = WAL');
    }

    if (this.config.foreignKeys) {
      statements.push('PRAGMA foreign_keys = ON');
    }

    if (this.config.pageSize) {
      statements.push(`PRAGMA page_size = ${this.config.pageSize}`);
    }

    if (this.config.cacheSize) {
      statements.push(`PRAGMA cache_size = ${this.config.cacheSize}`);
    }

    // Performance optimizations
    statements.push('PRAGMA synchronous = NORMAL');
    statements.push('PRAGMA temp_store = MEMORY');

    for (const sql of statements) {
      await this.execute(sql);
    }
  }

  /**
   * Create the key-value storage table
   */
  private async createKeyValueTable(): Promise<void> {
    const tableName = this.config.tableName;

    await this.execute(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        type TEXT DEFAULT 'json',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER,
        tags TEXT,
        size INTEGER NOT NULL,
        checksum TEXT
      )
    `);

    // Create indexes
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_${tableName}_expires ON ${tableName}(expires_at)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_${tableName}_created ON ${tableName}(created_at)`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_${tableName}_updated ON ${tableName}(updated_at)`);
  }

  /**
   * Run pending migrations
   */
  private async runMigrations(): Promise<void> {
    // Create migrations table
    await this.execute(`
      CREATE TABLE IF NOT EXISTS __migrations (
        version INTEGER PRIMARY KEY,
        description TEXT,
        applied_at INTEGER NOT NULL
      )
    `);

    // Get current version
    const result = await this.query('SELECT MAX(version) as version FROM __migrations');
    this.currentVersion = result[0]?.version || 0;

    // Run pending migrations
    const pendingMigrations = (this.config.migrations || [])
      .filter((m) => m.version > this.currentVersion)
      .sort((a, b) => a.version - b.version);

    for (const migration of pendingMigrations) {
      await this.transaction(async (tx) => {
        for (const sql of migration.up) {
          await tx.execute(sql);
        }

        await tx.execute(
          'INSERT INTO __migrations (version, description, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.description, Date.now()]
        );
      });

      this.currentVersion = migration.version;
      this.log(`Applied migration ${migration.version}: ${migration.description}`);
    }
  }

  /**
   * Create schema-defined tables
   */
  private async createSchemaTables(): Promise<void> {
    for (const schema of this.config.schema || []) {
      await this.createTableFromSchema(schema);
    }
  }

  /**
   * Create a table from schema definition
   */
  private async createTableFromSchema(schema: SQLiteSchema): Promise<void> {
    const columns = schema.columns
      .map((col) => {
        let def = `${col.name} ${col.type}`;
        if (col.primaryKey) def += ' PRIMARY KEY';
        if (col.autoIncrement) def += ' AUTOINCREMENT';
        if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
        if (col.defaultValue !== undefined) {
          def += ` DEFAULT ${typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue}`;
        }
        if (col.references) {
          def += ` REFERENCES ${col.references.table}(${col.references.column})`;
        }
        return def;
      })
      .join(', ');

    let createSQL = `CREATE TABLE IF NOT EXISTS ${schema.name} (${columns}`;

    if (schema.primaryKey && schema.primaryKey.length > 1) {
      createSQL += `, PRIMARY KEY (${schema.primaryKey.join(', ')})`;
    }

    if (schema.unique) {
      for (const uniqueCols of schema.unique) {
        createSQL += `, UNIQUE (${uniqueCols.join(', ')})`;
      }
    }

    createSQL += ')';

    await this.execute(createSQL);

    // Create indexes
    for (const index of schema.indexes || []) {
      const uniqueStr = index.unique ? 'UNIQUE' : '';
      let indexSQL = `CREATE ${uniqueStr} INDEX IF NOT EXISTS ${index.name} ON ${schema.name} (${index.columns.join(', ')})`;
      if (index.where) {
        indexSQL += ` WHERE ${index.where}`;
      }
      await this.execute(indexSQL);
    }
  }

  /**
   * Execute a SQL statement
   */
  private async execute(sql: string, params: any[] = []): Promise<any> {
    this.operationCount++;
    this.lastAccess = Date.now();

    return new Promise((resolve, reject) => {
      this.db.transaction((tx: any) => {
        tx.executeSql(
          sql,
          params,
          (_: any, result: any) => {
            if (this.config.logging) {
              this.log(`SQL: ${sql} | Params: ${JSON.stringify(params)}`);
            }
            resolve(result);
          },
          (_: any, error: any) => {
            this.errorCount++;
            reject(error);
          }
        );
      });
    });
  }

  /**
   * Query and return rows
   */
  private async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.execute(sql, params);
    const rows: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }
    return rows;
  }

  /**
   * Get a value from storage by key
   *
   * @param key - The key to retrieve
   * @returns Promise resolving to the value or null
   */
  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    const rows = await this.query(
      `SELECT value, type, expires_at FROM ${this.config.tableName} WHERE key = ?`,
      [key]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      await this.remove(key);
      return null;
    }

    return this.deserialize(row.value, row.type);
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

    const now = Date.now();
    const serialized = this.serialize(value);
    const type = this.getValueType(value);
    const tags = options?.tags ? JSON.stringify(options.tags) : null;
    const expiresAt = options?.ttl ? now + options.ttl : null;
    const size = serialized.length;
    const checksum = this.calculateChecksum(serialized);

    await this.execute(
      `INSERT OR REPLACE INTO ${this.config.tableName} 
       (key, value, type, created_at, updated_at, expires_at, tags, size, checksum)
       VALUES (?, ?, ?, COALESCE((SELECT created_at FROM ${this.config.tableName} WHERE key = ?), ?), ?, ?, ?, ?, ?)`,
      [key, serialized, type, key, now, now, expiresAt, tags, size, checksum]
    );

    this.metadata.set(key, {
      key,
      size,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt || undefined,
      tags: options?.tags || [],
      compressed: false,
      encrypted: false,
    });
  }

  /**
   * Remove a value from storage
   *
   * @param key - The key to remove
   */
  async remove(key: string): Promise<void> {
    this.ensureInitialized();

    await this.execute(`DELETE FROM ${this.config.tableName} WHERE key = ?`, [key]);
    this.metadata.delete(key);
  }

  /**
   * Check if a key exists
   *
   * @param key - The key to check
   * @returns Promise resolving to true if key exists
   */
  async has(key: string): Promise<boolean> {
    this.ensureInitialized();

    const rows = await this.query(
      `SELECT 1 FROM ${this.config.tableName} WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)`,
      [key, Date.now()]
    );

    return rows.length > 0;
  }

  /**
   * Get all keys
   *
   * @param prefix - Optional prefix filter
   * @returns Promise resolving to array of keys
   */
  async keys(prefix?: string): Promise<string[]> {
    this.ensureInitialized();

    let sql = `SELECT key FROM ${this.config.tableName} WHERE (expires_at IS NULL OR expires_at > ?)`;
    const params: any[] = [Date.now()];

    if (prefix) {
      sql += ' AND key LIKE ?';
      params.push(`${prefix}%`);
    }

    const rows = await this.query(sql, params);
    return rows.map((row) => row.key);
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    await this.execute(`DELETE FROM ${this.config.tableName}`);
    this.metadata.clear();
  }

  /**
   * Get multiple values
   *
   * @param keys - Array of keys
   * @returns Promise resolving to map of values
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    this.ensureInitialized();

    const results = new Map<string, T | null>();
    const placeholders = keys.map(() => '?').join(',');

    const rows = await this.query(
      `SELECT key, value, type, expires_at FROM ${this.config.tableName} WHERE key IN (${placeholders})`,
      keys
    );

    const rowMap = new Map(rows.map((r) => [r.key, r]));

    for (const key of keys) {
      const row = rowMap.get(key);
      if (!row) {
        results.set(key, null);
      } else if (row.expires_at && row.expires_at < Date.now()) {
        results.set(key, null);
        await this.remove(key);
      } else {
        results.set(key, this.deserialize(row.value, row.type));
      }
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

    await this.transaction(async (tx) => {
      for (const entry of entries) {
        const now = Date.now();
        const serialized = this.serialize(entry.value);
        const type = this.getValueType(entry.value);
        const tags = options?.tags ? JSON.stringify(options.tags) : null;
        const expiresAt = options?.ttl ? now + options.ttl : null;
        const size = serialized.length;
        const checksum = this.calculateChecksum(serialized);

        await tx.execute(
          `INSERT OR REPLACE INTO ${this.config.tableName} 
           (key, value, type, created_at, updated_at, expires_at, tags, size, checksum)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entry.key, serialized, type, now, now, expiresAt, tags, size, checksum]
        );
      }
    });
  }

  /**
   * Remove multiple values
   *
   * @param keys - Array of keys to remove
   */
  async removeMany(keys: string[]): Promise<void> {
    this.ensureInitialized();

    const placeholders = keys.map(() => '?').join(',');
    await this.execute(`DELETE FROM ${this.config.tableName} WHERE key IN (${placeholders})`, keys);

    for (const key of keys) {
      this.metadata.delete(key);
    }
  }

  /**
   * Execute batch operations
   *
   * @param operations - Array of batch operations
   * @returns Promise resolving to results
   */
  async batch(operations: BatchOperation[]): Promise<Array<{ success: boolean; error?: string }>> {
    this.ensureInitialized();

    const results: Array<{ success: boolean; error?: string }> = [];

    await this.transaction(async (tx) => {
      for (const op of operations) {
        try {
          switch (op.type) {
            case 'set': {
              const now = Date.now();
              const serialized = this.serialize(op.value);
              const type = this.getValueType(op.value);
              await tx.execute(
                `INSERT OR REPLACE INTO ${this.config.tableName} 
                 (key, value, type, created_at, updated_at, size, checksum)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [op.key, serialized, type, now, now, serialized.length, this.calculateChecksum(serialized)]
              );
              results.push({ success: true });
              break;
            }
            case 'remove':
              await tx.execute(`DELETE FROM ${this.config.tableName} WHERE key = ?`, [op.key]);
              results.push({ success: true });
              break;
            case 'clear':
              await tx.execute(`DELETE FROM ${this.config.tableName}`);
              results.push({ success: true });
              break;
            default:
              results.push({ success: false, error: 'Unknown operation' });
          }
        } catch (error) {
          results.push({ success: false, error: String(error) });
        }
      }
    });

    return results;
  }

  /**
   * Execute a transaction
   *
   * @param callback - Transaction callback
   */
  async transaction<T>(callback: (tx: TransactionContext) => Promise<T>): Promise<T> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      this.db.transaction(
        (tx: any) => {
          const context: TransactionContext = {
            execute: (sql: string, params?: any[]) =>
              new Promise((res, rej) => {
                tx.executeSql(
                  sql,
                  params || [],
                  (_: any, result: any) => res(result),
                  (_: any, error: any) => rej(error)
                );
              }),
            executeBatch: async (statements) => {
              for (const stmt of statements) {
                await context.execute(stmt.sql, stmt.params);
              }
            },
            commit: async () => {},
            rollback: async () => {},
          };

          callback(context)
            .then(resolve)
            .catch(reject);
        },
        reject,
        () => {}
      );
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

    const startTime = Date.now();
    let sql = `SELECT key, value, type, created_at, updated_at, expires_at, tags, size FROM ${this.config.tableName} WHERE 1=1`;
    const params: any[] = [];

    // Prefix filter
    if (options.prefix) {
      sql += ' AND key LIKE ?';
      params.push(`${options.prefix}%`);
    }

    // Expiration filter
    sql += ' AND (expires_at IS NULL OR expires_at > ?)';
    params.push(Date.now());

    // Count total before pagination
    const countResult = await this.query(
      sql.replace('SELECT key, value, type, created_at, updated_at, expires_at, tags, size', 'SELECT COUNT(*) as count'),
      params
    );
    const total = countResult[0]?.count || 0;

    // Sorting
    if (options.sort) {
      const column = options.sort.field === 'key' ? 'key' : options.sort.field === 'createdAt' ? 'created_at' : 'updated_at';
      sql += ` ORDER BY ${column} ${options.sort.order.toUpperCase()}`;
    }

    // Pagination
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const rows = await this.query(sql, params);

    const items: StorageItem<T>[] = rows
      .map((row) => {
        const value = this.deserialize<T>(row.value, row.type);

        // Apply filter
        if (options.filter && !this.matchesFilter(value, options.filter)) {
          return null;
        }

        return {
          key: row.key,
          value,
          metadata: {
            key: row.key,
            size: row.size,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            expiresAt: row.expires_at,
            tags: row.tags ? JSON.parse(row.tags) : [],
            compressed: false,
            encrypted: false,
          },
        };
      })
      .filter((item): item is StorageItem<T> => item !== null);

    return {
      items,
      total,
      offset: options.offset || 0,
      limit: options.limit || items.length,
      hasMore: (options.offset || 0) + items.length < total,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Subscribe to changes (polling-based)
   *
   * @param key - Key to watch
   * @param callback - Change callback
   * @returns Unsubscribe function
   */
  subscribe(key: string, callback: (key: string, value: any) => void): () => void {
    let lastValue: any = undefined;
    let active = true;

    const poll = async () => {
      if (!active) return;

      const value = await this.get(key);
      if (JSON.stringify(value) !== JSON.stringify(lastValue)) {
        lastValue = value;
        callback(key, value);
      }

      setTimeout(poll, 1000);
    };

    poll();

    return () => {
      active = false;
    };
  }

  /**
   * Get storage statistics
   *
   * @returns Promise resolving to stats
   */
  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const countResult = await this.query(`SELECT COUNT(*) as count, SUM(size) as totalSize FROM ${this.config.tableName}`);
    const row = countResult[0] || { count: 0, totalSize: 0 };

    return {
      totalKeys: row.count,
      totalSize: row.totalSize || 0,
      cacheSize: 0,
      cacheHitRate: 0,
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      lastAccess: this.lastAccess,
      isEncrypted: false,
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

    const rows = await this.query(
      `SELECT created_at, updated_at, expires_at, tags, size FROM ${this.config.tableName} WHERE key = ?`,
      [key]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      key,
      size: row.size,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      compressed: false,
      encrypted: false,
    };
  }

  /**
   * Export all data
   *
   * @returns Promise resolving to exported data
   */
  async export(): Promise<Record<string, any>> {
    this.ensureInitialized();

    const rows = await this.query(`SELECT key, value, type FROM ${this.config.tableName}`);
    const data: Record<string, any> = {};

    for (const row of rows) {
      data[row.key] = this.deserialize(row.value, row.type);
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

    const result = { imported: 0, skipped: 0, errors: [] as string[] };
    const entries = data.data || data;

    await this.transaction(async (tx) => {
      for (const [key, value] of Object.entries(entries)) {
        try {
          const exists = await this.has(key);
          if (exists && !options?.overwrite) {
            result.skipped++;
            continue;
          }

          await this.set(key, value);
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

    const result = await this.execute(
      `DELETE FROM ${this.config.tableName} WHERE expires_at IS NOT NULL AND expires_at < ?`,
      [Date.now()]
    );

    return result.rowsAffected || 0;
  }

  /**
   * Vacuum the database
   */
  async vacuum(): Promise<void> {
    this.ensureInitialized();
    await this.execute('VACUUM');
  }

  /**
   * Destroy the database
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) return;

    await this.db.close();
    this.db = null;
    this.isInitialized = false;
    this.metadata.clear();
  }

  // Helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SQLiteProvider is not initialized');
    }
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

  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private matchesFilter(value: any, filter: Record<string, any>): boolean {
    if (typeof value !== 'object') return false;

    for (const [field, filterValue] of Object.entries(filter)) {
      const actualValue = field.split('.').reduce((obj, key) => obj?.[key], value);
      if (actualValue !== filterValue) return false;
    }

    return true;
  }

  private log(message: string): void {
    if (this.config.logging) {
      console.log(`[SQLiteProvider] ${message}`);
    }
  }
}

/**
 * Create a new SQLiteProvider instance
 *
 * @param name - Database name
 * @param options - Configuration options
 * @returns SQLiteProvider instance
 */
export function createSQLiteProvider(name: string, options?: Partial<SQLiteConfig>): SQLiteProvider {
  return new SQLiteProvider({ name, version: 1, ...options });
}

export default SQLiteProvider;
