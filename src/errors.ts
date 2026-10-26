/**
 * Why an operation failed.
 *
 * - `INVALID_KEY`: the key or namespace is empty, too long or contains a control character.
 * - `INVALID_OPTION`: an option is out of range, for example a TTL of `NaN` or a version of `1.5`.
 * - `VALUE_TOO_LARGE`: the encoded value is larger than `maxValueBytes`.
 * - `UNSERIALIZABLE`: the value contains something that cannot be stored, such as a function,
 *   a class instance, a circular reference or an invalid `Date`.
 * - `VALIDATION_FAILED`: the schema rejected the value.
 * - `CORRUPT_DATA`: the stored text is not a record this library wrote and no `legacy` reader
 *   accepted it.
 * - `INCOMPATIBLE_VERSION`: the stored record was written by a newer schema version, or a
 *   migration step is missing.
 * - `EXPIRED`: `getOrCreateSecret` found a stored secret whose lifetime has passed; it is left
 *   in place rather than replaced.
 * - `UNSUPPORTED`: the driver cannot do this, for example list keys.
 * - `DRIVER_ERROR`: the underlying storage threw; the original error is in `cause`.
 */
export type StorageErrorCode =
  | 'INVALID_KEY'
  | 'INVALID_OPTION'
  | 'VALUE_TOO_LARGE'
  | 'UNSERIALIZABLE'
  | 'VALIDATION_FAILED'
  | 'CORRUPT_DATA'
  | 'INCOMPATIBLE_VERSION'
  | 'EXPIRED'
  | 'UNSUPPORTED'
  | 'DRIVER_ERROR';

/** One problem a schema reported. Its `message` comes from the schema library. */
export interface ValidationIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
}

/** Extra details for a {@link StorageError}. */
export interface StorageErrorOptions {
  key?: string | undefined;
  cause?: unknown;
  issues?: readonly ValidationIssue[];
}

/**
 * The only error type this library throws or reports.
 *
 * `message` names the key, the reason and, for schema failures, the path of the first issue. It
 * never contains the stored value, so an error can be logged without leaking what was being
 * saved. Schema messages can quote the value (some libraries write "received 'abc'"), so they are
 * kept apart in `issues`.
 */
export class StorageError extends Error {
  readonly code: StorageErrorCode;
  /** The key the operation was about, without the namespace. */
  readonly key: string | undefined;
  /** For `VALIDATION_FAILED`: the issues the schema reported. */
  readonly issues: readonly ValidationIssue[] | undefined;

  constructor(code: StorageErrorCode, message: string, options: StorageErrorOptions = {}) {
    super(message);
    // Set directly: not every JavaScript engine React Native runs on reads the `cause` option.
    if (options.cause !== undefined) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        configurable: true,
        writable: true,
      });
    }
    this.name = 'StorageError';
    this.code = code;
    this.key = options.key;
    this.issues = options.issues;
  }
}

/** True when `error` is a {@link StorageError}, optionally with the given code. */
export function isStorageError(error: unknown, code?: StorageErrorCode): error is StorageError {
  return error instanceof StorageError && (code === undefined || error.code === code);
}

/** Copies an error that carried no key, adding the key. */
export function withKey(error: unknown, key: string): unknown {
  if (!(error instanceof StorageError) || error.key !== undefined) return error;
  const keyed = new StorageError(error.code, `${error.message} (key "${key}")`, {
    key,
    cause: (error as { cause?: unknown }).cause,
    ...(error.issues ? { issues: error.issues } : {}),
  });
  return keyed;
}
