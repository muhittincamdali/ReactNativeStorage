/**
 * Migration - Data Migration System for React Native Storage
 * 
 * Provides comprehensive data migration capabilities:
 * - Schema versioning and upgrades
 * - Data transformation
 * - Rollback support
 * - Migration validation
 * - Progress tracking
 * - Cross-storage migration
 * 
 * @module Migration
 * @version 2.0.0
 */

import type { StorageAdapter } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Migration direction
 */
export enum MigrationDirection {
  UP = 'up',
  DOWN = 'down',
}

/**
 * Migration status
 */
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Migration definition
 */
export interface MigrationDefinition {
  /** Unique migration identifier */
  id: string;
  /** Version number */
  version: number;
  /** Migration name */
  name: string;
  /** Description of changes */
  description?: string;
  /** Timestamp when migration was created */
  timestamp: number;
  /** Dependencies on other migrations */
  dependencies?: string[];
  /** Up migration function */
  up: (context: MigrationContext) => Promise<void>;
  /** Down migration function (for rollback) */
  down?: (context: MigrationContext) => Promise<void>;
  /** Pre-migration validation */
  validate?: (context: MigrationContext) => Promise<boolean>;
  /** Post-migration verification */
  verify?: (context: MigrationContext) => Promise<boolean>;
  /** Estimated duration in milliseconds */
  estimatedDuration?: number;
  /** Is migration destructive (requires backup) */
  isDestructive?: boolean;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Migration context provided to migration functions
 */
export interface MigrationContext {
  /** Storage adapter instance */
  storage: StorageAdapter;
  /** Logger function */
  log: (message: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
  /** Report progress */
  progress: (current: number, total: number, message?: string) => void;
  /** Get value from storage */
  get: <T>(key: string) => Promise<T | null>;
  /** Set value in storage */
  set: <T>(key: string, value: T) => Promise<void>;
  /** Delete value from storage */
  delete: (key: string) => Promise<void>;
  /** Get all keys matching pattern */
  keys: (pattern?: string) => Promise<string[]>;
  /** Transform multiple values */
  transform: <T, R>(keys: string[], transformer: (value: T, key: string) => R) => Promise<void>;
  /** Batch operations */
  batch: (operations: Array<{ type: 'set' | 'delete'; key: string; value?: unknown }>) => Promise<void>;
  /** Custom context data */
  data: Record<string, unknown>;
}

/**
 * Migration record (stored in database)
 */
export interface MigrationRecord {
  id: string;
  version: number;
  name: string;
  status: MigrationStatus;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  error?: string;
  checksum?: string;
}

/**
 * Migration batch for grouped migrations
 */
export interface MigrationBatch {
  id: string;
  migrations: string[];
  status: MigrationStatus;
  startedAt: number;
  completedAt?: number;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /** Run in dry-run mode (no actual changes) */
  dryRun?: boolean;
  /** Force migration even if already applied */
  force?: boolean;
  /** Create backup before migration */
  backup?: boolean;
  /** Backup storage adapter */
  backupStorage?: StorageAdapter;
  /** Transaction mode */
  transaction?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Batch size for bulk operations */
  batchSize?: number;
  /** Progress callback */
  onProgress?: (progress: MigrationProgress) => void;
  /** Error callback */
  onError?: (error: Error, migration: MigrationDefinition) => void;
}

/**
 * Migration progress
 */
export interface MigrationProgress {
  migrationId: string;
  migrationName: string;
  current: number;
  total: number;
  percentage: number;
  message?: string;
  startedAt: number;
  estimatedCompletion?: number;
}

/**
 * Migration plan
 */
export interface MigrationPlan {
  migrations: MigrationDefinition[];
  direction: MigrationDirection;
  fromVersion: number;
  toVersion: number;
  estimatedDuration: number;
  hasDestructive: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  migrationsRun: string[];
  migrationsFailed: string[];
  migrationsSkipped: string[];
  duration: number;
  errors: Array<{ migrationId: string; error: Error }>;
  backupId?: string;
}

/**
 * Schema definition
 */
export interface SchemaDefinition {
  version: number;
  tables: TableDefinition[];
  indexes: IndexDefinition[];
  views?: ViewDefinition[];
}

/**
 * Table definition
 */
export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeyDefinition[];
  indexes?: string[];
}

/**
 * Column definition
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: unknown;
  unique?: boolean;
}

/**
 * Index definition
 */
export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
}

