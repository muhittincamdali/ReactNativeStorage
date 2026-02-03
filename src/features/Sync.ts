/**
 * Sync - Data Synchronization System for React Native Storage
 * 
 * Provides comprehensive synchronization capabilities:
 * - Offline-first architecture
 * - Conflict resolution strategies
 * - Delta sync
 * - Queue management
 * - Real-time sync
 * - Multi-device sync
 * 
 * @module Sync
 * @version 2.0.0
 */

import type { StorageAdapter } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Sync status
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  PAUSED = 'paused',
  ERROR = 'error',
  OFFLINE = 'offline',
}

/**
 * Sync direction
 */
export enum SyncDirection {
  PUSH = 'push',
  PULL = 'pull',
  BIDIRECTIONAL = 'bidirectional',
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  /** Local changes win */
  LOCAL_WINS = 'local-wins',
  /** Remote changes win */
  REMOTE_WINS = 'remote-wins',
  /** Most recent change wins */
  LATEST_WINS = 'latest-wins',
  /** Merge changes */
  MERGE = 'merge',
  /** Manual resolution required */
  MANUAL = 'manual',
  /** Custom resolver function */
  CUSTOM = 'custom',
}

/**
 * Sync operation type
 */
export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Sync entry representing a change
 */
export interface SyncEntry {
  /** Unique entry ID */
  id: string;
  /** Key of the data */
  key: string;
  /** Operation type */
  operation: SyncOperationType;
  /** Data value */
  value?: unknown;
  /** Previous value (for updates) */
  previousValue?: unknown;
  /** Timestamp of the change */
  timestamp: number;
  /** Version number */
  version: number;
  /** Device ID that made the change */
  deviceId: string;
  /** User ID (if applicable) */
  userId?: string;
  /** Checksum for integrity */
  checksum?: string;
  /** Has been synced */
  synced: boolean;
  /** Sync attempts */
  attempts: number;
  /** Last attempt timestamp */
  lastAttempt?: number;
  /** Error message if failed */
  error?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Sync conflict
 */
export interface SyncConflict {
  /** Conflict ID */
  id: string;
  /** Key with conflict */
  key: string;
  /** Local entry */
  localEntry: SyncEntry;
  /** Remote entry */
  remoteEntry: SyncEntry;
  /** Conflict detected at */
  detectedAt: number;
  /** Resolution status */
  resolved: boolean;
  /** Resolution strategy used */
  resolution?: ConflictResolutionStrategy;
  /** Resolved value */
  resolvedValue?: unknown;
  /** Resolved at timestamp */
  resolvedAt?: number;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  /** Device ID */
  deviceId: string;
  /** User ID */
  userId?: string;
  /** Sync endpoint URL */
  endpoint?: string;
  /** Sync direction */
  direction: SyncDirection;
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
  /** Custom conflict resolver */
  conflictResolver?: (conflict: SyncConflict) => Promise<unknown>;
  /** Auto sync interval in milliseconds */
  autoSyncInterval?: number;
  /** Batch size for sync operations */
  batchSize: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Exponential backoff */
  exponentialBackoff: boolean;
  /** Maximum backoff delay */
  maxBackoffDelay: number;
  /** Enable delta sync */
  deltaSync: boolean;
  /** Enable compression */
  compression: boolean;
  /** Sync timeout in milliseconds */
  timeout: number;
  /** Keys to exclude from sync */
  excludeKeys?: string[];
  /** Keys pattern to include in sync */
  includePattern?: RegExp;
  /** Enable logging */
  logging: boolean;
  /** Logger function */
  logger?: (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;
}

/**
 * Sync result
 */
export interface SyncResult {
  /** Sync was successful */
  success: boolean;
  /** Number of entries pushed */
  pushed: number;
  /** Number of entries pulled */
  pulled: number;
  /** Number of conflicts */
  conflicts: number;
  /** Number of errors */
  errors: number;
  /** Sync duration in milliseconds */
  duration: number;
  /** Entries that failed */
  failed: SyncEntry[];
  /** Conflicts that occurred */
  conflictList: SyncConflict[];
  /** Last sync timestamp */
  lastSyncAt: number;
}

/**
 * Sync state
 */
export interface SyncState {
  /** Current status */
  status: SyncStatus;
  /** Last successful sync */
  lastSyncAt?: number;
  /** Last sync result */
  lastResult?: SyncResult;
  /** Pending entries count */
  pendingCount: number;
  /** Conflict count */
  conflictCount: number;
  /** Is online */
  isOnline: boolean;
  /** Current sync progress */
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

/**
 * Remote sync provider interface
 */
export interface SyncProvider {
  /** Push entries to remote */
  push(entries: SyncEntry[]): Promise<{ success: boolean; failed: string[] }>;
  /** Pull entries from remote */
  pull(since: number, deviceId: string): Promise<SyncEntry[]>;
  /** Get remote entry by key */
  getRemote(key: string): Promise<SyncEntry | null>;
  /** Check connection */
  checkConnection(): Promise<boolean>;
  /** Subscribe to real-time updates */
  subscribe?(callback: (entry: SyncEntry) => void): () => void;
}

/**
 * Sync event types
 */
export enum SyncEventType {
  SYNC_STARTED = 'sync:started',
  SYNC_COMPLETED = 'sync:completed',
  SYNC_FAILED = 'sync:failed',
  SYNC_PROGRESS = 'sync:progress',
  CONFLICT_DETECTED = 'sync:conflict',
  CONFLICT_RESOLVED = 'sync:conflict-resolved',
  ENTRY_SYNCED = 'sync:entry-synced',
  ENTRY_FAILED = 'sync:entry-failed',
  ONLINE = 'sync:online',
  OFFLINE = 'sync:offline',
}

/**
 * Sync event
 */
export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  data?: unknown;
}

/**
 * Sync listener
 */
export type SyncListener = (event: SyncEvent) => void;

// ============================================================================
// Sync Queue
// ============================================================================

/**
 * Queue for managing pending sync operations
 */
export class SyncQueue {
  private queue: Map<string, SyncEntry> = new Map();
  private storage: StorageAdapter;
  private readonly QUEUE_KEY = '__sync_queue__';

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Initialize queue from storage
   */
  async initialize(): Promise<void> {
    const stored = await (this.storage as any).get?.(this.QUEUE_KEY);
    if (stored && Array.isArray(stored)) {
      for (const entry of stored) {
        this.queue.set(entry.id, entry);
      }
    }
  }

