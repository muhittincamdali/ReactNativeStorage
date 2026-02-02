// Core storage
export { Storage, StorageInitError } from './storage/Storage';
export { StorageConfigBuilder, createDefaultConfig } from './storage/StorageConfig';

// Encryption
export { EncryptedStorage } from './encryption/EncryptedStorage';
export { BiometricStorage, BiometricAuthError } from './encryption/BiometricStorage';

// Keychain
export { KeychainStorage, KeychainError } from './keychain/KeychainStorage';

// SQLite
export { SQLiteStorage, SQLiteStorageError } from './sqlite/SQLiteStorage';
export { QueryBuilder } from './sqlite/QueryBuilder';
export { MigrationRunner, MigrationError } from './sqlite/Migration';

// Hooks
export { useStorage } from './hooks/useStorage';
export { useSecureStorage } from './hooks/useSecureStorage';

// Middleware
export { createStoragePersist, clearPersistedState } from './middleware/ZustandMiddleware';

// Utilities
export { JsonSerializer, TypedSerializer, StorageSerializationError } from './utils/serializer';

// Types
export type {
  StorageBackend,
  StorageConfig,
  StorageEntry,
  IStorage,
  Serializer,
  MigrationStep,
  SQLiteDatabase,
  SQLiteResult,
  BiometricOptions,
  KeychainEntry,
} from './types';