/**
 * View definition
 */
export interface ViewDefinition {
  name: string;
  query: string;
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDefinition {
  columns: string[];
  references: {
    table: string;
    columns: string[];
  };
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

// ============================================================================
// Migration Registry
// ============================================================================

/**
 * Registry for managing migration definitions
 */
export class MigrationRegistry {
  private migrations: Map<string, MigrationDefinition> = new Map();
  private migrationsByVersion: Map<number, MigrationDefinition> = new Map();

  /**
   * Register a migration
   */
  register(migration: MigrationDefinition): void {
    if (this.migrations.has(migration.id)) {
      throw new Error(`Migration with id '${migration.id}' already registered`);
    }

    if (this.migrationsByVersion.has(migration.version)) {
      throw new Error(`Migration with version ${migration.version} already registered`);
    }

    this.migrations.set(migration.id, migration);
    this.migrationsByVersion.set(migration.version, migration);
  }

  /**
   * Register multiple migrations
   */
  registerMany(migrations: MigrationDefinition[]): void {
    for (const migration of migrations) {
      this.register(migration);
    }
  }

  /**
   * Get migration by ID
   */
  get(id: string): MigrationDefinition | undefined {
    return this.migrations.get(id);
  }

  /**
   * Get migration by version
   */
  getByVersion(version: number): MigrationDefinition | undefined {
    return this.migrationsByVersion.get(version);
  }

  /**
   * Get all migrations sorted by version
   */
  getAll(): MigrationDefinition[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.version - b.version);
  }

  /**
   * Get migrations in range
   */
  getRange(fromVersion: number, toVersion: number): MigrationDefinition[] {
    return this.getAll().filter(
      (m) => m.version > fromVersion && m.version <= toVersion
    );
  }

  /**
   * Get pending migrations
   */
  getPending(currentVersion: number): MigrationDefinition[] {
    return this.getAll().filter((m) => m.version > currentVersion);
  }

  /**
   * Get latest version
   */
  getLatestVersion(): number {
    const versions = Array.from(this.migrationsByVersion.keys());
    return versions.length > 0 ? Math.max(...versions) : 0;
  }

  /**
   * Check if migration exists
   */
  has(id: string): boolean {
    return this.migrations.has(id);
  }

  /**
   * Remove a migration
   */
  remove(id: string): boolean {
    const migration = this.migrations.get(id);
    if (migration) {
      this.migrationsByVersion.delete(migration.version);
      return this.migrations.delete(id);
    }
    return false;
  }

  /**
   * Clear all migrations
   */
  clear(): void {
    this.migrations.clear();
    this.migrationsByVersion.clear();
  }

  /**
   * Get migration count
   */
  count(): number {
    return this.migrations.size;
  }
}

// ============================================================================
// Migration History
// ============================================================================

/**
 * Tracks migration history in storage
 */
export class MigrationHistory {
  private storage: StorageAdapter;
  private readonly HISTORY_KEY = '__migration_history__';
  private readonly VERSION_KEY = '__schema_version__';
  private readonly BATCH_KEY = '__migration_batches__';

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Get current schema version
   */
  async getCurrentVersion(): Promise<number> {
    const version = await (this.storage as any).get?.(this.VERSION_KEY);
    return version || 0;
  }

  /**
   * Set current schema version
   */
  async setCurrentVersion(version: number): Promise<void> {
    await (this.storage as any).set?.(this.VERSION_KEY, version);
  }

  /**
   * Get migration history
   */
  async getHistory(): Promise<MigrationRecord[]> {
    const history = await (this.storage as any).get?.(this.HISTORY_KEY);
    return history || [];
  }

  /**
   * Add migration record
   */
  async addRecord(record: MigrationRecord): Promise<void> {
    const history = await this.getHistory();
    history.push(record);
    await (this.storage as any).set?.(this.HISTORY_KEY, history);
  }

