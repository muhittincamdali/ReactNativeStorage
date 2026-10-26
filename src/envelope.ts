import { decodeValue, encodeValue } from './codec';
import { StorageError } from './errors';

/**
 * What is written to the driver: a small JSON object around the encoded value.
 *
 * `rns` marks the record as ours (format 1), `s` is the item's schema version, `e` the expiry
 * time in milliseconds since the epoch (absent when the value never expires) and `d` the data.
 */
const FORMAT_KEY = 'rns';
const FORMAT = 1;

export interface Envelope {
  version: number;
  expiresAt: number | undefined;
  value: unknown;
}

/** Parsed stored text: one of ours, or text written by something else. */
export type ParsedRecord = { kind: 'envelope'; envelope: Envelope } | { kind: 'foreign' };

export function writeEnvelope(value: unknown, version: number, expiresAt?: number): string {
  const record: Record<string, unknown> = { [FORMAT_KEY]: FORMAT, s: version };
  if (expiresAt !== undefined) record['e'] = expiresAt;
  record['d'] = encodeValue(value);
  return JSON.stringify(record);
}

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Reads the outer record without decoding the value. Text that is not JSON, or JSON without
 * our marker, is `foreign`: it may be a value written before this library was adopted.
 */
export function parseRecord(raw: string): ParsedRecord {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { kind: 'foreign' };
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return { kind: 'foreign' };
  const record = json as Record<string, unknown>;
  if (record[FORMAT_KEY] === undefined) return { kind: 'foreign' };
  if (record[FORMAT_KEY] !== FORMAT) {
    throw new StorageError('INCOMPATIBLE_VERSION', 'Stored record uses an unknown format');
  }
  if (!isPositiveSafeInteger(record['s'])) {
    throw new StorageError('CORRUPT_DATA', 'Stored record has an invalid schema version');
  }
  if (record['e'] !== undefined && !isPositiveSafeInteger(record['e'])) {
    throw new StorageError('CORRUPT_DATA', 'Stored record has an invalid expiry time');
  }
  if (!Object.hasOwn(record, 'd')) {
    throw new StorageError('CORRUPT_DATA', 'Stored record has no data');
  }
  return {
    kind: 'envelope',
    envelope: {
      version: record['s'],
      expiresAt: record['e'] as number | undefined,
      value: record['d'],
    },
  };
}

/** Decodes the value of a parsed envelope. */
export function readEnvelopeValue(envelope: Envelope): unknown {
  return decodeValue(envelope.value);
}

/** The expiry time of stored text, or `undefined` when it has none or is not ours. */
export function peekExpiry(raw: string): number | undefined {
  try {
    const parsed = parseRecord(raw);
    return parsed.kind === 'envelope' ? parsed.envelope.expiresAt : undefined;
  } catch {
    return undefined;
  }
}
