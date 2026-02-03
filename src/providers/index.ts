/**
 * Storage Providers
 *
 * This module exports all available storage providers for React Native.
 * Each provider implements the StorageProvider interface and offers
 * different trade-offs in terms of performance, features, and use cases.
 *
 * @module providers
 * @version 2.0.0
 */

export { MMKVProvider, createMMKVProvider, createEncryptedMMKVProvider } from './MMKVProvider';
export type { MMKVConfig, MMKVMode, MMKVSerializer, CacheConfig } from './MMKVProvider';

export { SQLiteProvider, createSQLiteProvider } from './SQLiteProvider';
export type {
  SQLiteConfig,
  SQLiteMigration,
  SQLiteSchema,
  SQLiteColumn,
  SQLiteIndex,
  SQLiteQueryBuilder,
  TransactionContext,
} from './SQLiteProvider';

export { RealmProvider, createRealmProvider, createEncryptedRealmProvider } from './RealmProvider';
export type {
  RealmConfig,
  RealmSyncConfig,
  RealmSchemaDefinition,
  RealmPropertyDefinition,
  RealmQueryResult,
} from './RealmProvider';