  /**
   * Update migration record
   */
  async updateRecord(id: string, updates: Partial<MigrationRecord>): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex((r) => r.id === id);
    
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      await (this.storage as any).set?.(this.HISTORY_KEY, history);
    }
  }

  /**
   * Get record by ID
   */
  async getRecord(id: string): Promise<MigrationRecord | undefined> {
    const history = await this.getHistory();
    return history.find((r) => r.id === id);
  }

  /**
   * Check if migration was applied
   */
  async wasApplied(id: string): Promise<boolean> {
    const record = await this.getRecord(id);
    return record?.status === MigrationStatus.COMPLETED;
  }

  /**
   * Get applied migrations
   */
  async getApplied(): Promise<MigrationRecord[]> {
    const history = await this.getHistory();
    return history.filter((r) => r.status === MigrationStatus.COMPLETED);
  }

  /**
   * Get failed migrations
   */
  async getFailed(): Promise<MigrationRecord[]> {
    const history = await this.getHistory();
    return history.filter((r) => r.status === MigrationStatus.FAILED);
  }

  /**
   * Create a batch
   */
  async createBatch(migrationIds: string[]): Promise<MigrationBatch> {
    const batches = await this.getBatches();
    const batch: MigrationBatch = {
      id: `batch_${Date.now()}`,
      migrations: migrationIds,
      status: MigrationStatus.PENDING,
      startedAt: Date.now(),
    };
    batches.push(batch);
    await (this.storage as any).set?.(this.BATCH_KEY, batches);
    return batch;
  }

  /**
   * Get all batches
   */
  async getBatches(): Promise<MigrationBatch[]> {
    const batches = await (this.storage as any).get?.(this.BATCH_KEY);
    return batches || [];
  }

  /**
   * Update batch status
   */
  async updateBatch(id: string, updates: Partial<MigrationBatch>): Promise<void> {
    const batches = await this.getBatches();
    const index = batches.findIndex((b) => b.id === id);
    
    if (index !== -1) {
      batches[index] = { ...batches[index], ...updates };
      await (this.storage as any).set?.(this.BATCH_KEY, batches);
    }
  }

  /**
   * Clear history
   */
  async clear(): Promise<void> {
    await (this.storage as any).set?.(this.HISTORY_KEY, []);
    await (this.storage as any).set?.(this.BATCH_KEY, []);
    await (this.storage as any).set?.(this.VERSION_KEY, 0);
  }
}

// ============================================================================
// Data Transformer
// ============================================================================

/**
 * Utility class for data transformations during migrations
 */
export class DataTransformer {
  /**
   * Rename a field in an object
   */
  static renameField<T extends object>(
    obj: T,
    oldName: string,
    newName: string
  ): T {
    const result = { ...obj } as Record<string, unknown>;
    if (oldName in result) {
      result[newName] = result[oldName];
      delete result[oldName];
    }
    return result as T;
  }

  /**
   * Remove fields from an object
   */
  static removeFields<T extends object>(obj: T, fields: string[]): T {
    const result = { ...obj } as Record<string, unknown>;
    for (const field of fields) {
      delete result[field];
    }
    return result as T;
  }

  /**
   * Add fields to an object with default values
   */
  static addFields<T extends object>(
    obj: T,
    fields: Record<string, unknown>
  ): T {
    return { ...obj, ...fields } as T;
  }

  /**
   * Transform field value
   */
  static transformField<T extends object, V>(
    obj: T,
    field: string,
    transformer: (value: unknown) => V
  ): T {
    const result = { ...obj } as Record<string, unknown>;
    if (field in result) {
      result[field] = transformer(result[field]);
    }
    return result as T;
  }

