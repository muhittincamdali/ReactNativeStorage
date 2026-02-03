/**
 * useStorage - React hooks for storage operations
 *
 * This module provides comprehensive React hooks for interacting with
 * storage providers, including state management, caching, subscriptions,
 * and optimistic updates.
 *
 * @module useStorage
 * @version 2.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import type { StorageProvider, StorageOptions, QueryOptions, QueryResult, StorageItem } from '../types';

/**
 * Storage hook options
 */
export interface UseStorageOptions<T> {
  /** Default value when key doesn't exist */
  defaultValue?: T;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Refresh on window/app focus */
  syncOnFocus?: boolean;
  /** Poll interval in milliseconds */
  pollingInterval?: number;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Debounce writes in milliseconds */
  debounceMs?: number;
  /** Transform value on read */
  transformOnRead?: (value: T) => T;
  /** Transform value on write */
  transformOnWrite?: (value: T) => T;
  /** Validation function */
  validate?: (value: T) => boolean | string;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Storage hook return type
 */
export interface UseStorageReturn<T> {
  /** Current value */
  value: T | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Set new value */
  set: (newValue: T) => Promise<void>;
  /** Update value with function */
  update: (updater: (current: T | null) => T) => Promise<void>;
  /** Remove value */
  remove: () => Promise<void>;
  /** Refresh from storage */
  refresh: () => Promise<void>;
  /** Reset to default value */
  reset: () => Promise<void>;
  /** Whether value exists in storage */
  exists: boolean;
  /** Last sync timestamp */
  lastSync: number | null;
  /** Whether there are unsaved changes */
  isDirty: boolean;
}

/**
 * Main storage hook for single key operations
 *
 * @param storage - Storage provider
 * @param key - Storage key
 * @param options - Hook options
 * @returns Storage hook return object
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { value, loading, set, error } = useStorage(storage, 'user', {
 *     defaultValue: { name: '', email: '' },
 *     ttl: 3600000, // 1 hour
 *   });
 *
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return (
 *     <View>
 *       <Text>{value?.name}</Text>
 *       <Button onPress={() => set({ ...value, name: 'New Name' })} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useStorage<T>(
  storage: StorageProvider,
  key: string,
  options?: UseStorageOptions<T>
): UseStorageReturn<T> {
  const [value, setValue] = useState<T | null>(options?.defaultValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exists, setExists] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const mountedRef = useRef(true);
  const storageRef = useRef(storage);
  const keyRef = useRef(key);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  // Update refs when props change
  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Load value from storage
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const keyExists = await storageRef.current.has(keyRef.current);
      setExists(keyExists);

      if (keyExists) {
        let stored = await storageRef.current.get<T>(keyRef.current);

        if (!mountedRef.current) return;

        // Apply read transform
        if (stored !== null && options?.transformOnRead) {
          stored = options.transformOnRead(stored);
        }

        setValue(stored);
      } else if (options?.defaultValue !== undefined) {
        setValue(options.defaultValue);
      }

      setLastSync(Date.now());
      setIsDirty(false);

      if (options?.logging) {
        console.log(`[useStorage] Loaded key "${keyRef.current}":`, value);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        if (options?.logging) {
          console.error(`[useStorage] Error loading key "${keyRef.current}":`, err);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [options?.defaultValue, options?.transformOnRead, options?.logging]);

  // Initial load
  useEffect(() => {
    load();
  }, [key, load]);

  // Polling
  useEffect(() => {
    if (!options?.pollingInterval) return;

    const interval = setInterval(() => {
      if (mountedRef.current && !isDirty) {
        load();
      }
    }, options.pollingInterval);

    return () => clearInterval(interval);
  }, [options?.pollingInterval, load, isDirty]);

  // Set value
  const set = useCallback(
    async (newValue: T) => {
      try {
        setError(null);

        // Validate
        if (options?.validate) {
          const validationResult = options.validate(newValue);
          if (validationResult !== true) {
            throw new Error(typeof validationResult === 'string' ? validationResult : 'Validation failed');
          }
        }

        // Apply write transform
        let valueToStore = newValue;
        if (options?.transformOnWrite) {
          valueToStore = options.transformOnWrite(newValue);
        }

        // Optimistic update
        if (options?.optimistic) {
          setValue(newValue);
          setIsDirty(true);
        }

        // Debounced write
        if (options?.debounceMs) {
          pendingValueRef.current = valueToStore;

          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(async () => {
            if (pendingValueRef.current !== null) {
              await storageRef.current.set(keyRef.current, pendingValueRef.current, {
                ttl: options?.ttl,
              });
              pendingValueRef.current = null;
              setIsDirty(false);
              setLastSync(Date.now());
            }
          }, options.debounceMs);
        } else {
          // Immediate write
          await storageRef.current.set(keyRef.current, valueToStore, {
            ttl: options?.ttl,
          });

          if (mountedRef.current) {
            if (!options?.optimistic) {
              setValue(newValue);
            }
            setExists(true);
            setIsDirty(false);
            setLastSync(Date.now());
          }
        }

        if (options?.logging) {
          console.log(`[useStorage] Set key "${keyRef.current}":`, newValue);
        }
      } catch (err) {
        // Revert optimistic update on error
        if (options?.optimistic) {
          await load();
        }

        if (mountedRef.current) {
          setError(err as Error);
        }
        throw err;
      }
    },
    [options, load]
  );

  // Update with function
  const update = useCallback(
    async (updater: (current: T | null) => T) => {
      const currentValue = value;
      const newValue = updater(currentValue);
      await set(newValue);
    },
    [value, set]
  );

  // Remove value
  const remove = useCallback(async () => {
    try {
      setError(null);

      // Optimistic update
      if (options?.optimistic) {
        setValue(options?.defaultValue ?? null);
        setExists(false);
      }

      await storageRef.current.remove(keyRef.current);

      if (mountedRef.current) {
        if (!options?.optimistic) {
          setValue(options?.defaultValue ?? null);
          setExists(false);
        }
        setIsDirty(false);
        setLastSync(Date.now());
      }

      if (options?.logging) {
        console.log(`[useStorage] Removed key "${keyRef.current}"`);
      }
    } catch (err) {
      // Revert optimistic update on error
      if (options?.optimistic) {
        await load();
      }

      if (mountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  }, [options, load]);

  // Refresh from storage
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  // Reset to default
  const reset = useCallback(async () => {
    if (options?.defaultValue !== undefined) {
      await set(options.defaultValue);
    } else {
      await remove();
    }
  }, [options?.defaultValue, set, remove]);

  return {
    value,
    loading,
    error,
    set,
    update,
    remove,
    refresh,
    reset,
    exists,
    lastSync,
    isDirty,
  };
}

/**
 * Hook options for multiple keys
 */
export interface UseStorageManyOptions {
  /** Refresh on changes */
  syncOnChange?: boolean;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Hook return type for multiple keys
 */
export interface UseStorageManyReturn<T> {
  /** Map of values by key */
  values: Map<string, T | null>;
  /** Loading state */
  loading: boolean;
  /** Errors by key */
  errors: Map<string, Error>;
  /** Set a specific key */
  set: (key: string, value: T) => Promise<void>;
  /** Set multiple keys at once */
  setMany: (entries: Array<{ key: string; value: T }>) => Promise<void>;
  /** Remove a specific key */
  remove: (key: string) => Promise<void>;
  /** Remove multiple keys */
  removeMany: (keys: string[]) => Promise<void>;
  /** Refresh all values */
  refresh: () => Promise<void>;
  /** Clear all values */
  clear: () => Promise<void>;
}

/**
 * Hook for managing multiple storage keys
 *
 * @param storage - Storage provider
 * @param keys - Array of keys to manage
 * @param options - Hook options
 * @returns Multiple storage hook return object
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { values, loading, setMany } = useStorageMany(storage, [
 *     'user',
 *     'settings',
 *     'cache',
 *   ]);
 *
 *   if (loading) return <Loading />;
 *
 *   return (
 *     <View>
 *       <Text>User: {values.get('user')?.name}</Text>
 *       <Text>Theme: {values.get('settings')?.theme}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useStorageMany<T>(
  storage: StorageProvider,
  keys: string[],
  options?: UseStorageManyOptions
): UseStorageManyReturn<T> {
  const [values, setValues] = useState<Map<string, T | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  const mountedRef = useRef(true);
  const storageRef = useRef(storage);

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const newValues = new Map<string, T | null>();
      const newErrors = new Map<string, Error>();

      const results = await storageRef.current.getMany<T>(keys);

      for (const [key, value] of results.entries()) {
        newValues.set(key, value);
      }

      if (mountedRef.current) {
        setValues(newValues);
        setErrors(newErrors);
      }
    } catch (err) {
      if (options?.logging) {
        console.error('[useStorageMany] Error loading:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [keys, options?.logging]);

  useEffect(() => {
    load();
  }, [load]);

  const set = useCallback(async (key: string, value: T) => {
    await storageRef.current.set(key, value);
    setValues((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const setMany = useCallback(async (entries: Array<{ key: string; value: T }>) => {
    await storageRef.current.setMany(entries);
    setValues((prev) => {
      const next = new Map(prev);
      for (const entry of entries) {
        next.set(entry.key, entry.value);
      }
      return next;
    });
  }, []);

  const remove = useCallback(async (key: string) => {
    await storageRef.current.remove(key);
    setValues((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const removeMany = useCallback(async (keysToRemove: string[]) => {
    await storageRef.current.removeMany(keysToRemove);
    setValues((prev) => {
      const next = new Map(prev);
      for (const key of keysToRemove) {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const clear = useCallback(async () => {
    await storageRef.current.removeMany(keys);
    setValues(new Map());
  }, [keys]);

  return {
    values,
    loading,
    errors,
    set,
    setMany,
    remove,
    removeMany,
    refresh,
    clear,
  };
}

/**
 * Query hook options
 */
export interface UseStorageQueryOptions extends QueryOptions {
  /** Enable query */
  enabled?: boolean;
  /** Cache results */
  cache?: boolean;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Refetch on window focus */
  refetchOnFocus?: boolean;
  /** Refetch interval */
  refetchInterval?: number;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Query hook return type
 */
export interface UseStorageQueryReturn<T> {
  /** Query results */
  data: QueryResult<T> | null;
  /** Items array */
  items: StorageItem<T>[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refetch query */
  refetch: () => Promise<void>;
  /** Whether there are more results */
  hasMore: boolean;
  /** Load next page */
  fetchMore: () => Promise<void>;
  /** Total count */
  total: number;
}

/**
 * Hook for querying storage with pagination and filtering
 *
 * @param storage - Storage provider
 * @param options - Query options
 * @returns Query hook return object
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { items, loading, hasMore, fetchMore } = useStorageQuery(storage, {
 *     prefix: 'user:',
 *     limit: 20,
 *     sort: { field: 'createdAt', order: 'desc' },
 *   });
 *
 *   return (
 *     <FlatList
 *       data={items}
 *       renderItem={({ item }) => <UserCard user={item.value} />}
 *       onEndReached={() => hasMore && fetchMore()}
 *     />
 *   );
 * }
 * ```
 */
export function useStorageQuery<T>(
  storage: StorageProvider,
  options?: UseStorageQueryOptions
): UseStorageQueryReturn<T> {
  const [data, setData] = useState<QueryResult<T> | null>(null);
  const [loading, setLoading] = useState(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);

  const mountedRef = useRef(true);
  const storageRef = useRef(storage);
  const cacheRef = useRef<{ data: QueryResult<T>; timestamp: number } | null>(null);

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const query = useCallback(
    async (offset = 0, append = false) => {
      if (options?.enabled === false) return;

      // Check cache
      if (options?.cache && cacheRef.current && offset === 0) {
        const age = Date.now() - cacheRef.current.timestamp;
        if (age < (options.cacheDuration || 60000)) {
          setData(cacheRef.current.data);
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);

        const queryOptions: QueryOptions = {
          prefix: options?.prefix,
          filter: options?.filter,
          sort: options?.sort,
          limit: options?.limit,
          offset,
        };

        // Use queryStorage if available, otherwise simulate with keys
        let result: QueryResult<T>;

        if ('queryStorage' in storageRef.current && typeof storageRef.current.queryStorage === 'function') {
          result = await (storageRef.current as any).queryStorage<T>(queryOptions);
        } else {
          // Fallback implementation
          const startTime = Date.now();
          const keys = await storageRef.current.keys(options?.prefix);
          const items: StorageItem<T>[] = [];

          for (const key of keys.slice(offset, offset + (options?.limit || 100))) {
            const value = await storageRef.current.get<T>(key);
            if (value !== null) {
              items.push({
                key,
                value,
                metadata: {
                  key,
                  size: 0,
                  createdAt: 0,
                  updatedAt: 0,
                  tags: [],
                  compressed: false,
                  encrypted: false,
                },
              });
            }
          }

          result = {
            items,
            total: keys.length,
            offset,
            limit: options?.limit || 100,
            hasMore: offset + items.length < keys.length,
            executionTime: Date.now() - startTime,
          };
        }

        if (!mountedRef.current) return;

        if (append && data) {
          result = {
            ...result,
            items: [...data.items, ...result.items],
          };
        }

        setData(result);

        // Update cache
        if (options?.cache && offset === 0) {
          cacheRef.current = { data: result, timestamp: Date.now() };
        }

        if (options?.logging) {
          console.log(`[useStorageQuery] Query returned ${result.items.length} items`);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
          if (options?.logging) {
            console.error('[useStorageQuery] Error:', err);
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [options, data]
  );

  // Initial query
  useEffect(() => {
    query(0);
  }, [options?.prefix, options?.filter, options?.sort, options?.enabled]);

  // Refetch interval
  useEffect(() => {
    if (!options?.refetchInterval) return;

    const interval = setInterval(() => {
      if (mountedRef.current) {
        query(0);
      }
    }, options.refetchInterval);

    return () => clearInterval(interval);
  }, [options?.refetchInterval, query]);

  const refetch = useCallback(async () => {
    setPage(0);
    await query(0);
  }, [query]);

  const fetchMore = useCallback(async () => {
    if (data && data.hasMore) {
      const newOffset = data.offset + data.limit;
      setPage((p) => p + 1);
      await query(newOffset, true);
    }
  }, [data, query]);

  return {
    data,
    items: data?.items || [],
    loading,
    error,
    refetch,
    hasMore: data?.hasMore || false,
    fetchMore,
    total: data?.total || 0,
  };
}

/**
 * Subscription hook options
 */
export interface UseStorageSubscriptionOptions {
  /** Immediate value */
  immediate?: boolean;
  /** Enable logging */
  logging?: boolean;
}

/**
 * Hook for subscribing to storage changes
 *
 * @param storage - Storage provider
 * @param key - Key to subscribe to
 * @param callback - Callback on changes
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * function LiveCounter() {
 *   const [count, setCount] = useState(0);
 *
 *   useStorageSubscription(storage, 'counter', (key, value) => {
 *     setCount(value || 0);
 *   });
 *
 *   return <Text>Count: {count}</Text>;
 * }
 * ```
 */
export function useStorageSubscription<T>(
  storage: StorageProvider,
  key: string,
  callback: (key: string, value: T | null) => void,
  options?: UseStorageSubscriptionOptions
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Get immediate value
    if (options?.immediate) {
      storage.get<T>(key).then((value) => {
        callbackRef.current(key, value);
      });
    }

    // Subscribe if provider supports it
    if (storage.subscribe) {
      const unsubscribe = storage.subscribe(key, (k, value) => {
        callbackRef.current(k, value);
        if (options?.logging) {
          console.log(`[useStorageSubscription] Change for "${k}":`, value);
        }
      });

      return unsubscribe;
    }

    // Fallback to polling
    let lastValue: T | null = null;

    const poll = async () => {
      const value = await storage.get<T>(key);
      if (JSON.stringify(value) !== JSON.stringify(lastValue)) {
        lastValue = value;
        callbackRef.current(key, value);
      }
    };

    const interval = setInterval(poll, 1000);
    poll(); // Initial poll

    return () => clearInterval(interval);
  }, [storage, key, options?.immediate, options?.logging]);
}

/**
 * Reducer state for async storage
 */
interface AsyncStorageState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Reducer actions
 */
type AsyncStorageAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T | null }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

/**
 * Reducer function
 */
function asyncStorageReducer<T>(state: AsyncStorageState<T>, action: AsyncStorageAction<T>): AsyncStorageState<T> {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'RESET':
      return { data: null, loading: false, error: null };
    default:
      return state;
  }
}

/**
 * Hook for async storage operations with reducer pattern
 *
 * @param storage - Storage provider
 * @param key - Storage key
 * @returns Async storage hook return
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const { data, loading, error, execute } = useAsyncStorage(storage, 'profile');
 *
 *   useEffect(() => {
 *     execute();
 *   }, [execute]);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorView error={error} />;
 *
 *   return <ProfileView profile={data} />;
 * }
 * ```
 */
export function useAsyncStorage<T>(storage: StorageProvider, key: string) {
  const [state, dispatch] = useReducer(asyncStorageReducer<T>, {
    data: null,
    loading: false,
    error: null,
  });

  const storageRef = useRef(storage);
  const keyRef = useRef(key);

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  const execute = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const data = await storageRef.current.get<T>(keyRef.current);
      dispatch({ type: 'SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    }
  }, []);

  const setData = useCallback(async (value: T) => {
    dispatch({ type: 'LOADING' });
    try {
      await storageRef.current.set(keyRef.current, value);
      dispatch({ type: 'SUCCESS', payload: value });
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error as Error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    ...state,
    execute,
    setData,
    reset,
  };
}

/**
 * Hook for storage statistics
 *
 * @param storage - Storage provider
 * @param interval - Refresh interval in ms
 * @returns Storage stats
 */
export function useStorageStats(storage: StorageProvider, interval?: number) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (storage.getStats) {
          const s = await storage.getStats();
          setStats(s);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    if (interval) {
      const timer = setInterval(fetchStats, interval);
      return () => clearInterval(timer);
    }
  }, [storage, interval]);

  return { stats, loading };
}

// Re-export types
export type { StorageProvider, StorageOptions, QueryOptions, QueryResult, StorageItem };
