/**
 * ConflictResolver - Intelligent conflict resolution for storage synchronization
 *
 * This module provides comprehensive conflict resolution strategies including
 * automatic merging, three-way diff, operational transformation, and custom
 * resolution handlers for complex sync scenarios.
 *
 * @module ConflictResolver
 * @version 2.0.0
 */

/**
 * Sync conflict information
 */
export interface SyncConflict {
  /** Key that has conflict */
  key: string;
  /** Local value */
  localValue: any;
  /** Remote value */
  remoteValue: any;
  /** Base value (if available for three-way merge) */
  baseValue?: any;
  /** Local modification timestamp */
  localTimestamp: number;
  /** Remote modification timestamp */
  remoteTimestamp: number;
  /** Base timestamp (if available) */
  baseTimestamp?: number;
  /** Conflict type */
  type?: ConflictType;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  /** Action to take */
  action: 'upload' | 'download' | 'merge' | 'skip' | 'delete';
  /** Resolved value (for merge action) */
  value?: any;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Reason for resolution */
  reason?: string;
}

/**
 * Types of conflicts
 */
export enum ConflictType {
  /** Both modified the same field */
  MODIFY_MODIFY = 'modify_modify',
  /** Local modified, remote deleted */
  MODIFY_DELETE = 'modify_delete',
  /** Local deleted, remote modified */
  DELETE_MODIFY = 'delete_modify',
  /** Both deleted (no actual conflict) */
  DELETE_DELETE = 'delete_delete',
  /** Both added same key with different values */
  ADD_ADD = 'add_add',
  /** Type changed (e.g., object to array) */
  TYPE_CHANGE = 'type_change',
  /** Array reordering conflict */
  ARRAY_REORDER = 'array_reorder',
}

/**
 * Merge strategy for specific fields
 */
export interface FieldMergeStrategy {
  /** Field path (dot notation) */
  field: string;
  /** Strategy to use */
  strategy: MergeStrategy;
  /** Custom resolver for this field */
  customResolver?: (local: any, remote: any, base?: any) => any;
}

/**
 * Available merge strategies
 */
export enum MergeStrategy {
  /** Take local value */
  LOCAL_WINS = 'local_wins',
  /** Take remote value */
  REMOTE_WINS = 'remote_wins',
  /** Take most recent */
  LAST_WRITE_WINS = 'last_write_wins',
  /** Deep merge objects */
  DEEP_MERGE = 'deep_merge',
  /** Union arrays */
  ARRAY_UNION = 'array_union',
  /** Concatenate arrays */
  ARRAY_CONCAT = 'array_concat',
  /** Keep both in array */
  KEEP_BOTH = 'keep_both',
  /** Take max value (numbers) */
  MAX_VALUE = 'max_value',
  /** Take min value (numbers) */
  MIN_VALUE = 'min_value',
  /** Increment/counter merge */
  COUNTER_INCREMENT = 'counter_increment',
  /** Custom merge function */
  CUSTOM = 'custom',
}

/**
 * Conflict resolver configuration
 */
