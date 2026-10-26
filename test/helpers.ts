import type { AsyncStorageDriver } from '../src/index';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

export interface PendingCall {
  method: 'getItem' | 'setItem' | 'removeItem';
  key: string;
  value?: string;
  resolve: (value?: string | null) => void;
  reject: (error: unknown) => void;
}

/**
 * An asynchronous driver whose calls stay pending until the test settles them, so tests can
 * finish them in any order. `data` is what has actually been written.
 */
export function manualDriver(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const calls: PendingCall[] = [];
  const track = <T>(
    call: Omit<PendingCall, 'resolve' | 'reject'>,
    apply: (value?: string | null) => T,
  ) => {
    const { promise, resolve, reject } = deferred<T>();
    calls.push({ ...call, resolve: (value) => resolve(apply(value)), reject });
    return promise;
  };
  const driver: AsyncStorageDriver = {
    name: 'manual',
    sync: false,
    getItem: (key) =>
      track({ method: 'getItem', key }, (value) =>
        value === undefined ? (data.get(key) ?? null) : value,
      ),
    setItem: (key, value) =>
      track({ method: 'setItem', key, value }, () => {
        data.set(key, value);
      }),
    removeItem: (key) =>
      track({ method: 'removeItem', key }, () => {
        data.delete(key);
      }),
    getAllKeys: () => [...data.keys()],
  };
  return { driver, data, calls };
}

/** Lets pending promise callbacks run. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
