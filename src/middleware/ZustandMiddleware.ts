import { IStorage } from '../types';

type StateCreator<T> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T,
  api: StoreApi<T>
) => T;

type StoreApi<T> = {
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  getState: () => T;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  destroy: () => void;
};

interface PersistOptions<T> {
  name: string;
  storage: IStorage;
  partialize?: (state: T) => Partial<T>;
  merge?: (persisted: Partial<T>, current: T) => T;
  version?: number;
  migrate?: (persisted: Record<string, unknown>, version: number) => Partial<T>;
  debounceMs?: number;
  onRehydrateStorage?: (state: T) => ((state?: T, error?: Error) => void) | void;
}

export function createStoragePersist<T extends Record<string, unknown>>(
  options: PersistOptions<T>
) {
  const {
    name,
    storage,
    partialize = (state: T) => state,
    merge = (persisted, current) => ({ ...current, ...persisted }),
    version = 0,
    migrate,
    debounceMs = 100,
    onRehydrateStorage,
  } = options;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  return (config: StateCreator<T>) =>
    (
      set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
      get: () => T,
      api: StoreApi<T>
    ): T => {
      const postRehydrate = onRehydrateStorage?.(get());

      const persistState = async (state: T) => {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
          try {
            const partial = partialize(state);
            const wrapped = { state: partial, version };
            await storage.set(name, wrapped);
          } catch (err) {
            console.error(`[Persist] Failed to save state: ${(err as Error).message}`);
          }
        }, debounceMs);
      };

      const rehydrate = async () => {
        try {
          const stored = await storage.get<{ state: Partial<T>; version: number }>(name);

          if (stored) {
            let persistedState = stored.state;

            if (stored.version !== version && migrate) {
              persistedState = migrate(
                persistedState as Record<string, unknown>,
                stored.version
              );
            }

            const merged = merge(persistedState, get());
            set(merged as Partial<T>);
            postRehydrate?.(merged);
          } else {
            postRehydrate?.(get());
          }
        } catch (err) {
          postRehydrate?.(undefined, err as Error);
        }
      };

      const wrappedSet = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
        set(partial);
        persistState(get());
      };

      const initialState = config(wrappedSet, get, api);

      rehydrate();

      return initialState;
    };
}

export function clearPersistedState(storage: IStorage, name: string): Promise<void> {
  return storage.remove(name);
}