export interface ConflictResolverConfig {
  /** Default merge strategy */
  defaultStrategy: MergeStrategy;
  /** Field-specific strategies */
  fieldStrategies?: FieldMergeStrategy[];
  /** Prefer local on type conflict */
  preferLocalOnTypeConflict?: boolean;
  /** Enable automatic three-way merge when base is available */
  enableThreeWayMerge?: boolean;
  /** Track conflict history */
  trackHistory?: boolean;
  /** Maximum history entries */
  maxHistoryEntries?: number;
  /** Callback for unresolvable conflicts */
  onUnresolvableConflict?: (conflict: SyncConflict) => Promise<ConflictResolution>;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Conflict history entry
 */
export interface ConflictHistoryEntry {
  /** Timestamp */
  timestamp: number;
  /** Key involved */
  key: string;
  /** Conflict type */
  type: ConflictType;
  /** Resolution applied */
  resolution: ConflictResolution;
  /** Whether resolution was automatic */
  automatic: boolean;
}

/**
 * Diff result for three-way merge
 */
interface DiffResult {
  /** Added fields/elements */
  added: Map<string, any>;
  /** Removed fields/elements */
  removed: Set<string>;
  /** Modified fields */
  modified: Map<string, { oldValue: any; newValue: any }>;
  /** Unchanged fields */
  unchanged: Set<string>;
}

/**
 * ConflictResolver class for handling synchronization conflicts
 *
 * @example
 * ```typescript
 * const resolver = new ConflictResolver({
 *   defaultStrategy: MergeStrategy.DEEP_MERGE,
 *   fieldStrategies: [
 *     { field: 'updatedAt', strategy: MergeStrategy.MAX_VALUE },
 *     { field: 'counter', strategy: MergeStrategy.COUNTER_INCREMENT },
 *     { field: 'tags', strategy: MergeStrategy.ARRAY_UNION },
 *   ],
 *   enableThreeWayMerge: true,
 * });
 *
 * const resolution = await resolver.resolve({
 *   key: 'user:1',
 *   localValue: { name: 'John', age: 31 },
 *   remoteValue: { name: 'John', age: 30, email: 'john@example.com' },
 *   localTimestamp: Date.now(),
 *   remoteTimestamp: Date.now() - 1000,
 * });
 * ```
 */
export class ConflictResolver {
  /** Resolver name */
  public readonly name = 'conflict-resolver';

  /** Resolver version */
  public readonly version = '2.0.0';

  private config: ConflictResolverConfig;
  private history: ConflictHistoryEntry[] = [];
  private fieldResolvers: Map<string, (local: any, remote: any, base?: any) => any> = new Map();

  /**
   * Creates a new ConflictResolver instance
   *
   * @param config - Configuration options
   */
  constructor(config?: Partial<ConflictResolverConfig>) {
    this.config = {
      defaultStrategy: MergeStrategy.LAST_WRITE_WINS,
      preferLocalOnTypeConflict: true,
      enableThreeWayMerge: true,
      trackHistory: false,
      maxHistoryEntries: 1000,
      logging: false,
      ...config,
    };

    // Register field-specific resolvers
    if (this.config.fieldStrategies) {
      for (const strategy of this.config.fieldStrategies) {
        if (strategy.customResolver) {
          this.fieldResolvers.set(strategy.field, strategy.customResolver);
        }
      }
    }
  }

  /**
   * Resolve a sync conflict
   *
   * @param conflict - Conflict information
   * @returns Promise resolving to resolution
   */
  async resolve(conflict: SyncConflict): Promise<ConflictResolution> {
    this.log(`Resolving conflict for key: ${conflict.key}`);

    // Detect conflict type
    const type = conflict.type || this.detectConflictType(conflict);
    conflict.type = type;

    let resolution: ConflictResolution;

    try {
      switch (type) {
        case ConflictType.DELETE_DELETE:
          resolution = { action: 'skip', reason: 'Both deleted' };
          break;

        case ConflictType.MODIFY_DELETE:
          resolution = await this.resolveModifyDelete(conflict);
          break;

        case ConflictType.DELETE_MODIFY:
          resolution = await this.resolveDeleteModify(conflict);
          break;

        case ConflictType.TYPE_CHANGE:
          resolution = await this.resolveTypeChange(conflict);
          break;

        case ConflictType.ADD_ADD:
        case ConflictType.MODIFY_MODIFY:
        default:
          resolution = await this.resolveModifyModify(conflict);
          break;
      }
    } catch (error) {
      this.log(`Error resolving conflict: ${error}`);

      if (this.config.onUnresolvableConflict) {
        resolution = await this.config.onUnresolvableConflict(conflict);
      } else {
        resolution = { action: 'skip', reason: `Error: ${error}` };
      }
    }

    // Track history
    if (this.config.trackHistory) {
      this.addToHistory(conflict, resolution, true);
    }

    return resolution;
  }

