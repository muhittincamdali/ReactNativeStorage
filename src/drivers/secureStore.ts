import type { AsyncStorageDriver } from '../driver';

/** The part of `expo-secure-store` the driver uses. */
export interface SecureStoreLike<Options = unknown> {
  getItemAsync(key: string, options?: Options): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: Options): Promise<void>;
  deleteItemAsync(key: string, options?: Options): Promise<void>;
}

/**
 * The largest value expo-secure-store accepts reliably. Its documentation warns that larger
 * values may be rejected on some platforms, so the storage refuses them up front.
 */
export const SECURE_STORE_MAX_VALUE_BYTES = 2048;

const SAFE_CHARACTER = /^[A-Za-z0-9.-]$/;

/**
 * SecureStore keys may only contain `A-Z a-z 0-9 . - _`. Other characters (the `:` after a
 * namespace, spaces, non-Latin letters) are written as `_<hex code point>_`, and `_` itself as
 * `__`, so two different keys never map to the same SecureStore key.
 */
export function encodeSecureStoreKey(key: string): string {
  let encoded = '';
  for (const character of key) {
    if (SAFE_CHARACTER.test(character)) encoded += character;
    else if (character === '_') encoded += '__';
    else encoded += `_${character.codePointAt(0)!.toString(16)}_`;
  }
  return encoded;
}

/**
 * An asynchronous driver on top of `expo-secure-store` (Keychain on iOS, Keystore-backed
 * encrypted preferences on Android). Use it for tokens and keys, not for large data.
 *
 * SecureStore cannot list its keys, so `keys()` and `clear()` throw `UNSUPPORTED` on a storage
 * that uses this driver; remove each item instead.
 *
 * ```ts
 * import * as SecureStore from 'expo-secure-store';
 * const driver = secureStoreDriver(SecureStore, {
 *   keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
 * });
 * ```
 */
export function secureStoreDriver<Options>(
  secureStore: SecureStoreLike<Options>,
  options?: Options,
): AsyncStorageDriver {
  return {
    name: 'secure-store',
    sync: false,
    maxValueBytes: SECURE_STORE_MAX_VALUE_BYTES,
    getItem: (key) => secureStore.getItemAsync(encodeSecureStoreKey(key), options),
    setItem: (key, value) => secureStore.setItemAsync(encodeSecureStoreKey(key), value, options),
    removeItem: (key) => secureStore.deleteItemAsync(encodeSecureStoreKey(key), options),
  };
}
