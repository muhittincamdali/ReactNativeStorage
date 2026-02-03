/**
 * Sync Module
 *
 * This module exports cloud synchronization and conflict resolution utilities
 * for React Native storage.
 *
 * @module sync
 * @version 2.0.0
 */

export {
  CloudSync,
  createCloudSync,
  CloudProvider,
  SyncStrategy,
  ConflictResolutionStrategy,
} from './CloudSync';

export type {
  CloudSyncConfig,
  CloudProviderConfig,
  FirebaseConfig,
  SupabaseConfig,
  AWSAmplifyConfig,
  CustomRESTConfig,
  CustomGraphQLConfig,
  iCloudConfig,
  GoogleDriveConfig,
  RetryConfig,
  SyncCallbacks,
  SyncProgress,
  SyncResult,
  SyncError,
} from './CloudSync';

export {
  ConflictResolver,
  createConflictResolver,
  ConflictType,
  MergeStrategy,
} from './ConflictResolver';

export type {
  SyncConflict,
  ConflictResolution,
  FieldMergeStrategy,
  ConflictResolverConfig,
  ConflictHistoryEntry,
} from './ConflictResolver';