  /**
   * Add entry to queue
   */
  async enqueue(entry: SyncEntry): Promise<void> {
    this.queue.set(entry.id, entry);
    await this.persist();
  }

  /**
   * Remove entry from queue
   */
  async dequeue(id: string): Promise<SyncEntry | undefined> {
    const entry = this.queue.get(id);
    if (entry) {
      this.queue.delete(id);
      await this.persist();
    }
    return entry;
  }

  /**
   * Get entry by ID
   */
  get(id: string): SyncEntry | undefined {
    return this.queue.get(id);
  }

  /**
   * Get entry by key
   */
  getByKey(key: string): SyncEntry | undefined {
    for (const entry of this.queue.values()) {
      if (entry.key === key) {
        return entry;
      }
    }
    return undefined;
  }

  /**
   * Get all pending entries
   */
  getPending(): SyncEntry[] {
    return Array.from(this.queue.values()).filter((e) => !e.synced);
  }

  /**
   * Get entries ready for retry
   */
  getRetryable(maxRetries: number, retryDelay: number): SyncEntry[] {
    const now = Date.now();
    return Array.from(this.queue.values()).filter((e) => {
      if (e.synced) return false;
      if (e.attempts >= maxRetries) return false;
      if (e.lastAttempt && now - e.lastAttempt < retryDelay * Math.pow(2, e.attempts)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Update entry
   */
  async update(id: string, updates: Partial<SyncEntry>): Promise<void> {
    const entry = this.queue.get(id);
    if (entry) {
      this.queue.set(id, { ...entry, ...updates });
      await this.persist();
    }
  }

  /**
   * Mark entry as synced
   */
  async markSynced(id: string): Promise<void> {
    await this.update(id, { synced: true });
  }

  /**
   * Mark entry as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    const entry = this.queue.get(id);
    if (entry) {
      await this.update(id, {
        error,
        attempts: entry.attempts + 1,
        lastAttempt: Date.now(),
      });
    }
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Get pending count
   */
  pendingCount(): number {
    return this.getPending().length;
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    this.queue.clear();
    await this.persist();
  }

  /**
   * Clear synced entries
   */
  async clearSynced(): Promise<void> {
    for (const [id, entry] of this.queue) {
      if (entry.synced) {
        this.queue.delete(id);
      }
    }
    await this.persist();
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    const entries = Array.from(this.queue.values());
    await (this.storage as any).set?.(this.QUEUE_KEY, entries);
  }
}

// ============================================================================
// Conflict Manager
// ============================================================================

/**
 * Manages sync conflicts
 */
export class ConflictManager {
  private conflicts: Map<string, SyncConflict> = new Map();
  private storage: StorageAdapter;
  private config: SyncConfig;
  private readonly CONFLICTS_KEY = '__sync_conflicts__';

  constructor(storage: StorageAdapter, config: SyncConfig) {
    this.storage = storage;
    this.config = config;
  }

  /**
   * Initialize from storage
   */
  async initialize(): Promise<void> {
    const stored = await (this.storage as any).get?.(this.CONFLICTS_KEY);
    if (stored && Array.isArray(stored)) {
      for (const conflict of stored) {
        this.conflicts.set(conflict.id, conflict);
      }
    }
  }

  /**
   * Detect conflict between local and remote entries
   */
  detectConflict(local: SyncEntry, remote: SyncEntry): SyncConflict | null {
    // No conflict if same version
    if (local.version === remote.version) {
      return null;
    }

    // No conflict if same timestamp
    if (local.timestamp === remote.timestamp) {
      return null;
    }

    // No conflict if same device
    if (local.deviceId === remote.deviceId) {
      return null;
    }

    // Conflict detected
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: local.key,
      localEntry: local,
      remoteEntry: remote,
      detectedAt: Date.now(),
      resolved: false,
    };
  }

  /**
   * Resolve a conflict
   */
  async resolve(conflict: SyncConflict): Promise<unknown> {
    let resolvedValue: unknown;

    switch (this.config.conflictResolution) {
      case ConflictResolutionStrategy.LOCAL_WINS:
        resolvedValue = conflict.localEntry.value;
        break;

      case ConflictResolutionStrategy.REMOTE_WINS:
        resolvedValue = conflict.remoteEntry.value;
        break;

      case ConflictResolutionStrategy.LATEST_WINS:
        resolvedValue =
          conflict.localEntry.timestamp > conflict.remoteEntry.timestamp
            ? conflict.localEntry.value
            : conflict.remoteEntry.value;
        break;

      case ConflictResolutionStrategy.MERGE:
        resolvedValue = this.mergeValues(
          conflict.localEntry.value,
          conflict.remoteEntry.value
        );
        break;

      case ConflictResolutionStrategy.CUSTOM:
        if (this.config.conflictResolver) {
          resolvedValue = await this.config.conflictResolver(conflict);
        } else {
          throw new Error('Custom conflict resolver not provided');
        }
        break;

      case ConflictResolutionStrategy.MANUAL:
        // Store conflict for manual resolution
        this.conflicts.set(conflict.id, conflict);
        await this.persist();
        throw new Error('Manual conflict resolution required');

      default:
        resolvedValue = conflict.remoteEntry.value;
    }

    // Mark as resolved
    conflict.resolved = true;
    conflict.resolution = this.config.conflictResolution;
    conflict.resolvedValue = resolvedValue;
    conflict.resolvedAt = Date.now();

    this.conflicts.set(conflict.id, conflict);
    await this.persist();

    return resolvedValue;
  }

  /**
   * Merge two values
   */
  private mergeValues(local: unknown, remote: unknown): unknown {
    // Both are objects - deep merge
    if (
      local &&
      remote &&
      typeof local === 'object' &&
      typeof remote === 'object' &&
      !Array.isArray(local) &&
      !Array.isArray(remote)
    ) {
      return this.deepMerge(
        local as Record<string, unknown>,
        remote as Record<string, unknown>
      );
    }

    // Both are arrays - concatenate and deduplicate
    if (Array.isArray(local) && Array.isArray(remote)) {
      const merged = [...local, ...remote];
      return [...new Set(merged.map((v) => JSON.stringify(v)))].map((v) =>
        JSON.parse(v)
      );
    }

    // Default to remote
    return remote;
  }

  /**
   * Deep merge objects
   */
  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        key in result &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = this.deepMerge(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolved(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter((c) => !c.resolved);
  }

  /**
   * Get conflict by ID
   */
  get(id: string): SyncConflict | undefined {
    return this.conflicts.get(id);
  }

  /**
   * Get conflict by key
   */
  getByKey(key: string): SyncConflict | undefined {
    for (const conflict of this.conflicts.values()) {
      if (conflict.key === key && !conflict.resolved) {
        return conflict;
      }
    }
    return undefined;
  }

  /**
   * Manually resolve a conflict
   */
  async manualResolve(id: string, value: unknown): Promise<void> {
    const conflict = this.conflicts.get(id);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = ConflictResolutionStrategy.MANUAL;
      conflict.resolvedValue = value;
      conflict.resolvedAt = Date.now();
      await this.persist();
    }
  }

  /**
   * Get conflict count
   */
  count(): number {
    return this.conflicts.size;
  }

  /**
   * Get unresolved count
   */
  unresolvedCount(): number {
    return this.getUnresolved().length;
  }

  /**
   * Clear resolved conflicts
   */
  async clearResolved(): Promise<void> {
    for (const [id, conflict] of this.conflicts) {
      if (conflict.resolved) {
        this.conflicts.delete(id);
      }
    }
    await this.persist();
  }

  /**
   * Persist conflicts to storage
   */
  private async persist(): Promise<void> {
    const conflicts = Array.from(this.conflicts.values());
    await (this.storage as any).set?.(this.CONFLICTS_KEY, conflicts);
  }
}

// ============================================================================
// Delta Sync
// ============================================================================

/**
 * Delta sync utilities for efficient synchronization
 */
export class DeltaSync {
  /**
   * Calculate delta between two objects
   */
  static calculateDelta(
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>
  ): Record<string, unknown> {
    const delta: Record<string, unknown> = {};

    // Find added and changed fields
    for (const [key, value] of Object.entries(newValue)) {
      if (!(key in oldValue)) {
        delta[key] = { op: 'add', value };
      } else if (JSON.stringify(oldValue[key]) !== JSON.stringify(value)) {
        delta[key] = { op: 'change', oldValue: oldValue[key], newValue: value };
      }
    }

    // Find removed fields
    for (const key of Object.keys(oldValue)) {
      if (!(key in newValue)) {
        delta[key] = { op: 'remove', oldValue: oldValue[key] };
      }
    }

    return delta;
  }

  /**
   * Apply delta to an object
   */
  static applyDelta(
    base: Record<string, unknown>,
    delta: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...base };

    for (const [key, change] of Object.entries(delta)) {
      const changeObj = change as { op: string; value?: unknown; newValue?: unknown };
      
      switch (changeObj.op) {
        case 'add':
        case 'change':
          result[key] = changeObj.value ?? changeObj.newValue;
          break;
        case 'remove':
          delete result[key];
          break;
      }
    }

    return result;
  }

  /**
   * Calculate checksum for value
   */
  static calculateChecksum(value: unknown): string {
    const str = JSON.stringify(value);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }

  /**
   * Compress changes for transfer
   */
  static compressChanges(entries: SyncEntry[]): string {
    // Simple JSON compression - in production use proper compression
    return JSON.stringify(entries);
  }

  /**
   * Decompress changes
   */
  static decompressChanges(compressed: string): SyncEntry[] {
    return JSON.parse(compressed);
  }
}

// ============================================================================
// Sync Manager
// ============================================================================

/**
 * Main synchronization manager
 */
export class SyncManager {
  private storage: StorageAdapter;
  private provider: SyncProvider;
  private queue: SyncQueue;
  private conflictManager: ConflictManager;
  private config: SyncConfig;
  private state: SyncState;
  private listeners: Map<SyncEventType, Set<SyncListener>> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private realTimeUnsubscribe: (() => void) | null = null;
  private versionCounter: number = 0;
  private readonly VERSION_KEY = '__sync_version__';
  private readonly LAST_SYNC_KEY = '__sync_last__';

  constructor(
    storage: StorageAdapter,
    provider: SyncProvider,
    config: Partial<SyncConfig>
  ) {
    this.storage = storage;
    this.provider = provider;
    this.config = {
      deviceId: config.deviceId || this.generateDeviceId(),
      direction: SyncDirection.BIDIRECTIONAL,
      conflictResolution: ConflictResolutionStrategy.LATEST_WINS,
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      maxBackoffDelay: 30000,
      deltaSync: true,
      compression: false,
      timeout: 30000,
      logging: false,
      ...config,
    };

    this.queue = new SyncQueue(storage);
    this.conflictManager = new ConflictManager(storage, this.config);

    this.state = {
      status: SyncStatus.IDLE,
      pendingCount: 0,
      conflictCount: 0,
      isOnline: true,
    };
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    await this.queue.initialize();
    await this.conflictManager.initialize();

    // Load version counter
    const version = await (this.storage as any).get?.(this.VERSION_KEY);
    this.versionCounter = version || 0;

    // Load last sync timestamp
    const lastSync = await (this.storage as any).get?.(this.LAST_SYNC_KEY);
    if (lastSync) {
      this.state.lastSyncAt = lastSync;
    }

    // Update state
    this.state.pendingCount = this.queue.pendingCount();
    this.state.conflictCount = this.conflictManager.unresolvedCount();

    // Check connection
    this.state.isOnline = await this.provider.checkConnection();

    // Start auto sync if configured
    if (this.config.autoSyncInterval) {
      this.startAutoSync();
    }

    // Subscribe to real-time updates if available
    if (this.provider.subscribe) {
      this.realTimeUnsubscribe = this.provider.subscribe((entry) => {
        this.handleRemoteChange(entry);
      });
    }

    this.log('Sync manager initialized', 'info');
  }

  /**
   * Track a local change
   */
  async trackChange(
    key: string,
    value: unknown,
    operation: SyncOperationType,
    previousValue?: unknown
  ): Promise<void> {
    // Check if key should be excluded
    if (this.config.excludeKeys?.includes(key)) {
      return;
    }

    // Check if key matches include pattern
    if (this.config.includePattern && !this.config.includePattern.test(key)) {
      return;
    }

    // Increment version
    this.versionCounter++;
    await (this.storage as any).set?.(this.VERSION_KEY, this.versionCounter);

    const entry: SyncEntry = {
      id: `${this.config.deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key,
      operation,
      value,
      previousValue,
      timestamp: Date.now(),
      version: this.versionCounter,
      deviceId: this.config.deviceId,
      userId: this.config.userId,
      checksum: this.config.deltaSync ? DeltaSync.calculateChecksum(value) : undefined,
      synced: false,
      attempts: 0,
    };

    await this.queue.enqueue(entry);
    this.state.pendingCount = this.queue.pendingCount();

    this.emit(SyncEventType.SYNC_PROGRESS, { entry });

    // Trigger immediate sync if online
    if (this.state.isOnline && this.config.direction !== SyncDirection.PULL) {
      this.sync();
    }
  }

  /**
   * Perform synchronization
   */
  async sync(): Promise<SyncResult> {
    if (this.state.status === SyncStatus.SYNCING) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: 1,
        duration: 0,
        failed: [],
        conflictList: [],
        lastSyncAt: this.state.lastSyncAt || 0,
      };
    }

    const startTime = Date.now();
    this.state.status = SyncStatus.SYNCING;
    this.emit(SyncEventType.SYNC_STARTED, { timestamp: startTime });

    const result: SyncResult = {
      success: true,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: 0,
      duration: 0,
      failed: [],
      conflictList: [],
      lastSyncAt: Date.now(),
    };

    try {
      // Check connection
      const isOnline = await this.provider.checkConnection();
      if (!isOnline) {
        this.state.status = SyncStatus.OFFLINE;
        this.state.isOnline = false;
        this.emit(SyncEventType.OFFLINE, {});
        result.success = false;
        result.errors = 1;
        return result;
      }

      this.state.isOnline = true;

      // Push local changes
      if (
        this.config.direction === SyncDirection.PUSH ||
        this.config.direction === SyncDirection.BIDIRECTIONAL
      ) {
        const pushResult = await this.pushChanges();
        result.pushed = pushResult.pushed;
        result.failed.push(...pushResult.failed);
        result.errors += pushResult.failed.length;
      }

      // Pull remote changes
      if (
        this.config.direction === SyncDirection.PULL ||
        this.config.direction === SyncDirection.BIDIRECTIONAL
      ) {
        const pullResult = await this.pullChanges();
        result.pulled = pullResult.pulled;
        result.conflicts = pullResult.conflicts;
        result.conflictList.push(...pullResult.conflictList);
      }

      // Update last sync timestamp
      this.state.lastSyncAt = Date.now();
      await (this.storage as any).set?.(this.LAST_SYNC_KEY, this.state.lastSyncAt);

      // Clear synced entries from queue
      await this.queue.clearSynced();

      result.success = result.errors === 0;
      result.lastSyncAt = this.state.lastSyncAt;

      this.state.status = SyncStatus.IDLE;
      this.state.lastResult = result;
      this.state.pendingCount = this.queue.pendingCount();
      this.state.conflictCount = this.conflictManager.unresolvedCount();

      this.emit(SyncEventType.SYNC_COMPLETED, { result });
    } catch (error) {
      result.success = false;
      result.errors++;
      this.state.status = SyncStatus.ERROR;
      this.emit(SyncEventType.SYNC_FAILED, { error });
      this.log(`Sync failed: ${(error as Error).message}`, 'error');
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Push local changes to remote
   */
  private async pushChanges(): Promise<{
    pushed: number;
    failed: SyncEntry[];
  }> {
    const entries = this.queue.getRetryable(
      this.config.maxRetries,
      this.config.retryDelay
    );

    if (entries.length === 0) {
      return { pushed: 0, failed: [] };
    }

    let pushed = 0;
    const failed: SyncEntry[] = [];

    // Process in batches
    for (let i = 0; i < entries.length; i += this.config.batchSize) {
      const batch = entries.slice(i, i + this.config.batchSize);

      try {
        const result = await this.provider.push(batch);

        for (const entry of batch) {
          if (result.failed.includes(entry.id)) {
            await this.queue.markFailed(entry.id, 'Push failed');
            failed.push(entry);
            this.emit(SyncEventType.ENTRY_FAILED, { entry });
          } else {
            await this.queue.markSynced(entry.id);
            pushed++;
            this.emit(SyncEventType.ENTRY_SYNCED, { entry });
          }
        }

        // Update progress
        this.state.progress = {
          current: Math.min(i + this.config.batchSize, entries.length),
          total: entries.length,
          percentage: Math.round(
            (Math.min(i + this.config.batchSize, entries.length) / entries.length) * 100
          ),
        };
      } catch (error) {
        for (const entry of batch) {
          await this.queue.markFailed(entry.id, (error as Error).message);
          failed.push(entry);
        }
      }
    }

    return { pushed, failed };
  }

  /**
   * Pull remote changes
   */
  private async pullChanges(): Promise<{
    pulled: number;
    conflicts: number;
    conflictList: SyncConflict[];
  }> {
    const since = this.state.lastSyncAt || 0;
    const remoteEntries = await this.provider.pull(since, this.config.deviceId);

    let pulled = 0;
    const conflictList: SyncConflict[] = [];

    for (const remoteEntry of remoteEntries) {
      // Skip our own entries
      if (remoteEntry.deviceId === this.config.deviceId) {
        continue;
      }

      // Check for conflict with pending local change
      const localEntry = this.queue.getByKey(remoteEntry.key);

      if (localEntry && !localEntry.synced) {
        const conflict = this.conflictManager.detectConflict(localEntry, remoteEntry);

        if (conflict) {
          conflictList.push(conflict);
          this.emit(SyncEventType.CONFLICT_DETECTED, { conflict });

          try {
            const resolvedValue = await this.conflictManager.resolve(conflict);
            await (this.storage as any).set?.(remoteEntry.key, resolvedValue);
            this.emit(SyncEventType.CONFLICT_RESOLVED, { conflict, resolvedValue });
          } catch (error) {
            // Manual resolution required
            this.log(`Conflict requires manual resolution: ${remoteEntry.key}`, 'warn');
          }

          continue;
        }
      }

      // Apply remote change
      switch (remoteEntry.operation) {
        case SyncOperationType.CREATE:
        case SyncOperationType.UPDATE:
          await (this.storage as any).set?.(remoteEntry.key, remoteEntry.value);
          break;
        case SyncOperationType.DELETE:
          await (this.storage as any).delete?.(remoteEntry.key);
          break;
      }

      pulled++;
    }

    return { pulled, conflicts: conflictList.length, conflictList };
  }

  /**
   * Handle real-time remote change
   */
  private async handleRemoteChange(entry: SyncEntry): Promise<void> {
    // Skip our own entries
    if (entry.deviceId === this.config.deviceId) {
      return;
    }

    // Check for conflict
    const localEntry = this.queue.getByKey(entry.key);

    if (localEntry && !localEntry.synced) {
      const conflict = this.conflictManager.detectConflict(localEntry, entry);

      if (conflict) {
        this.emit(SyncEventType.CONFLICT_DETECTED, { conflict });

        try {
          const resolvedValue = await this.conflictManager.resolve(conflict);
          await (this.storage as any).set?.(entry.key, resolvedValue);
          this.emit(SyncEventType.CONFLICT_RESOLVED, { conflict, resolvedValue });
        } catch {
          return;
        }

        return;
      }
    }

    // Apply change
    switch (entry.operation) {
      case SyncOperationType.CREATE:
      case SyncOperationType.UPDATE:
        await (this.storage as any).set?.(entry.key, entry.value);
        break;
      case SyncOperationType.DELETE:
        await (this.storage as any).delete?.(entry.key);
        break;
    }

    this.emit(SyncEventType.ENTRY_SYNCED, { entry, realTime: true });
  }

  /**
   * Start auto sync
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      if (this.state.status === SyncStatus.IDLE) {
        this.sync();
      }
    }, this.config.autoSyncInterval);
  }

  /**
   * Stop auto sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Pause sync
   */
  pause(): void {
    this.state.status = SyncStatus.PAUSED;
    this.stopAutoSync();
  }

  /**
   * Resume sync
   */
  resume(): void {
    this.state.status = SyncStatus.IDLE;
    if (this.config.autoSyncInterval) {
      this.startAutoSync();
    }
  }

  /**
   * Get current state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Get pending entries
   */
  getPendingEntries(): SyncEntry[] {
    return this.queue.getPending();
  }

  /**
   * Get unresolved conflicts
   */
  getConflicts(): SyncConflict[] {
    return this.conflictManager.getUnresolved();
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflict(conflictId: string, value: unknown): Promise<void> {
    const conflict = this.conflictManager.get(conflictId);
    if (conflict) {
      await this.conflictManager.manualResolve(conflictId, value);
      await (this.storage as any).set?.(conflict.key, value);
      this.state.conflictCount = this.conflictManager.unresolvedCount();
      this.emit(SyncEventType.CONFLICT_RESOLVED, { conflict, resolvedValue: value });
    }
  }

  /**
   * Add event listener
   */
  on(event: SyncEventType, listener: SyncListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Remove event listener
   */
  off(event: SyncEventType, listener: SyncListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  /**
   * Emit event
   */
  private emit(type: SyncEventType, data?: unknown): void {
    const event: SyncEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          this.log(`Event listener error: ${(error as Error).message}`, 'error');
        }
      }
    }
  }

  /**
   * Log message
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (this.config.logging && this.config.logger) {
      this.config.logger(message, level);
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.stopAutoSync();

    if (this.realTimeUnsubscribe) {
      this.realTimeUnsubscribe();
      this.realTimeUnsubscribe = null;
    }

    this.listeners.clear();
    this.log('Sync manager destroyed', 'info');
  }
}

// ============================================================================
// HTTP Sync Provider
// ============================================================================

/**
 * HTTP-based sync provider implementation
 */
export class HttpSyncProvider implements SyncProvider {
  private endpoint: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: {
    endpoint: string;
    headers?: Record<string, string>;
    timeout?: number;
  }) {
    this.endpoint = config.endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.timeout = config.timeout || 30000;
  }

  async push(entries: SyncEntry[]): Promise<{ success: boolean; failed: string[] }> {
    try {
      const response = await fetch(`${this.endpoint}/sync/push`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error(`Push failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        failed: entries.map((e) => e.id),
      };
    }
  }

  async pull(since: number, deviceId: string): Promise<SyncEntry[]> {
    try {
      const response = await fetch(
        `${this.endpoint}/sync/pull?since=${since}&deviceId=${deviceId}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.entries || [];
    } catch (error) {
      return [];
    }
  }

  async getRemote(key: string): Promise<SyncEntry | null> {
    try {
      const response = await fetch(`${this.endpoint}/sync/entry/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/sync/health`, {
        method: 'GET',
        headers: this.headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default SyncManager;
