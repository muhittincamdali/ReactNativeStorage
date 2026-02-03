/**
 * CloudSync - Cloud synchronization service for React Native storage
 *
 * This module provides bidirectional cloud synchronization with support for
 * multiple cloud providers, conflict resolution, offline queuing, and
 * real-time sync capabilities.
 *
 * @module CloudSync
 * @version 2.0.0
 */

import type {
  StorageProvider,
  StorageItem,
  StorageMetadata,
} from '../types';
import type { ConflictResolver, ConflictResolution, SyncConflict } from './ConflictResolver';

/**
 * Cloud sync configuration
 */
export interface CloudSyncConfig {
  /** Cloud provider to use */
  provider: CloudProvider;
  /** Provider-specific configuration */
  providerConfig: CloudProviderConfig;
  /** Sync strategy */
  strategy: SyncStrategy;
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
  /** Custom conflict resolver */
  conflictResolver?: ConflictResolver;
  /** Sync interval in milliseconds (for periodic sync) */
  syncInterval?: number;
  /** Enable real-time sync */
  realtime?: boolean;
  /** Batch size for sync operations */
  batchSize?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Enable compression for network transfer */
  compression?: boolean;
  /** Enable encryption for network transfer */
  encryption?: boolean;
  /** Encryption key for network transfer */
  encryptionKey?: string;
  /** Callbacks for sync events */
  callbacks?: SyncCallbacks;
  /** Enable offline queue */
  offlineQueue?: boolean;
  /** Maximum offline queue size */
  maxQueueSize?: number;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Supported cloud providers
 */
export enum CloudProvider {
  /** Firebase Realtime Database */
  FIREBASE = 'firebase',
  /** Supabase */
  SUPABASE = 'supabase',
  /** AWS Amplify */
  AWS_AMPLIFY = 'aws_amplify',
  /** Custom REST API */
  CUSTOM_REST = 'custom_rest',
  /** Custom GraphQL API */
  CUSTOM_GRAPHQL = 'custom_graphql',
  /** iCloud (iOS only) */
  ICLOUD = 'icloud',
  /** Google Drive */
  GOOGLE_DRIVE = 'google_drive',
}

/**
 * Cloud provider configuration
 */
export type CloudProviderConfig =
  | FirebaseConfig
  | SupabaseConfig
  | AWSAmplifyConfig
  | CustomRESTConfig
  | CustomGraphQLConfig
  | iCloudConfig
  | GoogleDriveConfig;

/**
 * Firebase configuration
 */
export interface FirebaseConfig {
  type: 'firebase';
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL?: string;
  collection?: string;
}

/**
 * Supabase configuration
 */
export interface SupabaseConfig {
  type: 'supabase';
  url: string;
  anonKey: string;
  table?: string;
  schema?: string;
}

/**
 * AWS Amplify configuration
 */
export interface AWSAmplifyConfig {
  type: 'aws_amplify';
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  identityPoolId?: string;
  graphqlEndpoint?: string;
  apiKey?: string;
}

/**
 * Custom REST API configuration
 */
export interface CustomRESTConfig {
  type: 'custom_rest';
  baseUrl: string;
  endpoints: {
    get: string;
    set: string;
    delete: string;
    list: string;
    sync: string;
  };
  headers?: Record<string, string>;
  authToken?: string;
}

/**
 * Custom GraphQL configuration
 */
export interface CustomGraphQLConfig {
  type: 'custom_graphql';
  endpoint: string;
  queries: {
    get: string;
    list: string;
  };
  mutations: {
    set: string;
    delete: string;
    sync: string;
  };
  headers?: Record<string, string>;
  authToken?: string;
}

/**
 * iCloud configuration
 */
export interface iCloudConfig {
  type: 'icloud';
  containerId: string;
  recordType?: string;
}

/**
 * Google Drive configuration
 */
export interface GoogleDriveConfig {
  type: 'google_drive';
  clientId: string;
  folderId?: string;
  appDataFolder?: boolean;
}

/**
 * Sync strategies
 */
export enum SyncStrategy {
  /** Full sync - download everything */
  FULL = 'full',
  /** Incremental sync - only changes since last sync */
  INCREMENTAL = 'incremental',
  /** Delta sync - binary diff-based */
  DELTA = 'delta',
  /** Selective sync - only specified keys */
  SELECTIVE = 'selective',
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  /** Local changes always win */
  LOCAL_WINS = 'local_wins',
  /** Remote changes always win */
  REMOTE_WINS = 'remote_wins',
  /** Most recent change wins */
  LAST_WRITE_WINS = 'last_write_wins',
  /** Merge changes automatically */
  AUTO_MERGE = 'auto_merge',
  /** Manual resolution required */
  MANUAL = 'manual',
  /** Custom resolver function */
  CUSTOM = 'custom',
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Retry on these status codes */
  retryOnStatusCodes?: number[];
}

/**
 * Sync callbacks
 */
export interface SyncCallbacks {
  /** Called when sync starts */
  onSyncStart?: () => void;
  /** Called when sync completes */
  onSyncComplete?: (result: SyncResult) => void;
  /** Called when sync fails */
  onSyncError?: (error: Error) => void;
  /** Called on sync progress */
  onProgress?: (progress: SyncProgress) => void;
  /** Called when conflict detected */
  onConflict?: (conflict: SyncConflict) => Promise<ConflictResolution>;
  /** Called when item is synced */
  onItemSynced?: (key: string, direction: 'upload' | 'download') => void;
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Sync progress information
 */
export interface SyncProgress {
  /** Total items to sync */
  total: number;
  /** Items synced */
  completed: number;
  /** Current operation */
  operation: 'uploading' | 'downloading' | 'resolving';
  /** Current key being synced */
  currentKey?: string;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Sync result
 */
export interface SyncResult {
  /** Whether sync was successful */
  success: boolean;
  /** Items uploaded */
  uploaded: number;
  /** Items downloaded */
  downloaded: number;
  /** Conflicts resolved */
  conflictsResolved: number;
  /** Errors encountered */
  errors: SyncError[];
  /** Duration in milliseconds */
  duration: number;
  /** Timestamp of sync */
  timestamp: number;
  /** Items that were skipped */
  skipped: number;
}

/**
 * Sync error
 */
export interface SyncError {
  /** Key that failed */
  key: string;
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Offline queue item
 */
interface QueueItem {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: 'set' | 'delete';
  /** Key */
  key: string;
  /** Value (for set operations) */
  value?: any;
  /** Timestamp */
  timestamp: number;
  /** Retry count */
  retryCount: number;
}

/**
 * Sync state
 */
interface SyncState {
  /** Last sync timestamp */
  lastSync: number;
  /** Sync in progress */
  isSyncing: boolean;
  /** Connected to cloud */
  isConnected: boolean;
  /** Pending changes */
  pendingChanges: number;
  /** Current version vector */
  versionVector: Record<string, number>;
}

/**
 * CloudSync service for synchronizing storage with cloud providers
 *
 * @example
 * ```typescript
 * const cloudSync = new CloudSync({
 *   provider: CloudProvider.FIREBASE,
 *   providerConfig: {
 *     type: 'firebase',
 *     apiKey: 'your-api-key',
 *     projectId: 'your-project',
 *     // ... other firebase config
 *   },
 *   strategy: SyncStrategy.INCREMENTAL,
 *   conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
 *   realtime: true,
 * });
 *
 * await cloudSync.initialize(localStorageProvider);
 * await cloudSync.sync();
 * ```
 */
export class CloudSync {
  /** Service name */
  public readonly name = 'cloud-sync';