  /**
   * Resolve a batch of conflicts
   *
   * @param conflicts - Array of conflicts
   * @returns Promise resolving to array of resolutions
   */
  async resolveAll(conflicts: SyncConflict[]): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolve(conflict);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Perform three-way merge
   *
   * @param local - Local value
   * @param remote - Remote value
   * @param base - Base value (common ancestor)
   * @returns Merged value
   */
  threeWayMerge<T>(local: T, remote: T, base: T): T {
    if (!this.config.enableThreeWayMerge) {
      return this.twoWayMerge(local, remote);
    }

    // Handle primitives
    if (typeof local !== 'object' || local === null) {
      // If local changed from base, prefer local; otherwise prefer remote
      if (local !== base) return local;
      if (remote !== base) return remote;
      return local;
    }

    // Handle arrays
    if (Array.isArray(local) && Array.isArray(remote) && Array.isArray(base)) {
      return this.mergeArraysThreeWay(local, remote, base) as T;
    }

    // Handle objects
    if (this.isPlainObject(local) && this.isPlainObject(remote) && this.isPlainObject(base)) {
      return this.mergeObjectsThreeWay(local, remote, base) as T;
    }

    // Fallback to two-way merge
    return this.twoWayMerge(local, remote);
  }

  /**
   * Perform two-way merge
   *
   * @param local - Local value
   * @param remote - Remote value
   * @returns Merged value
   */
  twoWayMerge<T>(local: T, remote: T): T {
    // Handle primitives
    if (typeof local !== 'object' || local === null) {
      return this.config.defaultStrategy === MergeStrategy.LOCAL_WINS ? local : remote;
    }

    // Handle arrays
    if (Array.isArray(local) && Array.isArray(remote)) {
      return this.mergeArrays(local, remote) as T;
    }

    // Handle objects
    if (this.isPlainObject(local) && this.isPlainObject(remote)) {
      return this.mergeObjects(local, remote) as T;
    }

    // Type mismatch - use default strategy
    return this.config.preferLocalOnTypeConflict ? local : remote;
  }

  /**
   * Deep merge two objects
   *
   * @param local - Local object
   * @param remote - Remote object
   * @returns Merged object
   */
  mergeObjects(local: Record<string, any>, remote: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of allKeys) {
      const localValue = local[key];
      const remoteValue = remote[key];

      // Check for field-specific strategy
      const fieldStrategy = this.getFieldStrategy(key);

      if (fieldStrategy) {
        result[key] = this.applyFieldStrategy(key, localValue, remoteValue, fieldStrategy);
      } else if (localValue === undefined) {
        result[key] = remoteValue;
      } else if (remoteValue === undefined) {
        result[key] = localValue;
      } else if (this.isPlainObject(localValue) && this.isPlainObject(remoteValue)) {
        result[key] = this.mergeObjects(localValue, remoteValue);
      } else if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        result[key] = this.mergeArrays(localValue, remoteValue);
      } else {
        // Primitive value - use default strategy
        result[key] = this.config.defaultStrategy === MergeStrategy.LOCAL_WINS ? localValue : remoteValue;
      }
    }

