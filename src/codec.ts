import { StorageError } from './errors';

/**
 * Values that survive a round trip through storage unchanged.
 *
 * JSON alone turns `NaN` into `null`, drops `undefined`, flattens a `Date` to a string and a
 * `Map` to `{}`. The codec tags those values instead, so what you read back has the same type
 * as what you wrote.
 */
export type StorableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | Date
  | StorableValue[]
  | Map<StorableValue, StorableValue>
  | Set<StorableValue>
  | { [key: string]: StorableValue };

/** Deepest nesting the codec accepts, in both directions. Deeper input is refused, not recursed. */
export const MAX_DEPTH = 64;

const TAG = '$t';

type Tagged = { [TAG]: string; v?: unknown };

/**
 * Where the encoder is, as a chain from the innermost part to the root. Built only into an array
 * when something fails, so encoding a valid value allocates no path.
 */
type Path = { readonly parent: Path; readonly part: PropertyKey } | undefined;

function partsOf(path: Path): PropertyKey[] {
  const parts: PropertyKey[] = [];
  for (let node = path; node !== undefined; node = node.parent) parts.unshift(node.part);
  return parts;
}

/**
 * The message has no path: property names belong to the value and can be data (an object keyed
 * by email address). The path is in `issues`, like a schema's.
 */
function fail(message: string, path: Path): never {
  throw new StorageError('UNSERIALIZABLE', message, { issues: [{ message, path: partsOf(path) }] });
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function encodeNumber(value: number): unknown {
  if (Number.isNaN(value)) return { [TAG]: 'num', v: 'NaN' };
  if (value === Infinity) return { [TAG]: 'num', v: 'Infinity' };
  if (value === -Infinity) return { [TAG]: 'num', v: '-Infinity' };
  if (Object.is(value, -0)) return { [TAG]: 'num', v: '-0' };
  return value;
}

function encodeNode(value: unknown, path: Path, depth: number, seen: Set<object>): unknown {
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number':
      return encodeNumber(value);
    case 'undefined':
      return { [TAG]: 'undef' };
    case 'bigint':
      return { [TAG]: 'bigint', v: value.toString() };
    case 'function':
    case 'symbol':
      return fail(`A ${typeof value} cannot be stored`, path);
  }
  if (value === null) return null;
  if (depth >= MAX_DEPTH) fail(`Nesting deeper than ${MAX_DEPTH} levels`, path);
  const object = value as object;
  if (seen.has(object)) fail('A circular reference cannot be stored', path);
  seen.add(object);
  try {
    return encodeObject(object, path, depth + 1, seen);
  } finally {
    seen.delete(object);
  }
}

function encodeObject(object: object, path: Path, depth: number, seen: Set<object>): unknown {
  if (Array.isArray(object)) {
    const items: unknown[] = [];
    for (let index = 0; index < object.length; index += 1) {
      items.push(encodeNode(object[index], { parent: path, part: index }, depth, seen));
    }
    return items;
  }
  if (object instanceof Date) {
    if (Number.isNaN(object.getTime())) fail('An invalid Date cannot be stored', path);
    return { [TAG]: 'date', v: object.toISOString() };
  }
  if (object instanceof Map) {
    const entries: unknown[] = [];
    let index = 0;
    for (const [key, entry] of object) {
      entries.push([
        encodeNode(key, { parent: path, part: `<map key ${index}>` }, depth, seen),
        encodeNode(entry, { parent: path, part: `<map value ${index}>` }, depth, seen),
      ]);
      index += 1;
    }
    return { [TAG]: 'map', v: entries };
  }
  if (object instanceof Set) {
    const items: unknown[] = [];
    let index = 0;
    for (const item of object) {
      items.push(encodeNode(item, { parent: path, part: `<set item ${index}>` }, depth, seen));
      index += 1;
    }
    return { [TAG]: 'set', v: items };
  }
  if (!isPlainObject(object)) {
    const name = object.constructor?.name ?? 'object';
    fail(`A ${name} instance cannot be stored; convert it to a plain object`, path);
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(object)) {
    defineOwn(result, key, encodeNode(object[key], { parent: path, part: key }, depth, seen));
  }
  // A user object that happens to own the tag key is wrapped, so it is never read as a tag.
  return Object.hasOwn(object, TAG) ? { [TAG]: 'obj', v: result } : result;
}

/** Sets an own property, also for `__proto__`, without touching the prototype chain. */
function defineOwn(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/** Converts a value into JSON-compatible data. Throws `UNSERIALIZABLE` for anything else. */
export function encodeValue(value: unknown): unknown {
  return encodeNode(value, undefined, 0, new Set());
}

function corrupt(message: string): never {
  throw new StorageError('CORRUPT_DATA', message);
}

function decodeTagged(node: Tagged, depth: number): unknown {
  const payload = node.v;
  switch (node[TAG]) {
    case 'undef':
      return undefined;
    case 'num':
      if (payload === 'NaN') return NaN;
      if (payload === 'Infinity') return Infinity;
      if (payload === '-Infinity') return -Infinity;
      if (payload === '-0') return -0;
      return corrupt('Unknown number tag');
    case 'bigint':
      if (typeof payload !== 'string' || !/^-?\d{1,4096}$/.test(payload)) corrupt('Bad bigint');
      return BigInt(payload);
    case 'date': {
      const time = typeof payload === 'string' ? Date.parse(payload) : NaN;
      if (Number.isNaN(time)) corrupt('Bad date');
      return new Date(time);
    }
    case 'map': {
      if (!Array.isArray(payload)) corrupt('Bad map');
      const map = new Map<unknown, unknown>();
      for (const entry of payload) {
        if (!Array.isArray(entry) || entry.length !== 2) corrupt('Bad map entry');
        map.set(decodeNode(entry[0], depth), decodeNode(entry[1], depth));
      }
      return map;
    }
    case 'set':
      if (!Array.isArray(payload)) corrupt('Bad set');
      return new Set(payload.map((item) => decodeNode(item, depth)));
    case 'obj':
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        corrupt('Bad escaped object');
      }
      return decodePlain(payload as Record<string, unknown>, depth);
    default:
      return corrupt('Unknown tag');
  }
}

function decodePlain(node: Record<string, unknown>, depth: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(node)) defineOwn(result, key, decodeNode(node[key], depth));
  return result;
}

function decodeNode(node: unknown, depth: number): unknown {
  if (node === null || typeof node !== 'object') return node;
  if (depth >= MAX_DEPTH) corrupt(`Nesting deeper than ${MAX_DEPTH} levels`);
  if (Array.isArray(node)) return node.map((item) => decodeNode(item, depth + 1));
  const record = node as Record<string, unknown>;
  if (Object.hasOwn(record, TAG)) {
    if (typeof record[TAG] !== 'string') corrupt('Bad tag');
    return decodeTagged(record as Tagged, depth + 1);
  }
  return decodePlain(record, depth + 1);
}

/** Reverses {@link encodeValue}. Throws `CORRUPT_DATA` for input it did not produce. */
export function decodeValue(data: unknown): unknown {
  return decodeNode(data, 0);
}

/**
 * Number of bytes `text` takes as UTF-8, counted without allocating. A lone surrogate counts
 * as three bytes, the size of the replacement character an encoder writes for it.
 */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    if (unit < 0x80) bytes += 1;
    else if (unit < 0x800) bytes += 2;
    else if (unit >= 0xd800 && unit <= 0xdbff && index + 1 < text.length) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}