  /** Service version */
  public readonly version = '2.0.0';

  private config: CloudSyncConfig;
  private localProvider: StorageProvider | null = null;
  private cloudClient: any = null;
  private state: SyncState;
  private offlineQueue: QueueItem[] = [];
  private syncTimer: NodeJS.Timeout | null = null;
  private realtimeSubscription: any = null;
  private isInitialized = false;

  /**
   * Creates a new CloudSync instance
   *
   * @param config - Configuration options
   */
  constructor(config: CloudSyncConfig) {
    this.config = {
      strategy: SyncStrategy.INCREMENTAL,
      conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
      batchSize: 100,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
      },
      compression: true,
      offlineQueue: true,
      maxQueueSize: 1000,
      logging: false,
      ...config,
    };

    this.state = {
      lastSync: 0,
      isSyncing: false,
      isConnected: false,
      pendingChanges: 0,
      versionVector: {},
    };
  }

  /**
   * Initialize the cloud sync service
   *
   * @param localProvider - Local storage provider to sync
   */
  async initialize(localProvider: StorageProvider): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.localProvider = localProvider;

    try {
      // Initialize cloud client
      await this.initializeCloudClient();

      // Load offline queue
      await this.loadOfflineQueue();

      // Load sync state
      await this.loadSyncState();

      // Start periodic sync if configured
      if (this.config.syncInterval) {
        this.startPeriodicSync();
      }

      // Start realtime sync if configured
      if (this.config.realtime) {
        await this.startRealtimeSync();
      }

      // Check connection
      await this.checkConnection();

      this.isInitialized = true;
      this.log('CloudSync initialized');
    } catch (error) {
      throw new Error(`Failed to initialize CloudSync: ${error}`);
    }
  }

