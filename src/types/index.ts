export type StorageBackend = 'mmkv' | 'sqlite' | 'keychain' | 'encrypted';

export interface StorageConfig {
  backend: StorageBackend;
  encryptionKey?: string;
  instanceId?: string;
  enableLogging?: boolean;
  defaultTTL?: number;
  maxRetries?: number;
  serializer?: Serializer;
}

export interface Serializer {
  serialize<T>(value: T): string;
  deserialize<T>(raw: string): T;
}

export interface StorageEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
  encrypted?: boolean;
}

export interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  getMultiple<T>(keys: string[]): Promise<Map<string, T | null>>;
  setMultiple<T>(entries: Array<{ key: string; value: T }>): Promise<void>;
}

export interface MigrationStep {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
  description?: string;
}

export interface SQLiteDatabase {
  execute(sql: string, params?: unknown[]): Promise<SQLiteResult>;
  executeBatch(commands: Array<{ sql: string; params?: unknown[] }>): Promise<void>;
  close(): Promise<void>;
}

export interface SQLiteResult {
  rows: Record<string, unknown>[];
  rowsAffected: number;
  insertId?: number;
}

export interface BiometricOptions {
  promptTitle?: string;
  promptSubtitle?: string;
  fallbackLabel?: string;
  accessControl?: 'biometry' | 'biometryOrPasscode' | 'passcode';
}

export interface KeychainEntry {
  service: string;
  username: string;
  password: string;
  accessGroup?: string;
}
