import { IStorage, SQLiteDatabase, SQLiteResult, StorageEntry } from '../types';
import { JsonSerializer } from '../utils/serializer';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS storage (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    ttl INTEGER DEFAULT 0,
    encrypted INTEGER DEFAULT 0
  )
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_storage_timestamp ON storage(timestamp)
`;

export class SQLiteStorage implements IStorage {
  private db: SQLiteDatabase | null = null;
  private tableName: string;
  private serializer: JsonSerializer;
  private initialized = false;

  constructor(private dbName = 'app_storage.db', tableName = 'storage') {
    this.tableName = tableName;
    this.serializer = new JsonSerializer();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { open } = require('react-native-quick-sqlite');
      this.db = await open({ name: this.dbName });
      await this.db!.execute(CREATE_TABLE_SQL);
      await this.db!.execute(CREATE_INDEX_SQL);
      this.initialized = true;
    } catch (error) {
      throw new SQLiteStorageError(
        `Failed to initialize SQLite: ${(error as Error).message}`
      );
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new SQLiteStorageError('SQLiteStorage not initialized. Call initialize() first.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    const result = await this.db!.execute(
      `SELECT value, timestamp, ttl FROM ${this.tableName} WHERE key = ?`,
      [key]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const ttl = row.ttl as number;
    const timestamp = row.timestamp as number;

    if (ttl > 0 && Date.now() - timestamp > ttl) {
      await this.remove(key);
      return null;
    }

    try {
      return this.serializer.deserialize<T>(row.value as string);
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.ensureInitialized();

    const serialized = this.serializer.serialize(value);
    await this.db!.execute(
      `INSERT OR REPLACE INTO ${this.tableName} (key, value, timestamp, ttl) VALUES (?, ?, ?, ?)`,
      [key, serialized, Date.now(), ttl ?? 0]
    );
  }

  async remove(key: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.execute(
      `DELETE FROM ${this.tableName} WHERE key = ?`,
      [key]
    );
  }

  async clear(): Promise<void> {
    this.ensureInitialized();
    await this.db!.execute(`DELETE FROM ${this.tableName}`);
  }

  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    const result = await this.db!.execute(
      `SELECT 1 FROM ${this.tableName} WHERE key = ? LIMIT 1`,
      [key]
    );
    return result.rows.length > 0;
  }

  async keys(): Promise<string[]> {
    this.ensureInitialized();
    const result = await this.db!.execute(
      `SELECT key FROM ${this.tableName}`
    );
    return result.rows.map((row) => row.key as string);
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const placeholders = keys.map(() => '?').join(',');

    this.ensureInitialized();
    const result = await this.db!.execute(
      `SELECT key, value, timestamp, ttl FROM ${this.tableName} WHERE key IN (${placeholders})`,
      keys
    );

    for (const key of keys) {
      const row = result.rows.find((r) => r.key === key);
      if (!row) {
        results.set(key, null);
        continue;
      }

      try {
        results.set(key, this.serializer.deserialize<T>(row.value as string));
      } catch {
        results.set(key, null);
      }
    }

    return results;
  }

  async setMultiple<T>(entries: Array<{ key: string; value: T }>): Promise<void> {
    this.ensureInitialized();
    const commands = entries.map(({ key, value }) => ({
      sql: `INSERT OR REPLACE INTO ${this.tableName} (key, value, timestamp, ttl) VALUES (?, ?, ?, 0)`,
      params: [key, this.serializer.serialize(value), Date.now()],
    }));
    await this.db!.executeBatch(commands);
  }

  async count(): Promise<number> {
    this.ensureInitialized();
    const result = await this.db!.execute(
      `SELECT COUNT(*) as cnt FROM ${this.tableName}`
    );
    return (result.rows[0]?.cnt as number) ?? 0;
  }

  async cleanExpired(): Promise<number> {
    this.ensureInitialized();
    const result = await this.db!.execute(
      `DELETE FROM ${this.tableName} WHERE ttl > 0 AND (timestamp + ttl) < ?`,
      [Date.now()]
    );
    return result.rowsAffected;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  getDatabase(): SQLiteDatabase | null {
    return this.db;
  }
}

export class SQLiteStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SQLiteStorageError';
  }
}