  /**
   * Initialize the cloud provider client
   */
  private async initializeCloudClient(): Promise<void> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE:
        this.cloudClient = await this.initializeFirebase();
        break;
      case CloudProvider.SUPABASE:
        this.cloudClient = await this.initializeSupabase();
        break;
      case CloudProvider.AWS_AMPLIFY:
        this.cloudClient = await this.initializeAmplify();
        break;
      case CloudProvider.CUSTOM_REST:
        this.cloudClient = this.initializeCustomREST();
        break;
      case CloudProvider.CUSTOM_GRAPHQL:
        this.cloudClient = this.initializeCustomGraphQL();
        break;
      case CloudProvider.ICLOUD:
        this.cloudClient = await this.initializeiCloud();
        break;
      case CloudProvider.GOOGLE_DRIVE:
        this.cloudClient = await this.initializeGoogleDrive();
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${this.config.provider}`);
    }
  }

  /**
   * Initialize Firebase client
   */
  private async initializeFirebase(): Promise<any> {
    try {
      const firebase = require('@react-native-firebase/app').default;
      require('@react-native-firebase/database');

      const config = this.config.providerConfig as FirebaseConfig;

      if (!firebase.apps.length) {
        await firebase.initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
          databaseURL: config.databaseURL,
        });
      }

      return firebase.database();
    } catch {
      throw new Error('Firebase is not installed');
    }
  }

  /**
   * Initialize Supabase client
   */
  private async initializeSupabase(): Promise<any> {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const config = this.config.providerConfig as SupabaseConfig;

      return createClient(config.url, config.anonKey);
    } catch {
      throw new Error('Supabase is not installed');
    }
  }

  /**
   * Initialize AWS Amplify client
   */
  private async initializeAmplify(): Promise<any> {
    try {
      const { Amplify, DataStore } = require('aws-amplify');
      const config = this.config.providerConfig as AWSAmplifyConfig;

      Amplify.configure({
        Auth: {
          region: config.region,
          userPoolId: config.userPoolId,
          userPoolWebClientId: config.userPoolWebClientId,
          identityPoolId: config.identityPoolId,
        },
      });

      return DataStore;
    } catch {
      throw new Error('AWS Amplify is not installed');
    }
  }

  /**
   * Initialize custom REST client
   */
  private initializeCustomREST(): any {
    const config = this.config.providerConfig as CustomRESTConfig;

    return {
      baseUrl: config.baseUrl,
      endpoints: config.endpoints,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
      },
    };
  }

  /**
   * Initialize custom GraphQL client
   */
  private initializeCustomGraphQL(): any {
    const config = this.config.providerConfig as CustomGraphQLConfig;

    return {
      endpoint: config.endpoint,
      queries: config.queries,
      mutations: config.mutations,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
        ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
      },
    };
  }

  /**
   * Initialize iCloud client
   */
  private async initializeiCloud(): Promise<any> {
    try {
      const CloudKit = require('react-native-cloud-store');
      const config = this.config.providerConfig as iCloudConfig;

      return {
        CloudKit,
        containerId: config.containerId,
        recordType: config.recordType || 'StorageItem',
      };
    } catch {
      throw new Error('iCloud is not available');
    }
  }

  /**
   * Initialize Google Drive client
   */
  private async initializeGoogleDrive(): Promise<any> {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const config = this.config.providerConfig as GoogleDriveConfig;

      GoogleSignin.configure({
        webClientId: config.clientId,
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      });

      return {
        GoogleSignin,
        folderId: config.folderId,
        appDataFolder: config.appDataFolder,
      };
    } catch {
      throw new Error('Google Sign-In is not installed');
    }
  }

  /**
   * Perform a sync operation
   *
   * @param options - Sync options
   * @returns Promise resolving to sync result
   */
  async sync(options?: { keys?: string[]; force?: boolean }): Promise<SyncResult> {
    this.ensureInitialized();

    if (this.state.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.state.isSyncing = true;
    this.config.callbacks?.onSyncStart?.();

    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      uploaded: 0,
      downloaded: 0,
      conflictsResolved: 0,
      errors: [],
      duration: 0,
      timestamp: startTime,
      skipped: 0,
    };

    try {
      // Process offline queue first
      if (this.config.offlineQueue && this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }

      // Get local and remote changes
      const localChanges = await this.getLocalChanges(options?.keys);
      const remoteChanges = await this.getRemoteChanges();

      const total = localChanges.length + remoteChanges.length;
      let completed = 0;

      // Upload local changes
      for (const item of localChanges) {
        try {
          this.notifyProgress(total, completed, 'uploading', item.key);

          const remoteItem = remoteChanges.find((r) => r.key === item.key);

          if (remoteItem) {
            // Handle conflict
            const resolution = await this.resolveConflict(item, remoteItem);
            if (resolution.action === 'upload') {
              await this.uploadItem(item.key, item.value, item.metadata);
              result.uploaded++;
            } else if (resolution.action === 'download') {
              await this.downloadItem(remoteItem.key, remoteItem.value);
              result.downloaded++;
            }
            result.conflictsResolved++;
          } else {
            await this.uploadItem(item.key, item.value, item.metadata);
            result.uploaded++;
          }

          this.config.callbacks?.onItemSynced?.(item.key, 'upload');
        } catch (error) {
          result.errors.push({
            key: item.key,
            message: String(error),
            retryable: true,
          });
        }

        completed++;
      }

      // Download remote changes
      for (const item of remoteChanges) {
        const localItem = localChanges.find((l) => l.key === item.key);

        if (!localItem) {
          try {
            this.notifyProgress(total, completed, 'downloading', item.key);

            await this.downloadItem(item.key, item.value);
            result.downloaded++;

            this.config.callbacks?.onItemSynced?.(item.key, 'download');
          } catch (error) {
            result.errors.push({
              key: item.key,
              message: String(error),
              retryable: true,
            });
          }
        }

        completed++;
      }

      // Update sync state
      this.state.lastSync = Date.now();
      this.state.pendingChanges = 0;
      await this.saveSyncState();

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        key: '',
        message: String(error),
        retryable: false,
      });
      this.config.callbacks?.onSyncError?.(error as Error);
    } finally {
      this.state.isSyncing = false;
      result.duration = Date.now() - startTime;
      this.config.callbacks?.onSyncComplete?.(result);
    }

    return result;
  }

  /**
   * Push a single item to cloud
   *
   * @param key - Key to push
   * @param value - Value to push
   */
  async push<T>(key: string, value: T): Promise<void> {
    this.ensureInitialized();

    if (!this.state.isConnected) {
      if (this.config.offlineQueue) {
        this.queueOfflineOperation('set', key, value);
        return;
      }
      throw new Error('Not connected to cloud');
    }

    await this.uploadItem(key, value);
  }

  /**
   * Pull a single item from cloud
   *
   * @param key - Key to pull
   * @returns Promise resolving to the value
   */
  async pull<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    if (!this.state.isConnected) {
      throw new Error('Not connected to cloud');
    }

    return this.fetchRemoteItem(key);
  }

  /**
   * Delete an item from cloud
   *
   * @param key - Key to delete
   */
  async deleteRemote(key: string): Promise<void> {
    this.ensureInitialized();

    if (!this.state.isConnected) {
      if (this.config.offlineQueue) {
        this.queueOfflineOperation('delete', key);
        return;
      }
      throw new Error('Not connected to cloud');
    }

    await this.deleteRemoteItem(key);
  }

  /**
   * Get sync status
   *
   * @returns Current sync state
   */
  getStatus(): SyncState {
    return { ...this.state };
  }

  /**
   * Get offline queue size
   *
   * @returns Number of items in offline queue
   */
  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  /**
   * Force process offline queue
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.state.isConnected || this.offlineQueue.length === 0) {
      return;
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        if (item.type === 'set') {
          await this.uploadItem(item.key, item.value);
        } else if (item.type === 'delete') {
          await this.deleteRemoteItem(item.key);
        }
      } catch (error) {
        if (item.retryCount < (this.config.retry?.maxAttempts || 3)) {
          this.offlineQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        }
      }
    }

    await this.saveOfflineQueue();
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (!this.state.isSyncing && this.state.isConnected) {
        try {
          await this.sync();
        } catch (error) {
          this.log(`Periodic sync failed: ${error}`);
        }
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Start realtime sync
   */
  async startRealtimeSync(): Promise<void> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE:
        await this.startFirebaseRealtime();
        break;
      case CloudProvider.SUPABASE:
        await this.startSupabaseRealtime();
        break;
      default:
        this.log('Realtime sync not supported for this provider');
    }
  }

  /**
   * Stop realtime sync
   */
  stopRealtimeSync(): void {
    if (this.realtimeSubscription) {
      if (typeof this.realtimeSubscription === 'function') {
        this.realtimeSubscription();
      } else if (this.realtimeSubscription.unsubscribe) {
        this.realtimeSubscription.unsubscribe();
      }
      this.realtimeSubscription = null;
    }
  }

  /**
   * Check cloud connection
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Simple connectivity check
      const response = await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
      });

      const wasConnected = this.state.isConnected;
      this.state.isConnected = true;

      if (!wasConnected) {
        this.config.callbacks?.onConnectionChange?.(true);
      }

      return true;
    } catch {
      const wasConnected = this.state.isConnected;
      this.state.isConnected = false;

      if (wasConnected) {
        this.config.callbacks?.onConnectionChange?.(false);
      }

      return false;
    }
  }

  /**
   * Destroy the cloud sync service
   */
  async destroy(): Promise<void> {
    this.stopPeriodicSync();
    this.stopRealtimeSync();

    await this.saveOfflineQueue();
    await this.saveSyncState();

    this.localProvider = null;
    this.cloudClient = null;
    this.isInitialized = false;
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CloudSync is not initialized');
    }
  }

  private async getLocalChanges(keys?: string[]): Promise<StorageItem<any>[]> {
    if (!this.localProvider) return [];

    const allKeys = keys || (await this.localProvider.keys());
    const changes: StorageItem<any>[] = [];

    for (const key of allKeys) {
      const value = await this.localProvider.get(key);
      const metadata = await this.localProvider.getMetadata?.(key);

      if (value !== null) {
        // Check if changed since last sync
        if (metadata?.updatedAt && metadata.updatedAt > this.state.lastSync) {
          changes.push({
            key,
            value,
            metadata: metadata || { key, size: 0, createdAt: 0, updatedAt: 0, tags: [], compressed: false, encrypted: false },
          });
        }
      }
    }

    return changes;
  }

  private async getRemoteChanges(): Promise<StorageItem<any>[]> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE:
        return this.getFirebaseChanges();
      case CloudProvider.SUPABASE:
        return this.getSupabaseChanges();
      case CloudProvider.CUSTOM_REST:
        return this.getRESTChanges();
      default:
        return [];
    }
  }

  private async getFirebaseChanges(): Promise<StorageItem<any>[]> {
    const config = this.config.providerConfig as FirebaseConfig;
    const collection = config.collection || 'storage';

    const snapshot = await this.cloudClient
      .ref(collection)
      .orderByChild('updatedAt')
      .startAt(this.state.lastSync)
      .once('value');

    const changes: StorageItem<any>[] = [];
    snapshot.forEach((child: any) => {
      const data = child.val();
      changes.push({
        key: child.key,
        value: JSON.parse(data.value),
        metadata: {
          key: child.key,
          size: data.size || 0,
          createdAt: data.createdAt || 0,
          updatedAt: data.updatedAt || 0,
          tags: data.tags || [],
          compressed: false,
          encrypted: false,
        },
      });
    });

    return changes;
  }

  private async getSupabaseChanges(): Promise<StorageItem<any>[]> {
    const config = this.config.providerConfig as SupabaseConfig;
    const table = config.table || 'storage';

    const { data, error } = await this.cloudClient
      .from(table)
      .select('*')
      .gt('updated_at', new Date(this.state.lastSync).toISOString());

    if (error) throw error;

    return (data || []).map((item: any) => ({
      key: item.key,
      value: JSON.parse(item.value),
      metadata: {
        key: item.key,
        size: item.size || 0,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        tags: item.tags || [],
        compressed: false,
        encrypted: false,
      },
    }));
  }

  private async getRESTChanges(): Promise<StorageItem<any>[]> {
    const config = this.config.providerConfig as CustomRESTConfig;

    const response = await this.fetchWithRetry(
      `${config.baseUrl}${config.endpoints.sync}?since=${this.state.lastSync}`,
      {
        method: 'GET',
        headers: this.cloudClient.headers,
      }
    );

    return response.items || [];
  }

  private async uploadItem(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE:
        await this.uploadToFirebase(key, value, metadata);
        break;
      case CloudProvider.SUPABASE:
        await this.uploadToSupabase(key, value, metadata);
        break;
      case CloudProvider.CUSTOM_REST:
        await this.uploadToREST(key, value, metadata);
        break;
    }
  }

  private async uploadToFirebase(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    const config = this.config.providerConfig as FirebaseConfig;
    const collection = config.collection || 'storage';
    const now = Date.now();

    await this.cloudClient.ref(`${collection}/${key}`).set({
      value: JSON.stringify(value),
      updatedAt: now,
      createdAt: metadata?.createdAt || now,
      size: JSON.stringify(value).length,
      tags: metadata?.tags || [],
    });
  }

  private async uploadToSupabase(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    const config = this.config.providerConfig as SupabaseConfig;
    const table = config.table || 'storage';

    const { error } = await this.cloudClient.from(table).upsert({
      key,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
      created_at: metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : new Date().toISOString(),
      size: JSON.stringify(value).length,
      tags: metadata?.tags || [],
    });

    if (error) throw error;
  }

  private async uploadToREST(key: string, value: any, metadata?: StorageMetadata): Promise<void> {
    const config = this.config.providerConfig as CustomRESTConfig;

    await this.fetchWithRetry(`${config.baseUrl}${config.endpoints.set}`, {
      method: 'POST',
      headers: this.cloudClient.headers,
      body: JSON.stringify({ key, value, metadata }),
    });
  }

  private async downloadItem(key: string, value: any): Promise<void> {
    if (!this.localProvider) return;
    await this.localProvider.set(key, value);
  }

  private async fetchRemoteItem<T>(key: string): Promise<T | null> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE: {
        const config = this.config.providerConfig as FirebaseConfig;
        const snapshot = await this.cloudClient.ref(`${config.collection || 'storage'}/${key}`).once('value');
        if (!snapshot.exists()) return null;
        return JSON.parse(snapshot.val().value);
      }
      case CloudProvider.SUPABASE: {
        const config = this.config.providerConfig as SupabaseConfig;
        const { data, error } = await this.cloudClient.from(config.table || 'storage').select('value').eq('key', key).single();
        if (error || !data) return null;
        return JSON.parse(data.value);
      }
      default:
        return null;
    }
  }

  private async deleteRemoteItem(key: string): Promise<void> {
    switch (this.config.provider) {
      case CloudProvider.FIREBASE: {
        const config = this.config.providerConfig as FirebaseConfig;
        await this.cloudClient.ref(`${config.collection || 'storage'}/${key}`).remove();
        break;
      }
      case CloudProvider.SUPABASE: {
        const config = this.config.providerConfig as SupabaseConfig;
        await this.cloudClient.from(config.table || 'storage').delete().eq('key', key);
        break;
      }
    }
  }

  private async resolveConflict(
    local: StorageItem<any>,
    remote: StorageItem<any>
  ): Promise<ConflictResolution> {
    switch (this.config.conflictResolution) {
      case ConflictResolutionStrategy.LOCAL_WINS:
        return { action: 'upload', value: local.value };

      case ConflictResolutionStrategy.REMOTE_WINS:
        return { action: 'download', value: remote.value };

      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        if (local.metadata.updatedAt >= remote.metadata.updatedAt) {
          return { action: 'upload', value: local.value };
        }
        return { action: 'download', value: remote.value };

      case ConflictResolutionStrategy.MANUAL:
        if (this.config.callbacks?.onConflict) {
          return this.config.callbacks.onConflict({
            key: local.key,
            localValue: local.value,
            remoteValue: remote.value,
            localTimestamp: local.metadata.updatedAt,
            remoteTimestamp: remote.metadata.updatedAt,
          });
        }
        return { action: 'skip' };

      case ConflictResolutionStrategy.CUSTOM:
        if (this.config.conflictResolver) {
          return this.config.conflictResolver.resolve({
            key: local.key,
            localValue: local.value,
            remoteValue: remote.value,
            localTimestamp: local.metadata.updatedAt,
            remoteTimestamp: remote.metadata.updatedAt,
          });
        }
        return { action: 'skip' };

      default:
        return { action: 'skip' };
    }
  }

  private queueOfflineOperation(type: 'set' | 'delete', key: string, value?: any): void {
    if (this.offlineQueue.length >= (this.config.maxQueueSize || 1000)) {
      this.offlineQueue.shift();
    }

    this.offlineQueue.push({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      key,
      value,
      timestamp: Date.now(),
      retryCount: 0,
    });

    this.state.pendingChanges = this.offlineQueue.length;
    this.saveOfflineQueue();
  }

  private async loadOfflineQueue(): Promise<void> {
    if (!this.localProvider) return;

    const queue = await this.localProvider.get<QueueItem[]>('__cloud_sync_queue__');
    if (queue) {
      this.offlineQueue = queue;
      this.state.pendingChanges = queue.length;
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    if (!this.localProvider) return;
    await this.localProvider.set('__cloud_sync_queue__', this.offlineQueue);
  }

  private async loadSyncState(): Promise<void> {
    if (!this.localProvider) return;

    const state = await this.localProvider.get<Partial<SyncState>>('__cloud_sync_state__');
    if (state) {
      this.state = { ...this.state, ...state };
    }
  }

  private async saveSyncState(): Promise<void> {
    if (!this.localProvider) return;

    await this.localProvider.set('__cloud_sync_state__', {
      lastSync: this.state.lastSync,
      versionVector: this.state.versionVector,
    });
  }

  private async startFirebaseRealtime(): Promise<void> {
    const config = this.config.providerConfig as FirebaseConfig;
    const collection = config.collection || 'storage';

    const ref = this.cloudClient.ref(collection);

    this.realtimeSubscription = ref.on('child_changed', async (snapshot: any) => {
      const data = snapshot.val();
      if (this.localProvider) {
        await this.localProvider.set(snapshot.key, JSON.parse(data.value));
        this.config.callbacks?.onItemSynced?.(snapshot.key, 'download');
      }
    });
  }

  private async startSupabaseRealtime(): Promise<void> {
    const config = this.config.providerConfig as SupabaseConfig;
    const table = config.table || 'storage';

    this.realtimeSubscription = this.cloudClient
      .channel('storage-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table }, async (payload: any) => {
        if (payload.new && this.localProvider) {
          await this.localProvider.set(payload.new.key, JSON.parse(payload.new.value));
          this.config.callbacks?.onItemSynced?.(payload.new.key, 'download');
        }
      })
      .subscribe();
  }

  private async fetchWithRetry(url: string, options: RequestInit): Promise<any> {
    const config = this.config.retry!;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          if (config.retryOnStatusCodes?.includes(response.status)) {
            throw new Error(`HTTP ${response.status}`);
          }
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt < config.maxAttempts - 1) {
          const delay = Math.min(
            config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelay
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private notifyProgress(total: number, completed: number, operation: SyncProgress['operation'], key?: string): void {
    this.config.callbacks?.onProgress?.({
      total,
      completed,
      operation,
      currentKey: key,
      percentage: Math.round((completed / total) * 100),
    });
  }

  private log(message: string): void {
    if (this.config.logging) {
      console.log(`[CloudSync] ${message}`);
    }
  }
}

/**
 * Create a new CloudSync instance
 *
 * @param provider - Cloud provider
 * @param providerConfig - Provider configuration
 * @param options - Additional options
 * @returns CloudSync instance
 */
export function createCloudSync(
  provider: CloudProvider,
  providerConfig: CloudProviderConfig,
  options?: Partial<CloudSyncConfig>
): CloudSync {
  return new CloudSync({
    provider,
    providerConfig,
    strategy: SyncStrategy.INCREMENTAL,
    conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS,
    ...options,
  });
}

export default CloudSync;
