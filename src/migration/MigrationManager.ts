/**
 * MigrationManager - Schema and data migration system for React Native storage
 *
 * This module provides a comprehensive migration system with support for
 * versioned migrations, rollbacks, data transformations, and safe
 * upgrade paths between storage schema versions.
 *
 * @module MigrationManager
 * @version 2.0.0
 */

import type { StorageProvider } from '../types';

/**
 * Migration configuration
 */
export interface MigrationConfig {
  /** Current schema version */
  currentVersion: number;
  /** Storage provider to migrate */
  provider: StorageProvider;
  /** Migration definitions */
  migrations: Migration[];
  /** Enable dry run mode */
  dryRun?: boolean;
  /** Enable backup before migration */
  backup?: boolean;
  /** Backup provider for storing backups */
  backupProvider?: StorageProvider;
  /** Enable migration logging */
  logging?: boolean;
  /** Callbacks for migration events */
  callbacks?: MigrationCallbacks;
  /** Maximum retry attempts for failed migrations */
  maxRetries?: number;
  /** Timeout for individual migration steps (ms) */
  stepTimeout?: number;
  /** Enable automatic rollback on failure */
  autoRollback?: boolean;
}

/**
 * Migration definition
 */
export interface Migration {
  /** Target version */
  version: number;
  /** Migration name/description */
  name: string;
  /** Migration description */
  description?: string;
  /** Upgrade function */
  up: MigrationFunction;
  /** Downgrade function (for rollback) */
  down?: MigrationFunction;
  /** Pre-migration validation */
  validate?: () => Promise<boolean>;
  /** Dependencies (other migration versions that must run first) */
  dependencies?: number[];
  /** Whether this migration is reversible */
  reversible?: boolean;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Migration function signature
 */
export type MigrationFunction = (context: MigrationContext) => Promise<void>;

/**
 * Migration context provided to migration functions
 */
export interface MigrationContext {
  /** Storage provider */
  provider: StorageProvider;
  /** Migration helpers */
  helpers: MigrationHelpers;
  /** Previous schema version */
  fromVersion: number;
  /** Target schema version */
  toVersion: number;
  /** Whether this is a dry run */
  dryRun: boolean;
  /** Progress reporter */
  progress: (message: string, percentage?: number) => void;
  /** Logger */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

/**
 * Migration helper functions
 */
export interface MigrationHelpers {
  /** Rename a key */
  renameKey(oldKey: string, newKey: string): Promise<void>;
  /** Transform a value */
  transformValue<T, U>(key: string, transform: (value: T) => U): Promise<void>;
  /** Transform all values matching a pattern */
  transformAll<T, U>(pattern: RegExp, transform: (key: string, value: T) => U): Promise<void>;
  /** Delete keys matching a pattern */
  deletePattern(pattern: RegExp): Promise<number>;
  /** Copy value to new key */
  copyKey(sourceKey: string, targetKey: string): Promise<void>;
  /** Merge multiple keys into one */
  mergeKeys<T>(sourceKeys: string[], targetKey: string, merger: (values: T[]) => T): Promise<void>;
  /** Split a key into multiple */
  splitKey<T>(sourceKey: string, splitter: (value: T) => Record<string, any>): Promise<void>;
  /** Add a field to all objects matching pattern */
  addField(pattern: RegExp, field: string, value: any): Promise<number>;
  /** Remove a field from all objects matching pattern */
  removeField(pattern: RegExp, field: string): Promise<number>;
  /** Rename a field in all objects matching pattern */
  renameField(pattern: RegExp, oldField: string, newField: string): Promise<number>;
  /** Batch execute operations */
  batch(operations: Array<() => Promise<void>>): Promise<void>;
  /** Get all keys matching pattern */
  getKeysByPattern(pattern: RegExp): Promise<string[]>;
}

/**
 * Migration callbacks
 */
export interface MigrationCallbacks {
  /** Called before migration starts */
  onStart?: (migration: Migration) => void;
  /** Called after migration completes */
  onComplete?: (migration: Migration, duration: number) => void;
  /** Called on migration error */
  onError?: (migration: Migration, error: Error) => void;
  /** Called on progress update */
  onProgress?: (migration: Migration, message: string, percentage?: number) => void;
  /** Called before rollback */
  onRollbackStart?: (migration: Migration) => void;
  /** Called after rollback */
  onRollbackComplete?: (migration: Migration) => void;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration was successful */
  success: boolean;
  /** Starting version */
  fromVersion: number;
  /** Ending version */
  toVersion: number;
  /** Migrations that were executed */
  executed: ExecutedMigration[];
  /** Total duration in milliseconds */
  duration: number;
  /** Errors encountered */
  errors: MigrationError[];
  /** Whether backup was created */
  backupCreated: boolean;
  /** Backup identifier */
  backupId?: string;
}

/**
 * Executed migration record
 */
export interface ExecutedMigration {
  /** Migration version */
  version: number;
  /** Migration name */
  name: string;
  /** Execution timestamp */
  executedAt: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether it was successful */
  success: boolean;
  /** Error if failed */
  error?: string;
}

/**
 * Migration error
 */
export interface MigrationError {
  /** Migration version that failed */
  version: number;
  /** Error message */
  message: string;
  /** Error stack */
  stack?: string;
  /** Whether error is recoverable */
  recoverable: boolean;
}

/**
 * Migration state stored in provider
 */
interface MigrationState {
  /** Current version */
  currentVersion: number;
  /** Migration history */
  history: ExecutedMigration[];
  /** Last migration timestamp */
  lastMigration: number;
  /** Pending migrations */
  pending: number[];
}

/**
 * Backup metadata
 */
interface BackupMetadata {
  /** Backup ID */
  id: string;
  /** Creation timestamp */
  createdAt: number;
  /** Version before backup */
  version: number;
  /** Number of keys backed up */
  keyCount: number;
  /** Total size in bytes */
  size: number;
}

/**
 * MigrationManager class for handling storage migrations
 *
 * @example
 * ```typescript
 * const migrationManager = new MigrationManager({
 *   currentVersion: 1,
 *   provider: storageProvider,
 *   migrations: [
 *     {
 *       version: 2,
 *       name: 'Add user email field',
 *       up: async (ctx) => {
 *         await ctx.helpers.addField(/^user:/, 'email', '');
 *       },
 *       down: async (ctx) => {
 *         await ctx.helpers.removeField(/^user:/, 'email');
 *       },
 *     },
 *     {
 *       version: 3,
 *       name: 'Rename settings key',
 *       up: async (ctx) => {
 *         await ctx.helpers.renameKey('settings', 'app_settings');
 *       },
 *       down: async (ctx) => {
 *         await ctx.helpers.renameKey('app_settings', 'settings');
 *       },
 *     },
 *   ],
 * });
 *
 * await migrationManager.migrate(3);
 * ```
 */
export class MigrationManager {
  /** Manager name */
  public readonly name = 'migration-manager';

