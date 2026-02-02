import { useState, useEffect, useCallback, useRef } from 'react';
import { IStorage } from '../types';

interface UseStorageOptions<T> {
  defaultValue?: T;
  ttl?: number;
  syncOnFocus?: boolean;
}

interface UseStorageReturn<T> {
  value: T | null;
  loading: boolean;
  error: Error | null;
  set: (newValue: T) => Promise<void>;
  remove: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStorage<T>(
  storage: IStorage,
  key: string,
  options?: UseStorageOptions<T>
): UseStorageReturn<T> {
  const [value, setValue] = useState<T | null>(options?.defaultValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const storageRef = useRef(storage);
  const keyRef = useRef(key);

  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = await storageRef.current.get<T>(keyRef.current);

      if (!mountedRef.current) return;

      if (stored !== null) {
        setValue(stored);
      } else if (options?.defaultValue !== undefined) {
        setValue(options.defaultValue);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [options?.defaultValue]);

  useEffect(() => {
    load();
  }, [key, load]);

  const set = useCallback(
    async (newValue: T) => {
      try {
        setError(null);
        await storageRef.current.set(keyRef.current, newValue, options?.ttl);
        if (mountedRef.current) {
          setValue(newValue);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
        }
        throw err;
      }
    },
    [options?.ttl]
  );

  const remove = useCallback(async () => {
    try {
      setError(null);
      await storageRef.current.remove(keyRef.current);
      if (mountedRef.current) {
        setValue(options?.defaultValue ?? null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
      throw err;
    }
  }, [options?.defaultValue]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { value, loading, error, set, remove, refresh };
}
