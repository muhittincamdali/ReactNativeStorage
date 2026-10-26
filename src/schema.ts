import { StorageError, type ValidationIssue } from './errors';

/**
 * The Standard Schema v1 interface (https://standardschema.dev), implemented by Zod 3.24+,
 * Valibot 1, ArkType 2 and others. Declared here so the library depends on none of them.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
    ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}

/** The result of a Standard Schema `validate` call. */
export type StandardSchemaResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: readonly ValidationIssue[] };

/** A type guard, for when you do not use a schema library. */
export type TypeGuard<T> = (value: unknown) => value is T;

/** What an item accepts as `schema`. */
export type Schema<T> = StandardSchemaV1<unknown, T> | TypeGuard<T>;

/** Returns the (possibly transformed) value or throws `VALIDATION_FAILED`. */
export type Validate<T> = (value: unknown, key: string) => T;

function describePath(issue: ValidationIssue | undefined): string {
  if (!issue?.path || issue.path.length === 0) return '';
  const parts = issue.path.map((part) =>
    typeof part === 'object' && part !== null ? String(part.key) : String(part),
  );
  return ` at ${parts.join('.')}`;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

export function toValidator<T>(schema: Schema<T> | undefined): Validate<T> {
  if (schema === undefined) return (value) => value as T;
  if (typeof schema === 'function') {
    return (value, key) => {
      if (schema(value)) return value;
      throw new StorageError('VALIDATION_FAILED', `The value for "${key}" failed its type guard`, {
        key,
      });
    };
  }
  const standard = (schema as Partial<StandardSchemaV1>)['~standard'];
  if (standard === null || typeof standard !== 'object' || standard.version !== 1) {
    throw new StorageError('INVALID_OPTION', 'schema must be a Standard Schema v1 or a type guard');
  }
  return (value, key) => {
    const result = standard.validate(value);
    if (isPromiseLike(result)) {
      throw new StorageError(
        'INVALID_OPTION',
        `The schema for "${key}" is asynchronous; storage needs a synchronous schema`,
        { key },
      );
    }
    const settled = result as StandardSchemaResult<T>;
    if (settled.issues === undefined) return settled.value;
    throw new StorageError(
      'VALIDATION_FAILED',
      `The value for "${key}" is invalid${describePath(settled.issues[0])}`,
      { key, issues: settled.issues },
    );
  };
}
