import { describe, expect, it } from 'vitest';
import { MAX_DEPTH, decodeValue, encodeValue, utf8ByteLength } from '../src/codec';
import { isStorageError, type StorageError } from '../src/errors';

const roundTrip = (value: unknown): unknown =>
  decodeValue(JSON.parse(JSON.stringify(encodeValue(value))));

function nested(depth: number): unknown {
  let value: unknown = 'leaf';
  for (let level = 0; level < depth; level += 1) value = [value];
  return value;
}

describe('encodeValue / decodeValue', () => {
  it('keeps the values JSON loses or changes', () => {
    const value = {
      date: new Date('2026-10-26T08:30:00.000Z'),
      map: new Map<unknown, unknown>([
        ['a', 1],
        [2, new Set(['x'])],
      ]),
      set: new Set([1, 2, 3]),
      big: 12345678901234567890n,
      numbers: [NaN, Infinity, -Infinity, -0, 0, 1.5],
      missing: undefined,
      list: [1, undefined, 3],
    };
    const result = roundTrip(value) as typeof value;
    expect(result).toEqual(value);
    expect(result.date).toBeInstanceOf(Date);
    expect(Object.is(result.numbers[3], -0)).toBe(true);
    expect(Object.is(result.numbers[4], 0)).toBe(true);
    expect('missing' in result).toBe(true);
    expect(result.list).toHaveLength(3);
  });

  it('keeps a user object that owns the tag key as data', () => {
    const value = { $t: 'date', v: 'not a date', other: [{ $t: 'num' }] };
    expect(roundTrip(value)).toEqual(value);
  });

  it('allows the same object twice when it is not circular', () => {
    const shared = { id: 1 };
    expect(roundTrip([shared, shared])).toEqual([{ id: 1 }, { id: 1 }]);
  });

  it('keeps an own __proto__ key without touching any prototype', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true},"name":"a"}') as object;
    const result = roundTrip(value) as Record<string, unknown>;
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect((result as { polluted?: unknown }).polluted).toBeUndefined();
  });

  function unserializable(value: unknown) {
    let caught: unknown;
    try {
      encodeValue(value);
    } catch (error) {
      caught = error;
    }
    expect(isStorageError(caught, 'UNSERIALIZABLE')).toBe(true);
    return caught as StorageError;
  }

  it.each<[string, unknown, string, PropertyKey[]]>([
    ['a function', { run: () => 1 }, 'A function cannot be stored', ['run']],
    ['a symbol', [Symbol('s')], 'A symbol cannot be stored', [0]],
    [
      'a class instance',
      {
        when: new (class Point {
          x = 1;
        })(),
      },
      'Point',
      ['when'],
    ],
    ['an invalid Date', { when: new Date(NaN) }, 'invalid Date', ['when']],
    ['a RegExp', /x/, 'RegExp', []],
    ['a Map value', new Map([['k', () => 1]]), 'function', ['<map value 0>']],
    ['a Set item', new Set([1, () => 1]), 'function', ['<set item 1>']],
  ])('refuses %s and says where it is in issues', (_label, value, fragment, path) => {
    const error = unserializable(value);
    expect(error.message).toContain(fragment);
    expect(error.issues).toEqual([{ message: error.message, path }]);
  });

  it('keeps property names, which can be data, out of the message', () => {
    const error = unserializable({ users: { 'user@x.com': { save: () => 1 } } });
    expect(error.message).toBe('A function cannot be stored');
    expect(error.message).not.toContain('user@x.com');
    expect(error.issues?.[0]?.path).toEqual(['users', 'user@x.com', 'save']);
  });

  it('refuses circular references instead of overflowing the stack', () => {
    const value: Record<string, unknown> = { name: 'loop' };
    value['self'] = value;
    const error = unserializable(value);
    expect(error.message).toBe('A circular reference cannot be stored');
    expect(error.issues?.[0]?.path).toEqual(['self']);
  });

  it(`accepts ${MAX_DEPTH} levels of nesting and refuses more`, () => {
    expect(roundTrip(nested(MAX_DEPTH))).toEqual(nested(MAX_DEPTH));
    expect(() => encodeValue(nested(MAX_DEPTH + 1))).toThrow(/Nesting deeper/);
    expect(() => encodeValue(nested(100_000))).toThrow(/Nesting deeper/);
  });

  it('reports crafted deep input as corrupt data, not a crash', () => {
    const deep = `${'['.repeat(5_000)}1${']'.repeat(5_000)}`;
    let caught: unknown;
    try {
      decodeValue(JSON.parse(deep));
    } catch (error) {
      caught = error;
    }
    expect(isStorageError(caught, 'CORRUPT_DATA')).toBe(true);
  });

  it.each([
    [{ $t: 'unknown' }],
    [{ $t: 7 }],
    [{ $t: 'num', v: '12' }],
    [{ $t: 'bigint', v: '1'.repeat(5_000) }],
    [{ $t: 'bigint', v: '1e3' }],
    [{ $t: 'date', v: 'yesterday' }],
    [{ $t: 'map', v: [[1]] }],
    [{ $t: 'map', v: 'x' }],
    [{ $t: 'set', v: {} }],
    [{ $t: 'obj', v: [] }],
  ])('rejects malformed tag %j', (data) => {
    expect(() => decodeValue(data)).toThrow(expect.objectContaining({ code: 'CORRUPT_DATA' }));
  });
});

describe('utf8ByteLength', () => {
  it.each([
    ['', 0],
    ['abc', 3],
    ['ç', 2],
    ['€', 3],
    ['😀', 4],
    ['\ud800', 3],
    ['\udc00x', 4],
    ['a\ud83d', 4],
  ])('counts %j as %i bytes', (text, bytes) => {
    expect(utf8ByteLength(text)).toBe(bytes);
  });

  it('matches Buffer.byteLength on random text, lone surrogates included', () => {
    let seed = 7;
    const next = () => {
      seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31;
      return seed;
    };
    for (let round = 0; round < 500; round += 1) {
      let text = '';
      for (let index = 0; index < 20; index += 1) text += String.fromCharCode(next() % 0x10000);
      expect(utf8ByteLength(text)).toBe(Buffer.byteLength(text, 'utf8'));
    }
  });
});
