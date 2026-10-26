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

  useEffect(() => {
    if (snapshot.status === 'loading') void item.load();
  }, [item, snapshot.status]);

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