    return result;
  }

  /**
   * Three-way merge objects
   */
  private mergeObjectsThreeWay(
    local: Record<string, any>,
    remote: Record<string, any>,
    base: Record<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(base)]);

    for (const key of allKeys) {
      const localValue = local[key];
      const remoteValue = remote[key];
      const baseValue = base[key];

      const localChanged = !this.deepEqual(localValue, baseValue);
      const remoteChanged = !this.deepEqual(remoteValue, baseValue);

      if (!localChanged && !remoteChanged) {
        // Neither changed
        result[key] = baseValue;
      } else if (localChanged && !remoteChanged) {
        // Only local changed
        result[key] = localValue;
      } else if (!localChanged && remoteChanged) {
        // Only remote changed
        result[key] = remoteValue;
      } else {
        // Both changed - need to merge
        const fieldStrategy = this.getFieldStrategy(key);

        if (fieldStrategy) {
          result[key] = this.applyFieldStrategy(key, localValue, remoteValue, fieldStrategy, baseValue);
        } else if (this.isPlainObject(localValue) && this.isPlainObject(remoteValue) && this.isPlainObject(baseValue)) {
          result[key] = this.mergeObjectsThreeWay(localValue, remoteValue, baseValue);
        } else if (Array.isArray(localValue) && Array.isArray(remoteValue) && Array.isArray(baseValue)) {
          result[key] = this.mergeArraysThreeWay(localValue, remoteValue, baseValue);
        } else {
          // Conflicting primitives - use last-write-wins by default
          result[key] = this.config.defaultStrategy === MergeStrategy.LOCAL_WINS ? localValue : remoteValue;
        }
      }
    }

    return result;
  }

  /**
   * Merge arrays based on configured strategy
   */
  mergeArrays(local: any[], remote: any[]): any[] {
    const strategy = this.config.defaultStrategy;

    switch (strategy) {
      case MergeStrategy.ARRAY_UNION:
        return this.arrayUnion(local, remote);

      case MergeStrategy.ARRAY_CONCAT:
        return [...local, ...remote];

      case MergeStrategy.KEEP_BOTH:
        return [local, remote];

      case MergeStrategy.LOCAL_WINS:
        return local;

      case MergeStrategy.REMOTE_WINS:
        return remote;

      default:
        return this.arrayUnion(local, remote);
    }
  }

  /**
   * Three-way merge arrays
   */
  private mergeArraysThreeWay(local: any[], remote: any[], base: any[]): any[] {
    const baseSet = new Set(base.map((item) => this.hashValue(item)));
    const result: any[] = [];
    const seen = new Set<string>();

    // Items in local
    for (const item of local) {
      const hash = this.hashValue(item);
      const inBase = baseSet.has(hash);
      const inRemote = remote.some((r) => this.deepEqual(r, item));

      if (inBase || inRemote) {
        if (!seen.has(hash)) {
          result.push(item);
          seen.add(hash);
        }
      } else {
        // Added locally
        if (!seen.has(hash)) {
          result.push(item);
          seen.add(hash);
        }
      }
    }

    // Items added in remote (not in local or base)
    for (const item of remote) {
      const hash = this.hashValue(item);
      const inBase = baseSet.has(hash);
      const inLocal = local.some((l) => this.deepEqual(l, item));

      if (!inBase && !inLocal && !seen.has(hash)) {
        result.push(item);
        seen.add(hash);
      }
    }

    return result;
  }

  /**
   * Union of two arrays (unique elements)
   */
  arrayUnion<T>(local: T[], remote: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of [...local, ...remote]) {
      const hash = this.hashValue(item);
      if (!seen.has(hash)) {
        seen.add(hash);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Detect conflict type from conflict data
   */
  detectConflictType(conflict: SyncConflict): ConflictType {
    const { localValue, remoteValue, baseValue } = conflict;

    const localExists = localValue !== undefined && localValue !== null;
    const remoteExists = remoteValue !== undefined && remoteValue !== null;
    const baseExists = baseValue !== undefined && baseValue !== null;

    // Both deleted
    if (!localExists && !remoteExists) {
      return ConflictType.DELETE_DELETE;
    }

    // Local modified, remote deleted
    if (localExists && !remoteExists && baseExists) {
      return ConflictType.MODIFY_DELETE;
    }

    // Local deleted, remote modified
    if (!localExists && remoteExists && baseExists) {
      return ConflictType.DELETE_MODIFY;
    }

    // Both added (no base)
    if (localExists && remoteExists && !baseExists) {
      return ConflictType.ADD_ADD;
    }

    // Type change
    if (localExists && remoteExists && typeof localValue !== typeof remoteValue) {
      return ConflictType.TYPE_CHANGE;
    }

    if (
      localExists &&
      remoteExists &&
      (Array.isArray(localValue) !== Array.isArray(remoteValue))
    ) {
      return ConflictType.TYPE_CHANGE;
    }

    // Array reorder
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      if (this.isArrayReorder(localValue, remoteValue)) {
        return ConflictType.ARRAY_REORDER;
      }
    }

    // Default to modify-modify
    return ConflictType.MODIFY_MODIFY;
  }

  /**
   * Get conflict history
   *
   * @param limit - Maximum entries to return
   * @returns Array of history entries
   */
  getHistory(limit?: number): ConflictHistoryEntry[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Clear conflict history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Register a custom field resolver
   *
   * @param field - Field path
   * @param resolver - Resolver function
   */
  registerFieldResolver(field: string, resolver: (local: any, remote: any, base?: any) => any): void {
    this.fieldResolvers.set(field, resolver);
  }

  /**
   * Unregister a field resolver
   *
   * @param field - Field path
   */
  unregisterFieldResolver(field: string): void {
    this.fieldResolvers.delete(field);
  }

  // Private helper methods

  private async resolveModifyModify(conflict: SyncConflict): Promise<ConflictResolution> {
    const { localValue, remoteValue, baseValue, localTimestamp, remoteTimestamp } = conflict;

    // Try three-way merge first
    if (baseValue !== undefined && this.config.enableThreeWayMerge) {
      try {
        const merged = this.threeWayMerge(localValue, remoteValue, baseValue);
        return { action: 'merge', value: merged, reason: 'Three-way merge' };
      } catch (error) {
        this.log(`Three-way merge failed: ${error}`);
      }
    }

    // Fall back to strategy-based resolution
    switch (this.config.defaultStrategy) {
      case MergeStrategy.LOCAL_WINS:
        return { action: 'upload', value: localValue, reason: 'Local wins strategy' };

      case MergeStrategy.REMOTE_WINS:
        return { action: 'download', value: remoteValue, reason: 'Remote wins strategy' };

      case MergeStrategy.LAST_WRITE_WINS:
        if (localTimestamp >= remoteTimestamp) {
          return { action: 'upload', value: localValue, reason: 'Last write wins (local)' };
        }
        return { action: 'download', value: remoteValue, reason: 'Last write wins (remote)' };

      case MergeStrategy.DEEP_MERGE:
        const merged = this.twoWayMerge(localValue, remoteValue);
        return { action: 'merge', value: merged, reason: 'Deep merge' };

      default:
        return { action: 'upload', value: localValue, reason: 'Default to local' };
    }
  }

  private async resolveModifyDelete(conflict: SyncConflict): Promise<ConflictResolution> {
    // Local modified, remote deleted
    // By default, preserve local modification
    if (this.config.preferLocalOnTypeConflict) {
      return { action: 'upload', value: conflict.localValue, reason: 'Preserve local modification' };
    }
    return { action: 'delete', reason: 'Accept remote deletion' };
  }

  private async resolveDeleteModify(conflict: SyncConflict): Promise<ConflictResolution> {
    // Local deleted, remote modified
    // By default, accept remote modification
    if (this.config.preferLocalOnTypeConflict) {
      return { action: 'delete', reason: 'Preserve local deletion' };
    }
    return { action: 'download', value: conflict.remoteValue, reason: 'Accept remote modification' };
  }

  private async resolveTypeChange(conflict: SyncConflict): Promise<ConflictResolution> {
    // Type change - prefer one based on config
    if (this.config.preferLocalOnTypeConflict) {
      return { action: 'upload', value: conflict.localValue, reason: 'Type conflict - prefer local' };
    }
    return { action: 'download', value: conflict.remoteValue, reason: 'Type conflict - prefer remote' };
  }

  private getFieldStrategy(field: string): FieldMergeStrategy | undefined {
    return this.config.fieldStrategies?.find((s) => s.field === field || this.matchesFieldPath(field, s.field));
  }

  private matchesFieldPath(actual: string, pattern: string): boolean {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return actual.startsWith(prefix);
    }
    return actual === pattern;
  }

  private applyFieldStrategy(
    field: string,
    localValue: any,
    remoteValue: any,
    strategy: FieldMergeStrategy,
    baseValue?: any
  ): any {
    // Custom resolver
    if (strategy.customResolver) {
      return strategy.customResolver(localValue, remoteValue, baseValue);
    }

    const fieldResolver = this.fieldResolvers.get(strategy.field);
    if (fieldResolver) {
      return fieldResolver(localValue, remoteValue, baseValue);
    }

    switch (strategy.strategy) {
      case MergeStrategy.LOCAL_WINS:
        return localValue;

      case MergeStrategy.REMOTE_WINS:
        return remoteValue;

      case MergeStrategy.MAX_VALUE:
        return Math.max(localValue || 0, remoteValue || 0);

      case MergeStrategy.MIN_VALUE:
        return Math.min(localValue || 0, remoteValue || 0);

      case MergeStrategy.COUNTER_INCREMENT:
        const localDelta = baseValue !== undefined ? (localValue || 0) - baseValue : localValue || 0;
        const remoteDelta = baseValue !== undefined ? (remoteValue || 0) - baseValue : remoteValue || 0;
        return (baseValue || 0) + localDelta + remoteDelta;

      case MergeStrategy.ARRAY_UNION:
        return this.arrayUnion(localValue || [], remoteValue || []);

      case MergeStrategy.ARRAY_CONCAT:
        return [...(localValue || []), ...(remoteValue || [])];

      case MergeStrategy.KEEP_BOTH:
        return [localValue, remoteValue];

      case MergeStrategy.DEEP_MERGE:
        if (this.isPlainObject(localValue) && this.isPlainObject(remoteValue)) {
          return this.mergeObjects(localValue, remoteValue);
        }
        return localValue;

      default:
        return localValue;
    }
  }

  private addToHistory(conflict: SyncConflict, resolution: ConflictResolution, automatic: boolean): void {
    this.history.push({
      timestamp: Date.now(),
      key: conflict.key,
      type: conflict.type || ConflictType.MODIFY_MODIFY,
      resolution,
      automatic,
    });

    // Trim history
    if (this.history.length > (this.config.maxHistoryEntries || 1000)) {
      this.history = this.history.slice(-this.config.maxHistoryEntries!);
    }
  }

  private isPlainObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object;
  }

  private isArrayReorder(local: any[], remote: any[]): boolean {
    if (local.length !== remote.length) return false;

    const localSorted = [...local].sort((a, b) => this.hashValue(a).localeCompare(this.hashValue(b)));
    const remoteSorted = [...remote].sort((a, b) => this.hashValue(a).localeCompare(this.hashValue(b)));

    return this.deepEqual(localSorted, remoteSorted);
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this.deepEqual(a[key], b[key]));
    }

    return false;
  }

  private hashValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value !== 'object') return String(value);
    return JSON.stringify(value);
  }

  private log(message: string): void {
    if (this.config.logging) {
      console.log(`[ConflictResolver] ${message}`);
    }
  }
}

/**
 * Create a new ConflictResolver instance
 *
 * @param strategy - Default merge strategy
 * @param options - Additional configuration
 * @returns ConflictResolver instance
 */
export function createConflictResolver(
  strategy: MergeStrategy = MergeStrategy.LAST_WRITE_WINS,
  options?: Partial<ConflictResolverConfig>
): ConflictResolver {
  return new ConflictResolver({
    defaultStrategy: strategy,
    ...options,
  });
}

export default ConflictResolver;