  /**
   * Flatten nested object
   */
  static flatten(obj: object, separator: string = '.'): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    function recurse(current: unknown, path: string): void {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        for (const [key, value] of Object.entries(current)) {
          const newPath = path ? `${path}${separator}${key}` : key;
          recurse(value, newPath);
        }
      } else {
        result[path] = current;
      }
    }

    recurse(obj, '');
    return result;
  }

  /**
   * Unflatten object
   */
  static unflatten(obj: Record<string, unknown>, separator: string = '.'): object {
    const result: Record<string, unknown> = {};

    for (const [path, value] of Object.entries(obj)) {
      const keys = path.split(separator);
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  }

  /**
   * Deep merge objects
   */
  static deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target } as Record<string, unknown>;

    for (const [key, value] of Object.entries(source)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        key in result &&
        typeof result[key] === 'object'
      ) {
        result[key] = this.deepMerge(
          result[key] as object,
          value as object
        );
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  /**
   * Convert array to map by key
   */
  static arrayToMap<T extends object>(
    arr: T[],
    keyField: keyof T
  ): Map<unknown, T> {
    return new Map(arr.map((item) => [item[keyField], item]));
  }

  /**
   * Convert map to array
   */
  static mapToArray<K, V>(map: Map<K, V>): Array<{ key: K; value: V }> {
    return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
  }

  /**
   * Type coercion with validation
   */
  static coerce(value: unknown, targetType: string): unknown {
    switch (targetType) {
      case 'string':
        return value == null ? '' : String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'object':
        return typeof value === 'object' ? value : {};
      default:
        return value;
    }
  }
}

// ============================================================================
// Backup Manager
// ============================================================================

/**
 * Manages backups for migration safety
 */
export class BackupManager {
  private storage: StorageAdapter;
  private backupStorage?: StorageAdapter;
  private readonly BACKUP_PREFIX = '__backup__';

  constructor(storage: StorageAdapter, backupStorage?: StorageAdapter) {
    this.storage = storage;
    this.backupStorage = backupStorage || storage;
  }

