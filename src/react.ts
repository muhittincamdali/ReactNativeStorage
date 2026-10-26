/**
 * The React hook. Import it from `react-native-storage-toolkit/react`.
 *
 * @module react-native-storage-toolkit/react
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { StorageError } from './errors';
import type { SetOptions, StorageItem } from './item';

export interface StorageItemState {
  /** `loading` until an asynchronous driver answers; `error` when the value could not be read. */
  status: 'loading' | 'ready' | 'error';
  error: StorageError | undefined;
  /** When the value expires, in milliseconds since the epoch. */
  expiresAt: number | undefined;
  /** Deletes the stored value. */
  remove: () => Promise<void>;
  /** Reads the value again, for example after a failed read. */
  reload: () => Promise<void>;
}

export type SetStorageValue<T> = (
  value: T | ((current: T) => T),
  options?: SetOptions,
) => Promise<void>;

/**
 * Reads an item and re-renders when it changes, from this component, another component or,
 * for drivers that report it, outside the app's JavaScript.
 *
 * With a synchronous driver (MMKV, `localStorage`, memory) the stored value is there on the
 * first render. With an asynchronous one (AsyncStorage, SecureStore) the first render has the
 * default value and `status: 'loading'`.
 *
 * ```tsx
 * const [theme, setTheme] = useStorageItem(themeItem);
 * ```
 */
export function useStorageItem<T>(
  item: StorageItem<T>,
): [value: T, setValue: SetStorageValue<T>, state: StorageItemState] {
  const snapshot = useSyncExternalStore(item.subscribe, item.getSnapshot, item.getSnapshot);

  // Reading through the item (not only the snapshot) also saves a migrated value and removes an
  // expired one. It runs on mount and again whenever the item goes back to loading.
  const loading = snapshot.status === 'loading';
  useEffect(() => {
    void item.load();
  }, [item, loading]);

  const setValue = useCallback<SetStorageValue<T>>(
    (value, options) => item.set(value, options),
    [item],
  );

  const state = useMemo<StorageItemState>(
    () => ({
      status: snapshot.status,
      error: snapshot.error,
      expiresAt: snapshot.expiresAt,
      remove: () => item.remove(),
      reload: () => item.load(),
    }),
    [item, snapshot],
  );

  return [snapshot.value, setValue, state];
}
