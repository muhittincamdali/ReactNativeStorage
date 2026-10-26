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

/** Running calls per driver and full key, so items declared twice still share one call. */
const inFlight = new WeakMap<object, Map<string, Promise<string>>>();

async function readOrCreate(
  item: StorageItem<string | undefined>,
  options: SecretOptions,
): Promise<string> {
  const stored = await item.readStored();
  if (stored.kind === 'missing') {
    const secret = randomSecret(options);
    await item.set(secret);
    return secret;
  }
  if (stored.kind === 'error') throw stored.error;
  if (stored.expired) {
    throw new StorageError(
      'EXPIRED',
      `The secret "${item.name}" has expired; it is kept, remove it to create a new one`,
      { key: item.name },
    );
  }
  if (typeof stored.value !== 'string' || stored.value.length === 0) {
    throw new StorageError('CORRUPT_DATA', `The secret "${item.name}" is not a non-empty string`, {
      key: item.name,
    });
  }
  return stored.value;
}

/**
 * Returns the secret stored in `item`, creating and saving a random one when nothing is stored.
 * Use it with a SecureStore-backed item to keep, for example, the encryption key of an MMKV
 * instance.
 *
 * A new secret is written only when the key is empty. Anything else stored there is never
 * overwritten: unreadable or invalid data rejects with its read error (`CORRUPT_DATA`,
 * `VALIDATION_FAILED`, `INCOMPATIBLE_VERSION`, `DRIVER_ERROR`), a stored value that is not a
 * non-empty string with `CORRUPT_DATA`, and an expired one with `EXPIRED`. Calls made while
 * another call for the same driver and key is running share its result, so two parts of the app
 * starting at once never end up with different keys.
 */
export function getOrCreateSecret(
  item: StorageItem<string | undefined>,
  options: SecretOptions = {},
): Promise<string> {
  let running = inFlight.get(item.driver);
  if (!running) {
    running = new Map();
    inFlight.set(item.driver, running);
  }
  const calls = running;
  const existing = calls.get(item.key);
  if (existing) return existing;
  const task = readOrCreate(item, options);
  calls.set(item.key, task);
  const forget = () => {
    if (calls.get(item.key) === task) calls.delete(item.key);
  };
  task.then(forget, forget);
  return task;
}
