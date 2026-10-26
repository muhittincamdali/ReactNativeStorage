export { createStorage, Storage } from './storage';
export type { StorageOptions } from './storage';
export { StorageItem } from './item';
export type {
  ItemOptions,
  ItemOptionsWithDefault,
  ItemSnapshot,
  Migration,
  SetOptions,
} from './item';
export { StorageError, isStorageError } from './errors';
export type { StorageErrorCode, ValidationIssue } from './errors';
export type { Schema, StandardSchemaV1, StandardSchemaResult, TypeGuard } from './schema';
export type { StorableValue } from './codec';
export { MAX_DEPTH } from './codec';
export {
  DEFAULT_CACHE_SIZE,
  DEFAULT_MAX_VALUE_BYTES,
  MAX_KEY_LENGTH,
  MAX_NAMESPACE_LENGTH,
  MAX_SCHEMA_VERSION,
} from './validation';

export { memoryDriver } from './driver';
export type { AsyncStorageDriver, StorageDriver, SyncStorageDriver } from './driver';
export { mmkvDriver } from './drivers/mmkv';
export type { MMKVLike } from './drivers/mmkv';
export { asyncStorageDriver } from './drivers/asyncStorage';
export type { AsyncStorageLike } from './drivers/asyncStorage';
export {
  SECURE_STORE_MAX_VALUE_BYTES,
  encodeSecureStoreKey,
  secureStoreDriver,
} from './drivers/secureStore';
export type { SecureStoreLike } from './drivers/secureStore';
export { webStorageDriver } from './drivers/webStorage';
export type { StorageEventTarget, WebStorageLike } from './drivers/webStorage';

export { copyKeys } from './copyKeys';
export type { CopyKeysOptions, CopyKeysResult } from './copyKeys';
export { toStateStorage } from './stateStorage';
export type { StateStorage } from './stateStorage';
export { getOrCreateSecret, randomSecret } from './secret';
export type { RandomBytes, SecretOptions } from './secret';
