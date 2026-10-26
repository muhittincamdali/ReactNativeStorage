import { StorageError } from './errors';

/** Longest key name, in UTF-16 code units, before the namespace is added. */
export const MAX_KEY_LENGTH = 512;
/** Longest namespace, in characters. */
export const MAX_NAMESPACE_LENGTH = 64;
/** Default limit for one encoded value: 1 MiB of UTF-8. */
export const DEFAULT_MAX_VALUE_BYTES = 1024 * 1024;
/** Highest schema version an item may declare; bounds the migration loop. */
export const MAX_SCHEMA_VERSION = 10_000;
/** Default number of keys whose stored text stays cached while nothing subscribes to them. */
export const DEFAULT_CACHE_SIZE = 500;
/** Separator between the namespace and the key name. */
export const NAMESPACE_SEPARATOR = ':';

const NAMESPACE_PATTERN = /^[A-Za-z0-9_.-]+$/;

/** C0 control characters (U+0000-U+001F) and DEL break log lines, file names and some backends. */
function hasControlCharacter(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit < 0x20 || unit === 0x7f) return true;
  }
  return false;
}

export function assertKeyName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || name.length === 0) {
    throw new StorageError('INVALID_KEY', 'A key must be a non-empty string');
  }
  if (name.length > MAX_KEY_LENGTH) {
    throw new StorageError('INVALID_KEY', `A key must be at most ${MAX_KEY_LENGTH} characters`);
  }
  if (hasControlCharacter(name)) {
    throw new StorageError('INVALID_KEY', 'A key must not contain control characters');
  }
}

export function assertNamespace(namespace: unknown): asserts namespace is string {
  if (
    typeof namespace !== 'string' ||
    namespace.length === 0 ||
    namespace.length > MAX_NAMESPACE_LENGTH ||
    !NAMESPACE_PATTERN.test(namespace)
  ) {
    throw new StorageError(
      'INVALID_KEY',
      `A namespace must be 1-${MAX_NAMESPACE_LENGTH} characters of A-Z, a-z, 0-9, ".", "_" or "-"`,
    );
  }
}

/** Accepts a whole number in `[min, max]`; rejects `NaN`, infinities, fractions and strings. */
export function assertInteger(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new StorageError(
      'INVALID_OPTION',
      `${name} must be a whole number from ${min} to ${max}`,
    );
  }
  return value;
}

/** Accepts a TTL in milliseconds: finite, positive and small enough to add to the clock safely. */
export function assertTtl(ttl: unknown, now: number): number {
  if (typeof ttl !== 'number' || !Number.isFinite(ttl) || ttl <= 0) {
    throw new StorageError('INVALID_OPTION', 'ttl must be a finite number of milliseconds above 0');
  }
  const expiresAt = Math.ceil(now + ttl);
  if (!Number.isSafeInteger(expiresAt)) {
    throw new StorageError('INVALID_OPTION', 'ttl is too large');
  }
  return expiresAt;
}
