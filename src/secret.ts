import { StorageError } from './errors';
import type { StorageItem } from './item';
import { assertInteger } from './validation';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
/** Bytes at or above this value are dropped, so every character is equally likely. */
const UNBIASED_LIMIT = 256 - (256 % ALPHABET.length);
/** Random batches requested before giving up; a working source needs one or two. */
const MAX_BATCHES = 64;

export type RandomBytes = (bytes: Uint8Array) => Uint8Array;

export interface SecretOptions {
  /** Characters in the secret, from 16 to 256. Default 32 (about 190 bits). */
  length?: number;
  /**
   * Fills an array with cryptographically secure random bytes. Default:
   * `globalThis.crypto.getRandomValues`, which React Native provides through `expo-crypto` or
   * `react-native-get-random-values`.
   */
  getRandomValues?: RandomBytes;
}

function defaultRandom(): RandomBytes {
  const crypto = (globalThis as { crypto?: { getRandomValues?: RandomBytes } }).crypto;
  const getRandomValues = crypto?.getRandomValues;
  if (typeof getRandomValues !== 'function') {
    throw new StorageError(
      'UNSUPPORTED',
      'No crypto.getRandomValues; install react-native-get-random-values or pass getRandomValues',
    );
  }
  return (bytes) => getRandomValues.call(crypto, bytes);
}

/** A random string of `length` characters from A-Z, a-z and 0-9, without modulo bias. */
export function randomSecret(options: SecretOptions = {}): string {
  const length = assertInteger(options.length ?? 32, 'length', 16, 256);
  const random = options.getRandomValues ?? defaultRandom();
  let secret = '';
  for (let batch = 0; batch < MAX_BATCHES && secret.length < length; batch += 1) {
    const bytes = random(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte >= UNBIASED_LIMIT) continue;
      secret += ALPHABET[byte % ALPHABET.length];
      if (secret.length === length) break;
    }
  }
  if (secret.length < length) {
    throw new StorageError('UNSUPPORTED', 'The random source returned too few usable bytes');
  }
  return secret;
}

const inFlight = new WeakMap<object, Promise<string>>();

/**
 * Returns the secret stored in `item`, creating and saving a random one the first time. Use it
 * with a SecureStore-backed item to keep, for example, the encryption key of an MMKV instance.
 * Calls made while the first one is still running share its result, so two parts of the app
 * starting at once never end up with different keys.
 */
export function getOrCreateSecret(
  item: StorageItem<string | undefined>,
  options: SecretOptions = {},
): Promise<string> {
  const running = inFlight.get(item);
  if (running) return running;
  const task = (async () => {
    const existing = await item.get();
    if (typeof existing === 'string' && existing.length > 0) return existing;
    const secret = randomSecret(options);
    await item.set(secret);
    return secret;
  })();
  inFlight.set(item, task);
  const forget = () => {
    if (inFlight.get(item) === task) inFlight.delete(item);
  };
  task.then(forget, forget);
  return task;
}