  /** Manager version */
  public readonly version = '2.0.0';

  private config: MigrationConfig;
  private state: MigrationState;
  private isRunning = false;
  private logs: Array<{ timestamp: number; level: string; message: string }> = [];

  /**
   * Creates a new MigrationManager instance
   *
   * @param config - Configuration options
   */
  constructor(config: MigrationConfig) {
    this.config = {
      dryRun: false,
      backup: true,
      logging: true,
      maxRetries: 3,
      stepTimeout: 30000,
      autoRollback: true,
      ...config,
    };

    this.state = {
      currentVersion: config.currentVersion,
      history: [],
      lastMigration: 0,
      pending: [],
    };
  }

  /**
   * Initialize the migration manager
   */
  async initialize(): Promise<void> {
    await this.loadState();
  }

  /**
   * Migrate to a specific version
   *
   * @param targetVersion - Version to migrate to
   * @returns Promise resolving to migration result
   */
  async migrate(targetVersion: number): Promise<MigrationResult> {
    if (this.isRunning) {
      throw new Error('Migration already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();

    const result: MigrationResult = {
      success: false,
      fromVersion: this.state.currentVersion,
      toVersion: targetVersion,
      executed: [],
      duration: 0,
      errors: [],
      backupCreated: false,
    };

    try {
      // Determine migration path
      const migrations = this.getMigrationPath(this.state.currentVersion, targetVersion);

      if (migrations.length === 0) {
        result.success = true;
        this.log(`Already at version ${targetVersion}`, 'info');
        return result;
      }

      // Create backup if enabled
      if (this.config.backup && !this.config.dryRun) {
        const backupId = await this.createBackup();
        result.backupCreated = true;
        result.backupId = backupId;
      }

      // Execute migrations
      const isUpgrade = targetVersion > this.state.currentVersion;

      for (const migration of migrations) {
        const migrationResult = await this.executeMigration(migration, isUpgrade);
        result.executed.push(migrationResult);

        if (!migrationResult.success) {
          result.errors.push({
            version: migration.version,
            message: migrationResult.error || 'Unknown error',
            recoverable: !!migration.down,
          });

          // Rollback if enabled
          if (this.config.autoRollback && !this.config.dryRun) {
            await this.rollback(result.executed.filter((e) => e.success));
          }

          break;
        }

        // Update current version
        if (!this.config.dryRun) {
          this.state.currentVersion = isUpgrade ? migration.version : migration.version - 1;
          await this.saveState();
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push({
        version: targetVersion,
        message: String(error),
        stack: (error as Error).stack,
        recoverable: false,
      });
    } finally {
      this.isRunning = false;
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Migrate to the latest version
   *
   * @returns Promise resolving to migration result
   */
  async migrateToLatest(): Promise<MigrationResult> {
    const latestVersion = Math.max(...this.config.migrations.map((m) => m.version), 0);
    return this.migrate(latestVersion);
  }

  /**
   * Rollback migrations
   *
   * @param executed - Executed migrations to rollback
   */
  async rollback(executed: ExecutedMigration[]): Promise<void> {
    const toRollback = [...executed].reverse();

    for (const record of toRollback) {
      const migration = this.config.migrations.find((m) => m.version === record.version);

      if (migration?.down) {
        this.config.callbacks?.onRollbackStart?.(migration);

        try {
          const context = this.createContext(migration.version, migration.version - 1);
          await migration.down(context);

          this.config.callbacks?.onRollbackComplete?.(migration);
          this.log(`Rolled back migration ${migration.version}: ${migration.name}`, 'info');
        } catch (error) {
          this.log(`Failed to rollback migration ${migration.version}: ${error}`, 'error');
        }
      }
    }
  }

  /**
   * Rollback to a specific version
   *
   * @param targetVersion - Version to rollback to
   * @returns Promise resolving to migration result
   */
  async rollbackTo(targetVersion: number): Promise<MigrationResult> {
    if (targetVersion >= this.state.currentVersion) {
      throw new Error('Target version must be less than current version for rollback');
    }

    return this.migrate(targetVersion);
  }

  /**
   * Get pending migrations
   *
   * @param targetVersion - Optional target version
   * @returns Array of pending migrations
   */
  getPendingMigrations(targetVersion?: number): Migration[] {
    const target = targetVersion ?? Math.max(...this.config.migrations.map((m) => m.version), 0);
    return this.getMigrationPath(this.state.currentVersion, target).map((v) =>
      this.config.migrations.find((m) => m.version === v)!
    );
  }

  /**
   * Get current schema version
   *
   * @returns Current version
   */
  getCurrentVersion(): number {
    return this.state.currentVersion;
  }

  /**
   * Get migration history
   *
   * @returns Array of executed migrations
   */
  getHistory(): ExecutedMigration[] {
    return [...this.state.history];
  }

  /**
   * Validate migrations
   *
   * @returns Validation result
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for duplicate versions
    const versions = this.config.migrations.map((m) => m.version);
    const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
    if (duplicates.length > 0) {
      errors.push(`Duplicate migration versions: ${duplicates.join(', ')}`);
    }

    // Check for missing dependencies
    for (const migration of this.config.migrations) {
      if (migration.dependencies) {
        for (const dep of migration.dependencies) {
          if (!this.config.migrations.some((m) => m.version === dep)) {
            errors.push(`Migration ${migration.version} depends on missing migration ${dep}`);
          }
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(' -> ')}`);
    }

    // Run individual migration validators
    for (const migration of this.config.migrations) {
      if (migration.validate) {
        try {
          const isValid = await migration.validate();
          if (!isValid) {
            errors.push(`Migration ${migration.version} failed validation`);
          }
        } catch (error) {
          errors.push(`Migration ${migration.version} validation error: ${error}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a backup of current data
   *
   * @returns Backup ID
   */
  async createBackup(): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const keys = await this.config.provider.keys();
    const data: Record<string, any> = {};
    let totalSize = 0;

    for (const key of keys) {
      const value = await this.config.provider.get(key);
      if (value !== null) {
        data[key] = value;
        totalSize += JSON.stringify(value).length;
      }
    }

    const backup = {
      data,
      metadata: {
        id: backupId,
        createdAt: Date.now(),
        version: this.state.currentVersion,
        keyCount: keys.length,
        size: totalSize,
      } as BackupMetadata,
    };

    if (this.config.backupProvider) {
      await this.config.backupProvider.set(`__backup_${backupId}__`, backup);
    } else {
      await this.config.provider.set(`__backup_${backupId}__`, backup);
    }

    this.log(`Created backup: ${backupId}`, 'info');

    return backupId;
  }

  /**
   * Restore from a backup
   *
   * @param backupId - Backup ID to restore
   */
  async restoreBackup(backupId: string): Promise<void> {
    const provider = this.config.backupProvider || this.config.provider;
    const backup = await provider.get<{ data: Record<string, any>; metadata: BackupMetadata }>(
      `__backup_${backupId}__`
    );

    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    // Clear current data
    await this.config.provider.clear();

    // Restore data
    for (const [key, value] of Object.entries(backup.data)) {
      await this.config.provider.set(key, value);
    }

    // Update version
    this.state.currentVersion = backup.metadata.version;
    await this.saveState();

    this.log(`Restored backup: ${backupId}`, 'info');
  }

  /**
   * List available backups
   *
   * @returns Array of backup metadata
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const provider = this.config.backupProvider || this.config.provider;
    const keys = await provider.keys('__backup_');

    const backups: BackupMetadata[] = [];

    for (const key of keys) {
      const backup = await provider.get<{ metadata: BackupMetadata }>(key);
      if (backup?.metadata) {
        backups.push(backup.metadata);
      }
    }

    return backups.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Delete a backup
   *
   * @param backupId - Backup ID to delete
   */
  async deleteBackup(backupId: string): Promise<void> {
    const provider = this.config.backupProvider || this.config.provider;
    await provider.remove(`__backup_${backupId}__`);
    this.log(`Deleted backup: ${backupId}`, 'info');
  }

  /**
   * Get migration logs
   *
   * @param limit - Maximum entries
   * @returns Array of log entries
   */
  getLogs(limit?: number): Array<{ timestamp: number; level: string; message: string }> {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  // Private helper methods

  private async executeMigration(migration: Migration, isUpgrade: boolean): Promise<ExecutedMigration> {
    const startTime = Date.now();

    const record: ExecutedMigration = {
      version: migration.version,
      name: migration.name,
      executedAt: startTime,
      duration: 0,
      success: false,
    };

    try {
      this.config.callbacks?.onStart?.(migration);
      this.log(`Starting migration ${migration.version}: ${migration.name}`, 'info');

      // Validate if validator exists
      if (migration.validate) {
        const isValid = await migration.validate();
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      // Create context
      const context = this.createContext(
        isUpgrade ? migration.version - 1 : migration.version,
        isUpgrade ? migration.version : migration.version - 1
      );

      // Execute migration
      const migrationFn = isUpgrade ? migration.up : migration.down;

      if (!migrationFn) {
        throw new Error(`No ${isUpgrade ? 'up' : 'down'} migration function defined`);
      }

      await Promise.race([
        migrationFn(context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Migration timeout')), this.config.stepTimeout)
        ),
      ]);

      record.success = true;
      this.config.callbacks?.onComplete?.(migration, Date.now() - startTime);
      this.log(`Completed migration ${migration.version}: ${migration.name}`, 'info');
    } catch (error) {
      record.error = String(error);
      this.config.callbacks?.onError?.(migration, error as Error);
      this.log(`Failed migration ${migration.version}: ${error}`, 'error');
    }

    record.duration = Date.now() - startTime;

    // Add to history
    if (!this.config.dryRun) {
      this.state.history.push(record);
      this.state.lastMigration = Date.now();
    }

    return record;
  }

  private createContext(fromVersion: number, toVersion: number): MigrationContext {
    const helpers = this.createHelpers();

    return {
      provider: this.config.provider,
      helpers,
      fromVersion,
      toVersion,
      dryRun: this.config.dryRun || false,
      progress: (message: string, percentage?: number) => {
        const migration = this.config.migrations.find((m) => m.version === toVersion);
        if (migration) {
          this.config.callbacks?.onProgress?.(migration, message, percentage);
        }
      },
      log: (message: string, level?: 'info' | 'warn' | 'error') => {
        this.log(message, level || 'info');
      },
    };
  }

  private createHelpers(): MigrationHelpers {
    const provider = this.config.provider;
    const dryRun = this.config.dryRun;

    return {
      renameKey: async (oldKey: string, newKey: string) => {
        const value = await provider.get(oldKey);
        if (value !== null && !dryRun) {
          await provider.set(newKey, value);
          await provider.remove(oldKey);
        }
      },

      transformValue: async <T, U>(key: string, transform: (value: T) => U) => {
        const value = await provider.get<T>(key);
        if (value !== null && !dryRun) {
          await provider.set(key, transform(value));
        }
      },

      transformAll: async <T, U>(pattern: RegExp, transform: (key: string, value: T) => U) => {
        const keys = await provider.keys();
        for (const key of keys) {
          if (pattern.test(key)) {
            const value = await provider.get<T>(key);
            if (value !== null && !dryRun) {
              await provider.set(key, transform(key, value));
            }
          }
        }
      },

      deletePattern: async (pattern: RegExp) => {
        const keys = await provider.keys();
        let count = 0;
        for (const key of keys) {
          if (pattern.test(key)) {
            if (!dryRun) {
              await provider.remove(key);
            }
            count++;
          }
        }
        return count;
      },

      copyKey: async (sourceKey: string, targetKey: string) => {
        const value = await provider.get(sourceKey);
        if (value !== null && !dryRun) {
          await provider.set(targetKey, value);
        }
      },

      mergeKeys: async <T>(sourceKeys: string[], targetKey: string, merger: (values: T[]) => T) => {
        const values: T[] = [];
        for (const key of sourceKeys) {
          const value = await provider.get<T>(key);
          if (value !== null) {
            values.push(value);
          }
        }
        if (values.length > 0 && !dryRun) {
          await provider.set(targetKey, merger(values));
          for (const key of sourceKeys) {
            await provider.remove(key);
          }
        }
      },

      splitKey: async <T>(sourceKey: string, splitter: (value: T) => Record<string, any>) => {
        const value = await provider.get<T>(sourceKey);
        if (value !== null && !dryRun) {
          const parts = splitter(value);
          for (const [key, partValue] of Object.entries(parts)) {
            await provider.set(key, partValue);
          }
          await provider.remove(sourceKey);
        }
      },

      addField: async (pattern: RegExp, field: string, value: any) => {
        const keys = await provider.keys();
        let count = 0;
        for (const key of keys) {
          if (pattern.test(key)) {
            const obj = await provider.get<Record<string, any>>(key);
            if (obj !== null && typeof obj === 'object' && !dryRun) {
              obj[field] = value;
              await provider.set(key, obj);
              count++;
            }
          }
        }
        return count;
      },

      removeField: async (pattern: RegExp, field: string) => {
        const keys = await provider.keys();
        let count = 0;
        for (const key of keys) {
          if (pattern.test(key)) {
            const obj = await provider.get<Record<string, any>>(key);
            if (obj !== null && typeof obj === 'object' && field in obj && !dryRun) {
              delete obj[field];
              await provider.set(key, obj);
              count++;
            }
          }
        }
        return count;
      },

      renameField: async (pattern: RegExp, oldField: string, newField: string) => {
        const keys = await provider.keys();
        let count = 0;
        for (const key of keys) {
          if (pattern.test(key)) {
            const obj = await provider.get<Record<string, any>>(key);
            if (obj !== null && typeof obj === 'object' && oldField in obj && !dryRun) {
              obj[newField] = obj[oldField];
              delete obj[oldField];
              await provider.set(key, obj);
              count++;
            }
          }
        }
        return count;
      },

      batch: async (operations: Array<() => Promise<void>>) => {
        if (dryRun) return;
        for (const op of operations) {
          await op();
        }
      },

      getKeysByPattern: async (pattern: RegExp) => {
        const keys = await provider.keys();
        return keys.filter((key) => pattern.test(key));
      },
    };
  }

  private getMigrationPath(from: number, to: number): Migration[] {
    if (from === to) return [];

    const isUpgrade = to > from;
    const range = isUpgrade
      ? this.config.migrations.filter((m) => m.version > from && m.version <= to)
      : this.config.migrations.filter((m) => m.version <= from && m.version > to);

    // Sort by version (ascending for upgrade, descending for downgrade)
    range.sort((a, b) => (isUpgrade ? a.version - b.version : b.version - a.version));

    // Resolve dependencies
    return this.resolveDependencies(range, isUpgrade);
  }

  private resolveDependencies(migrations: Migration[], isUpgrade: boolean): Migration[] {
    const resolved: Migration[] = [];
    const pending = [...migrations];
    const resolvedVersions = new Set<number>();

    while (pending.length > 0) {
      let progress = false;

      for (let i = pending.length - 1; i >= 0; i--) {
        const migration = pending[i];
        const deps = migration.dependencies || [];
        const allDepsResolved = deps.every((d) => resolvedVersions.has(d));

        if (allDepsResolved) {
          resolved.push(migration);
          resolvedVersions.add(migration.version);
          pending.splice(i, 1);
          progress = true;
        }
      }

      if (!progress && pending.length > 0) {
        // Circular dependency or missing dependency
        throw new Error(`Unable to resolve dependencies for migrations: ${pending.map((m) => m.version).join(', ')}`);
      }
    }

    return isUpgrade ? resolved : resolved.reverse();
  }

  private detectCircularDependencies(): number[] {
    const visited = new Set<number>();
    const recStack = new Set<number>();

    const dfs = (version: number, path: number[]): number[] | null => {
      visited.add(version);
      recStack.add(path.length);

      const migration = this.config.migrations.find((m) => m.version === version);
      const deps = migration?.dependencies || [];

      for (const dep of deps) {
        if (!visited.has(dep)) {
          const result = dfs(dep, [...path, version]);
          if (result) return result;
        } else if (recStack.has(dep)) {
          return [...path, version, dep];
        }
      }

      recStack.delete(path.length);
      return null;
    };

    for (const migration of this.config.migrations) {
      if (!visited.has(migration.version)) {
        const cycle = dfs(migration.version, []);
        if (cycle) return cycle;
      }
    }

    return [];
  }

  private async loadState(): Promise<void> {
    const state = await this.config.provider.get<MigrationState>('__migration_state__');
    if (state) {
      this.state = state;
    }
  }

  private async saveState(): Promise<void> {
    await this.config.provider.set('__migration_state__', this.state);
  }

  private log(message: string, level: string): void {
    if (this.config.logging) {
      console.log(`[MigrationManager] [${level.toUpperCase()}] ${message}`);
    }

    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
    });

    // Keep only last 1000 entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }
}

/**
 * Create a new MigrationManager instance
 *
 * @param provider - Storage provider
 * @param migrations - Migration definitions
 * @param options - Additional options
 * @returns MigrationManager instance
 */
export function createMigrationManager(
  provider: StorageProvider,
  migrations: Migration[],
  options?: Partial<MigrationConfig>
): MigrationManager {
  return new MigrationManager({
    currentVersion: 0,
    provider,
    migrations,
    ...options,
  });
}

export default MigrationManager;
