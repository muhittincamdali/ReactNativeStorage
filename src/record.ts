import { utf8ByteLength } from './codec';
import { parseRecord, readEnvelopeValue, writeEnvelope } from './envelope';
import { StorageError, withKey } from './errors';
import { type Schema, type Validate, toValidator } from './schema';
import { MAX_SCHEMA_VERSION, assertInteger } from './validation';

/** A step that turns a value stored at version `n - 1` into one for version `n`. */
export type Migration = (previous: unknown) => unknown;

export interface RecordOptions<T> {
  schema?: Schema<T> | undefined;
  version?: number | undefined;
  migrations?: Readonly<Record<number, Migration>> | undefined;
  legacy?: ((raw: string) => unknown) | undefined;
}

/** Stored text, read back. */
export type Decoded<T> =
  | { kind: 'missing' }
  | { kind: 'value'; value: T; expiresAt: number | undefined; rewrite: boolean }
  | { kind: 'error'; error: StorageError };

function checkMigrations(
  migrations: Readonly<Record<number, Migration>>,
  version: number,
): Readonly<Record<number, Migration>> {
  for (const [step, migration] of Object.entries(migrations)) {
    const number = Number(step);
    if (
      !Number.isSafeInteger(number) ||
      String(number) !== step ||
      number < 2 ||
      number > version
    ) {
      throw new StorageError(
        'INVALID_OPTION',
        `migrations has a step ${step} outside 2...${version}`,
      );
    }
    if (typeof migration !== 'function') {
      throw new StorageError('INVALID_OPTION', `migrations[${step}] must be a function`);
    }
  }
  return migrations;
}

/**
 * How one item turns values into stored text and back: validation, schema versions,
 * migrations, legacy text and the size limit. Pure: it never touches the driver.
 */
export class RecordFormat<T> {
  readonly version: number;
  private readonly check: Validate<T>;
  private readonly migrations: Readonly<Record<number, Migration>>;
  private readonly legacy: ((raw: string) => unknown) | undefined;

  constructor(
    private readonly name: string,
    options: RecordOptions<T>,
    private readonly maxValueBytes: number,
  ) {
    this.check = toValidator(options.schema);
    this.version =
      options.version === undefined
        ? 1
        : assertInteger(options.version, 'version', 1, MAX_SCHEMA_VERSION);
    this.migrations = checkMigrations(options.migrations ?? {}, this.version);
    this.legacy = options.legacy;
  }

  /** Throws `VALIDATION_FAILED` when the schema rejects `value`. */
  validate(value: unknown): T {
    return this.check(value, this.name);
  }

  /** Throws `UNSERIALIZABLE` or `VALUE_TOO_LARGE`. */
  encode(value: T, expiresAt: number | undefined): string {
    let raw: string;
    try {
      raw = writeEnvelope(value, this.version, expiresAt);
    } catch (error) {
      throw withKey(error, this.name);
    }
    if (utf8ByteLength(raw) > this.maxValueBytes) throw this.tooLarge();
    return raw;
  }

  /** Never throws: unreadable text comes back as `{ kind: 'error' }`. */
  decode(raw: string | null): Decoded<T> {
    if (raw === null) return { kind: 'missing' };
    try {
      // UTF-16 length never exceeds UTF-8 length, so this skips parsing oversized text cheaply.
      if (raw.length > this.maxValueBytes) throw this.tooLarge();
      const parsed = parseRecord(raw);
      if (parsed.kind === 'foreign') return this.decodeForeign(raw);
      const { envelope } = parsed;
      if (envelope.version > this.version) {
        throw new StorageError(
          'INCOMPATIBLE_VERSION',
          `Stored "${this.name}" has version ${envelope.version}, newer than ${this.version}`,
        );
      }
      let value = readEnvelopeValue(envelope);
      for (let step = envelope.version + 1; step <= this.version; step += 1) {
        value = this.migrate(step, value);
      }
      return {
        kind: 'value',
        value: this.validate(value),
        expiresAt: envelope.expiresAt,
        rewrite: envelope.version !== this.version,
      };
    } catch (error) {
      return { kind: 'error', error: withKey(error, this.name) as StorageError };
    }
  }

  private decodeForeign(raw: string): Decoded<T> {
    if (!this.legacy) {
      throw new StorageError(
        'CORRUPT_DATA',
        `Stored "${this.name}" was not written by this library`,
      );
    }
    let value: unknown;
    try {
      value = this.legacy(raw);
    } catch (cause) {
      throw new StorageError('CORRUPT_DATA', `The legacy reader rejected "${this.name}"`, {
        cause,
      });
    }
    return { kind: 'value', value: this.validate(value), expiresAt: undefined, rewrite: true };
  }

  private migrate(step: number, value: unknown): unknown {
    const migration = this.migrations[step];
    if (!migration) {
      throw new StorageError(
        'INCOMPATIBLE_VERSION',
        `No migration to version ${step} for "${this.name}"`,
      );
    }
    try {
      return migration(value);
    } catch (cause) {
      throw new StorageError(
        'INCOMPATIBLE_VERSION',
        `Migration to version ${step} failed for "${this.name}"`,
        { cause },
      );
    }
  }

  private tooLarge(): StorageError {
    return new StorageError(
      'VALUE_TOO_LARGE',
      `The value for "${this.name}" is larger than ${this.maxValueBytes} bytes`,
      { key: this.name },
    );
  }
}