  /**
   * Create a full backup
   */
  async createBackup(name?: string): Promise<string> {
    const backupId = name || `backup_${Date.now()}`;
    const keys = await (this.storage as any).keys?.() || [];
    
    const backup: Record<string, unknown> = {
      id: backupId,
      timestamp: Date.now(),
      data: {},
    };

    for (const key of keys) {
      if (!key.startsWith(this.BACKUP_PREFIX)) {
        const value = await (this.storage as any).get?.(key);
        (backup.data as Record<string, unknown>)[key] = value;
      }
    }

    await (this.backupStorage as any).set?.(
      `${this.BACKUP_PREFIX}${backupId}`,
      backup
    );

    return backupId;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backup = await (this.backupStorage as any).get?.(
      `${this.BACKUP_PREFIX}${backupId}`
    ) as { data: Record<string, unknown> } | null;

    if (!backup) {
      throw new Error(`Backup '${backupId}' not found`);
    }

    // Clear current data
    const currentKeys = await (this.storage as any).keys?.() || [];
    for (const key of currentKeys) {
      if (!key.startsWith(this.BACKUP_PREFIX)) {
        await (this.storage as any).delete?.(key);
      }
    }

    // Restore backup data
    for (const [key, value] of Object.entries(backup.data)) {
      await (this.storage as any).set?.(key, value);
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ id: string; timestamp: number }>> {
    const keys = await (this.backupStorage as any).keys?.() || [];
    const backups: Array<{ id: string; timestamp: number }> = [];

    for (const key of keys) {
      if (key.startsWith(this.BACKUP_PREFIX)) {
        const backup = await (this.backupStorage as any).get?.(key) as {
          id: string;
          timestamp: number;
        } | null;
        if (backup) {
          backups.push({ id: backup.id, timestamp: backup.timestamp });
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    return (this.backupStorage as any).delete?.(
      `${this.BACKUP_PREFIX}${backupId}`
    ) || false;
  }

  /**
   * Delete old backups (keep N most recent)
   */
  async pruneBackups(keepCount: number): Promise<number> {
    const backups = await this.listBackups();
    let deleted = 0;

    if (backups.length > keepCount) {
      const toDelete = backups.slice(keepCount);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
        deleted++;
      }
    }

    return deleted;
  }
}

// ============================================================================
// Migration Runner
// ============================================================================

/**
 * Executes migrations with proper error handling and rollback
 */
export class MigrationRunner {
  private registry: MigrationRegistry;
  private history: MigrationHistory;
  private backupManager: BackupManager;
  private storage: StorageAdapter;
  private options: MigrationOptions;
  private logs: string[] = [];

  constructor(
    storage: StorageAdapter,
    registry: MigrationRegistry,
    options: MigrationOptions = {}
  ) {
    this.storage = storage;
    this.registry = registry;
    this.history = new MigrationHistory(storage);
    this.backupManager = new BackupManager(storage, options.backupStorage);
    this.options = {
      dryRun: false,
      force: false,
      backup: true,
      transaction: true,
      timeout: 60000,
      batchSize: 100,
      ...options,
    };
  }

  /**
   * Create migration context
   */
  private createContext(migrationId: string): MigrationContext {
    let currentProgress = 0;
    let totalProgress = 100;

    return {
      storage: this.storage,
      log: (message: string, level = 'info') => {
        const logMessage = `[${level.toUpperCase()}] [${migrationId}] ${message}`;
        this.logs.push(logMessage);
        console.log(logMessage);
      },
      progress: (current: number, total: number, message?: string) => {
        currentProgress = current;
        totalProgress = total;
        
        if (this.options.onProgress) {
          this.options.onProgress({
            migrationId,
            migrationName: this.registry.get(migrationId)?.name || migrationId,
            current,
            total,
            percentage: Math.round((current / total) * 100),
            message,
            startedAt: Date.now(),
          });
        }
      },
      get: async <T>(key: string) => {
        return (this.storage as any).get?.(key) as T | null;
      },
      set: async <T>(key: string, value: T) => {
        if (!this.options.dryRun) {
          await (this.storage as any).set?.(key, value);
        }
      },
      delete: async (key: string) => {
        if (!this.options.dryRun) {
          await (this.storage as any).delete?.(key);
        }
      },
      keys: async (pattern?: string) => {
        const allKeys = await (this.storage as any).keys?.() || [];
        if (pattern) {
          const regex = new RegExp(pattern);
          return allKeys.filter((k: string) => regex.test(k));
        }
        return allKeys;
      },
      transform: async <T, R>(keys: string[], transformer: (value: T, key: string) => R) => {
        const batchSize = this.options.batchSize || 100;
        
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          
          for (const key of batch) {
            const value = await (this.storage as any).get?.(key) as T;
            if (value !== null) {
              const transformed = transformer(value, key);
              if (!this.options.dryRun) {
                await (this.storage as any).set?.(key, transformed);
              }
            }
          }
        }
      },
      batch: async (operations) => {
        if (!this.options.dryRun) {
          for (const op of operations) {
            if (op.type === 'set') {
              await (this.storage as any).set?.(op.key, op.value);
            } else {
              await (this.storage as any).delete?.(op.key);
            }
          }
        }
      },
      data: {},
    };
  }

  /**
   * Create migration plan
   */
  async plan(targetVersion?: number): Promise<MigrationPlan> {
    const currentVersion = await this.history.getCurrentVersion();
    const latestVersion = targetVersion || this.registry.getLatestVersion();
    
    const direction =
      latestVersion >= currentVersion
        ? MigrationDirection.UP
        : MigrationDirection.DOWN;

    let migrations: MigrationDefinition[];

    if (direction === MigrationDirection.UP) {
      migrations = this.registry.getRange(currentVersion, latestVersion);
    } else {
      migrations = this.registry
        .getRange(latestVersion, currentVersion)
        .reverse();
    }

    const estimatedDuration = migrations.reduce(
      (sum, m) => sum + (m.estimatedDuration || 1000),
      0
    );

    const hasDestructive = migrations.some((m) => m.isDestructive);

    return {
      migrations,
      direction,
      fromVersion: currentVersion,
      toVersion: latestVersion,
      estimatedDuration,
      hasDestructive,
    };
  }

  /**
   * Run migrations up to target version
   */
  async migrate(targetVersion?: number): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      migrationsFailed: [],
      migrationsSkipped: [],
      duration: 0,
      errors: [],
    };

    try {
      const plan = await this.plan(targetVersion);

      if (plan.migrations.length === 0) {
        return result;
      }

      // Create backup if enabled and there are destructive migrations
      if (this.options.backup && plan.hasDestructive) {
        result.backupId = await this.backupManager.createBackup();
      }

      // Create batch
      const batch = await this.history.createBatch(
        plan.migrations.map((m) => m.id)
      );
      await this.history.updateBatch(batch.id, { status: MigrationStatus.RUNNING });

      for (const migration of plan.migrations) {
        // Check if already applied
        if (!this.options.force && (await this.history.wasApplied(migration.id))) {
          result.migrationsSkipped.push(migration.id);
          continue;
        }

        // Check dependencies
        if (migration.dependencies) {
          const unmetDeps = [];
          for (const dep of migration.dependencies) {
            if (!(await this.history.wasApplied(dep))) {
              unmetDeps.push(dep);
            }
          }
          if (unmetDeps.length > 0) {
            throw new Error(
              `Migration '${migration.id}' has unmet dependencies: ${unmetDeps.join(', ')}`
            );
          }
        }

        // Run migration
        const migrationResult = await this.runSingleMigration(
          migration,
          plan.direction
        );

        if (migrationResult.success) {
          result.migrationsRun.push(migration.id);
        } else {
          result.migrationsFailed.push(migration.id);
          result.errors.push({
            migrationId: migration.id,
            error: migrationResult.error!,
          });
          result.success = false;

          // Stop on first failure
          break;
        }
      }

      // Update batch status
      await this.history.updateBatch(batch.id, {
        status: result.success ? MigrationStatus.COMPLETED : MigrationStatus.FAILED,
        completedAt: Date.now(),
      });

      // Update schema version
      if (result.success && plan.migrations.length > 0) {
        const lastMigration = plan.migrations[plan.migrations.length - 1];
        await this.history.setCurrentVersion(lastMigration.version);
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        migrationId: 'general',
        error: error as Error,
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Run a single migration
   */
  private async runSingleMigration(
    migration: MigrationDefinition,
    direction: MigrationDirection
  ): Promise<{ success: boolean; error?: Error }> {
    const context = this.createContext(migration.id);
    const startTime = Date.now();

    // Create record
    await this.history.addRecord({
      id: migration.id,
      version: migration.version,
      name: migration.name,
      status: MigrationStatus.RUNNING,
      startedAt: startTime,
    });

    try {
      // Run validation if provided
      if (migration.validate) {
        const isValid = await migration.validate(context);
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      // Run migration
      const migrationFn = direction === MigrationDirection.UP 
        ? migration.up 
        : migration.down;

      if (!migrationFn) {
        throw new Error(`Migration '${migration.id}' does not support ${direction} direction`);
      }

      // Apply timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Migration timed out')),
          this.options.timeout
        );
      });

      await Promise.race([migrationFn(context), timeoutPromise]);

      // Run verification if provided
      if (migration.verify && !this.options.dryRun) {
        const isVerified = await migration.verify(context);
        if (!isVerified) {
          throw new Error('Migration verification failed');
        }
      }

      // Update record
      const duration = Date.now() - startTime;
      await this.history.updateRecord(migration.id, {
        status: MigrationStatus.COMPLETED,
        completedAt: Date.now(),
        duration,
      });

      return { success: true };
    } catch (error) {
      await this.history.updateRecord(migration.id, {
        status: MigrationStatus.FAILED,
        completedAt: Date.now(),
        error: (error as Error).message,
      });

      if (this.options.onError) {
        this.options.onError(error as Error, migration);
      }

      return { success: false, error: error as Error };
    }
  }

  /**
   * Rollback last batch
   */
  async rollback(): Promise<MigrationResult> {
    const batches = await this.history.getBatches();
    const lastCompletedBatch = batches
      .filter((b) => b.status === MigrationStatus.COMPLETED)
      .sort((a, b) => b.startedAt - a.startedAt)[0];

    if (!lastCompletedBatch) {
      return {
        success: true,
        migrationsRun: [],
        migrationsFailed: [],
        migrationsSkipped: [],
        duration: 0,
        errors: [],
      };
    }

    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migrationsRun: [],
      migrationsFailed: [],
      migrationsSkipped: [],
      duration: 0,
      errors: [],
    };

    // Rollback in reverse order
    const migrationsToRollback = [...lastCompletedBatch.migrations].reverse();

    for (const migrationId of migrationsToRollback) {
      const migration = this.registry.get(migrationId);
      if (!migration) {
        result.migrationsSkipped.push(migrationId);
        continue;
      }

      if (!migration.down) {
        result.migrationsFailed.push(migrationId);
        result.errors.push({
          migrationId,
          error: new Error('Migration does not support rollback'),
        });
        continue;
      }

      const rollbackResult = await this.runSingleMigration(
        migration,
        MigrationDirection.DOWN
      );

      if (rollbackResult.success) {
        result.migrationsRun.push(migrationId);
        await this.history.updateRecord(migrationId, {
          status: MigrationStatus.ROLLED_BACK,
        });
      } else {
        result.migrationsFailed.push(migrationId);
        result.errors.push({
          migrationId,
          error: rollbackResult.error!,
        });
        result.success = false;
        break;
      }
    }

    // Update schema version
    if (result.success && migrationsToRollback.length > 0) {
      const firstMigration = this.registry.get(migrationsToRollback[migrationsToRollback.length - 1]);
      if (firstMigration) {
        await this.history.setCurrentVersion(firstMigration.version - 1);
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Get migration status
   */
  async status(): Promise<{
    currentVersion: number;
    latestVersion: number;
    pendingCount: number;
    appliedCount: number;
    pending: MigrationDefinition[];
    applied: MigrationRecord[];
  }> {
    const currentVersion = await this.history.getCurrentVersion();
    const latestVersion = this.registry.getLatestVersion();
    const pending = this.registry.getPending(currentVersion);
    const applied = await this.history.getApplied();

    return {
      currentVersion,
      latestVersion,
      pendingCount: pending.length,
      appliedCount: applied.length,
      pending,
      applied,
    };
  }

  /**
   * Reset migrations (dangerous!)
   */
  async reset(): Promise<void> {
    await this.history.clear();
  }

  /**
   * Get logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// ============================================================================
// Migration Builder
// ============================================================================

/**
 * Fluent builder for creating migrations
 */
export class MigrationBuilder {
  private migration: Partial<MigrationDefinition> = {};

  /**
   * Set migration ID
   */
  id(id: string): this {
    this.migration.id = id;
    return this;
  }

  /**
   * Set version
   */
  version(version: number): this {
    this.migration.version = version;
    return this;
  }

  /**
   * Set name
   */
  name(name: string): this {
    this.migration.name = name;
    return this;
  }

  /**
   * Set description
   */
  description(description: string): this {
    this.migration.description = description;
    return this;
  }

  /**
   * Set dependencies
   */
  dependsOn(...deps: string[]): this {
    this.migration.dependencies = deps;
    return this;
  }

  /**
   * Set up migration function
   */
  up(fn: MigrationDefinition['up']): this {
    this.migration.up = fn;
    return this;
  }

  /**
   * Set down migration function
   */
  down(fn: MigrationDefinition['down']): this {
    this.migration.down = fn;
    return this;
  }

  /**
   * Set validation function
   */
  validate(fn: MigrationDefinition['validate']): this {
    this.migration.validate = fn;
    return this;
  }

  /**
   * Set verification function
   */
  verify(fn: MigrationDefinition['verify']): this {
    this.migration.verify = fn;
    return this;
  }

  /**
   * Set estimated duration
   */
  estimatedDuration(ms: number): this {
    this.migration.estimatedDuration = ms;
    return this;
  }

  /**
   * Mark as destructive
   */
  destructive(isDestructive: boolean = true): this {
    this.migration.isDestructive = isDestructive;
    return this;
  }

  /**
   * Add tags
   */
  tags(...tags: string[]): this {
    this.migration.tags = tags;
    return this;
  }

  /**
   * Build the migration definition
   */
  build(): MigrationDefinition {
    if (!this.migration.id) {
      throw new Error('Migration ID is required');
    }
    if (this.migration.version === undefined) {
      throw new Error('Migration version is required');
    }
    if (!this.migration.name) {
      throw new Error('Migration name is required');
    }
    if (!this.migration.up) {
      throw new Error('Migration up function is required');
    }

    return {
      ...this.migration,
      timestamp: Date.now(),
    } as MigrationDefinition;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new migration builder
 */
export function createMigration(): MigrationBuilder {
  return new MigrationBuilder();
}

/**
 * Create a migration runner
 */
export function createMigrationRunner(
  storage: StorageAdapter,
  options?: MigrationOptions
): { runner: MigrationRunner; registry: MigrationRegistry } {
  const registry = new MigrationRegistry();
  const runner = new MigrationRunner(storage, registry, options);
  return { runner, registry };
}

// ============================================================================
// Export
// ============================================================================

export default MigrationRunner;
