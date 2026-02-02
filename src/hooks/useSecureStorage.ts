import { useState, useEffect, useCallback, useRef } from 'react';
import { BiometricStorage } from '../encryption/BiometricStorage';

interface UseSecureStorageReturn<T> {
  value: T | null;
  loading: boolean;
  error: Error | null;
  authenticated: boolean;
  set: (newValue: T) => Promise<void>;
  remove: () => Promise<void>;
  authenticate: () => Promise<boolean>;
}

export function useSecureStorage<T>(
  biometricStorage: BiometricStorage,
  key: string
): UseSecureStorageReturn<T> {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await biometricStorage.authenticate();
      if (mountedRef.current) {
        setAuthenticated(result.success);
      }
      return result.success;
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        setAuthenticated(false);
      }
      return false;
    }
  }, [biometricStorage]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await biometricStorage.get<T>(key);
      if (mountedRef.current) {
        setValue(stored);
        setAuthenticated(true);
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
  }, [biometricStorage, key]);

  useEffect(() => {
    if (biometricStorage.isAuthenticated()) {
      load();
    } else {
      setLoading(false);
    }
  }, [load, biometricStorage]);

  const set = useCallback(
    async (newValue: T) => {
      try {
        await biometricStorage.set(key, newValue);
        if (mountedRef.current) setValue(newValue);
      } catch (err) {
        if (mountedRef.current) setError(err as Error);
        throw err;
      }
    },
    [biometricStorage, key]
  );

  const remove = useCallback(async () => {
    try {
      await biometricStorage.remove(key);
      if (mountedRef.current) setValue(null);
    } catch (err) {
      if (mountedRef.current) setError(err as Error);
      throw err;
    }
  }, [biometricStorage, key]);

  return { value, loading, error, authenticated, set, remove, authenticate };
}
