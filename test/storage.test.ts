import * as v from 'valibot';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  MAX_KEY_LENGTH,
  StorageError,
  createStorage,
  isStorageError,
  memoryDriver,
  type StorageErrorCode,
} from '../src/index';

async function rejection(promise: Promise<unknown>): Promise<StorageError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof StorageError) return error;
    throw error;
  }
  throw new Error('expected a rejection');
}

function thrown(run: () => unknown): StorageError {
  try {
    run();
  } catch (error) {
    if (error instanceof StorageError) return error;
    throw error;
  }
  throw new Error('expected an error');
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('items', () => {
  it('returns the default value until something is stored, then the stored value', async () => {
    const storage = createStorage({ driver: memoryDriver() });
    const theme = storage.item('theme', { defaultValue: 'light' as 'light' | 'dark' });
    expect(await theme.get()).toBe('light');
    await theme.set('dark');
    expect(await theme.get()).toBe('dark');
    await theme.remove();
    expect(await theme.get()).toBe('light');
  });

  it('returns undefined without a default value', async () => {
    const storage = createStorage({ driver: memoryDriver() });
    expect(await storage.item<number>('count').get()).toBeUndefined();
  });

  it('prefixes keys with the namespace and lists and clears only its own keys', async () => {
    const driver = memoryDriver([['other', 'kept']]);
    const app = createStorage({ driver, namespace: 'app' });
    const user = createStorage({ driver, namespace: 'user.42' });
    await app.item('a').set(1);
    await app.item('b').set(2);
    await user.item('a').set(3);
    expect([...driver.data.keys()].sort()).toEqual(['app:a', 'app:b', 'other', 'user.42:a']);
    expect((await app.keys()).sort()).toEqual(['a', 'b']);
    expect(await app.clear()).toBe(2);
    expect([...driver.data.keys()].sort()).toEqual(['other', 'user.42:a']);
    expect(await user.item('a').get()).toBe(3);
  });

  it('applies an updater to the current value', async () => {
    const storage = createStorage({ driver: memoryDriver() });
    const count = storage.item('count', { defaultValue: 0 });
    await count.set((current) => current + 1);
    await count.set((current) => current + 1);
    expect(await count.get()).toBe(2);
  });

  it('shares state between two items with the same name', async () => {
    const storage = createStorage({ driver: memoryDriver() });
    const first = storage.item('name', { defaultValue: '' });
    const second = storage.item('name', { defaultValue: '' });
    const listener = vi.fn();
    second.subscribe(listener);
    await first.set('Ada');
    expect(second.getSnapshot().value).toBe('Ada');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('input checks', () => {
  const storage = createStorage({ driver: memoryDriver() });

  it.each([
    ['an empty key', ''],
    ['a key that is too long', 'k'.repeat(MAX_KEY_LENGTH + 1)],
    ['a newline', 'a\nb'],
    ['a NUL character', 'a\u0000b'],
    ['DEL', 'a\u007fb'],
  ])('refuses %s', (_label, name) => {
    expect(thrown(() => storage.item(name)).code).toBe('INVALID_KEY');
  });

  it('accepts a key of exactly the maximum length and any Unicode text', async () => {
    await storage.item('k'.repeat(MAX_KEY_LENGTH)).set(1);
    await storage.item('kullanıcı/ayarlar 🙂').set(2);
    expect(await storage.item('kullanıcı/ayarlar 🙂').get()).toBe(2);
  });

  it.each(['', 'has space', 'a:b', 'x'.repeat(65)])('refuses the namespace %j', (namespace) => {
    expect(thrown(() => createStorage({ driver: memoryDriver(), namespace })).code).toBe(
      'INVALID_KEY',
    );
  });

  it.each<[string, () => unknown]>([
    ['maxValueBytes NaN', () => createStorage({ driver: memoryDriver(), maxValueBytes: NaN })],
    ['maxValueBytes 0', () => createStorage({ driver: memoryDriver(), maxValueBytes: 0 })],
    ['maxValueBytes 1.5', () => createStorage({ driver: memoryDriver(), maxValueBytes: 1.5 })],
    ['cacheSize -1', () => createStorage({ driver: memoryDriver(), cacheSize: -1 })],
    ['cacheSize Infinity', () => createStorage({ driver: memoryDriver(), cacheSize: Infinity })],
    ['ttl NaN', () => storage.item('a', { ttl: NaN })],
    ['ttl 0', () => storage.item('a', { ttl: 0 })],
    ['ttl -5', () => storage.item('a', { ttl: -5 })],
    ['ttl Infinity', () => storage.item('a', { ttl: Infinity })],
    ['ttl past the safe range', () => storage.item('a', { ttl: Number.MAX_VALUE })],
    ['version 0', () => storage.item('a', { version: 0 })],
    ['version 1.5', () => storage.item('a', { version: 1.5 })],
    ['version 10001', () => storage.item('a', { version: 10_001 })],
    ['migration step 1', () => storage.item('a', { version: 2, migrations: { 1: (x) => x } })],
    ['migration step 3 of 2', () => storage.item('a', { version: 2, migrations: { 3: (x) => x } })],
    [
      'migration that is not a function',
      () => storage.item('a', { version: 2, migrations: { 2: 'x' as never } }),
    ],
    ['a schema that is neither', () => storage.item('a', { schema: {} as never })],
    ['a driver that is not one', () => createStorage({ driver: {} as never })],
  ])('refuses %s', (_label, run) => {
    expect(thrown(run).code).toBe('INVALID_OPTION');
  });

  it('refuses a TTL of NaN on set and writes nothing', async () => {
    const driver = memoryDriver();
    const item = createStorage({ driver }).item('a');
    expect((await rejection(item.set(1, { ttl: NaN }))).code).toBe('INVALID_OPTION');
    expect(driver.data.size).toBe(0);
  });

  it('refuses a value over maxValueBytes, counted in UTF-8 bytes', async () => {
    const driver = memoryDriver();
    const storage = createStorage({ driver, maxValueBytes: 64 });
    const item = storage.item<string>('note');
    // 26 two-byte characters fit in 64 bytes with the record around them; 40 do not.
    await item.set('ç'.repeat(20));
    const error = await rejection(item.set('ç'.repeat(40)));
    expect(error.code).toBe('VALUE_TOO_LARGE');
    expect(error.key).toBe('note');
    expect(await item.get()).toBe('ç'.repeat(20));
  });

  it('uses the smaller of its own limit and the driver limit', () => {
    const driver = { ...memoryDriver(), maxValueBytes: 100 };
    expect(createStorage({ driver }).maxValueBytes).toBe(100);
    expect(createStorage({ driver, maxValueBytes: 50 }).maxValueBytes).toBe(50);
  });

  it('refuses values it could not read back the same way', async () => {
    const item = createStorage({ driver: memoryDriver() }).item<unknown>('a');
    expect((await rejection(item.set({ when: new Date('nope') }))).code).toBe('UNSERIALIZABLE');
    expect((await rejection(item.set(new Map([[1, () => 1]])))).code).toBe('UNSERIALIZABLE');
  });
});

describe('schemas', () => {
  const User = z.object({ id: z.number().int(), name: z.string().min(1) });

  it('infers the type from a Zod schema and validates on write', async () => {
    const driver = memoryDriver();
    const user = createStorage({ driver }).item('user', { schema: User });
    await user.set({ id: 1, name: 'Ada' });
    const value = await user.get();
    expect(value?.name).toBe('Ada');
    const error = await rejection(user.set({ id: 1.5, name: 'Ada' }));
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.message).toBe('The value for "user" is invalid');
    expect(error.issues?.[0]?.path).toEqual(['id']);
    expect(await user.get()).toEqual({ id: 1, name: 'Ada' });
  });

  it('keeps record keys, which are data, out of the message', async () => {
    const scores = createStorage({ driver: memoryDriver() }).item('scores', {
      schema: z.record(z.string(), z.number()),
    });
    const error = await rejection(scores.set({ 'user@x.com': Number.NaN }));
    expect(error.message).toBe('The value for "scores" is invalid');
    expect(error.issues?.[0]?.path).toEqual(['user@x.com']);
  });

  it('works with Valibot and with a type guard', async () => {
    const storage = createStorage({ driver: memoryDriver() });
    const tags = storage.item('tags', { schema: v.array(v.string()), defaultValue: [] });
    await tags.set(['a']);
    expect(await tags.get()).toEqual(['a']);
    expect((await rejection(tags.set([1] as never))).code).toBe('VALIDATION_FAILED');

    const isFlag = (value: unknown): value is boolean => typeof value === 'boolean';
    const flag = storage.item('flag', { schema: isFlag, defaultValue: false });
    expect((await rejection(flag.set('yes' as never))).code).toBe('VALIDATION_FAILED');
  });

  it('never puts the rejected value in the error message', async () => {
    const pin = createStorage({ driver: memoryDriver() }).item('pin', {
      schema: z.enum(['1111', '2222']),
    });
    const error = await rejection(pin.set('9731-secret' as never));
    expect(error.message).not.toContain('9731');
    expect(String(error)).not.toContain('9731');
  });

  it('returns the default value for stored data that fails the schema, and reports it', async () => {
    const onError = vi.fn();
    const driver = memoryDriver([['user', '{"rns":1,"s":1,"d":{"id":"x"}}']]);
    const user = createStorage({ driver, onError }).item('user', {
      schema: User,
      defaultValue: { id: 0, name: 'guest' },
    });
    expect(await user.get()).toEqual({ id: 0, name: 'guest' });
    expect(await user.get()).toEqual({ id: 0, name: 'guest' });
    await flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({ code: 'VALIDATION_FAILED', key: 'user' });
    expect(driver.data.get('user')).toContain('"x"');
  });

  it('refuses an asynchronous schema with a clear message', async () => {
    const asyncSchema = z.string().refine(async () => true);
    const item = createStorage({ driver: memoryDriver() }).item('a', { schema: asyncSchema });
    const error = await rejection(item.set('x'));
    expect(error.code).toBe('INVALID_OPTION');
    expect(error.message).toContain('asynchronous');
  });
});

describe('stored data that is not what the item expects', () => {
  it.each<[string, string, StorageErrorCode]>([
    ['plain text', 'hello', 'CORRUPT_DATA'],
    ['other JSON', '{"theme":"dark"}', 'CORRUPT_DATA'],
    ['an unknown format', '{"rns":2,"s":1,"d":1}', 'INCOMPATIBLE_VERSION'],
    ['a fractional version', '{"rns":1,"s":1.5,"d":1}', 'CORRUPT_DATA'],
    ['a string expiry', '{"rns":1,"s":1,"e":"soon","d":1}', 'CORRUPT_DATA'],
    ['a negative expiry', '{"rns":1,"s":1,"e":-1,"d":1}', 'CORRUPT_DATA'],
    ['an unsafe expiry', '{"rns":1,"s":1,"e":1e300,"d":1}', 'CORRUPT_DATA'],
    ['no data', '{"rns":1,"s":1}', 'CORRUPT_DATA'],
    ['a newer version', '{"rns":1,"s":9,"d":1}', 'INCOMPATIBLE_VERSION'],
  ])('reads %s as the default value and reports %s', async (_label, raw, code) => {
    const onError = vi.fn();
    const driver = memoryDriver([['value', raw]]);
    const item = createStorage({ driver, onError }).item('value', { defaultValue: 42 });
    expect(await item.get()).toBe(42);
    expect(item.getSnapshot()).toMatchObject({ status: 'error', value: 42, error: { code } });
    await flush();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code, key: 'value' }));
    // The stored text is left alone, so a newer app version can still read it.
    expect(driver.data.get('value')).toBe(raw);
  });

  it('reads values written before adoption through legacy, then rewrites them', async () => {
    const driver = memoryDriver([['theme', 'dark']]);
    const theme = createStorage({ driver }).item('theme', {
      defaultValue: 'light',
      legacy: (raw) => raw,
    });
    expect(await theme.get()).toBe('dark');
    expect(driver.data.get('theme')).toBe('{"rns":1,"s":1,"d":"dark"}');
  });

  it('reports a legacy reader that throws as corrupt data', async () => {
    const driver = memoryDriver([['count', 'abc']]);
    const count = createStorage({ driver }).item('count', {
      defaultValue: 0,
      legacy: (raw) => {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) throw new Error('not a number');
        return parsed;
      },
    });
    expect(await count.get()).toBe(0);
    expect(count.getSnapshot().error?.code).toBe('CORRUPT_DATA');
  });
});

describe('migrations', () => {
  const v1 = '{"rns":1,"s":1,"d":{"name":"Ada Lovelace"}}';

  it('runs each step from the stored version and saves the result', async () => {
    const driver = memoryDriver([['profile', v1]]);
    const profile = createStorage({ driver }).item('profile', {
      version: 3,
      migrations: {
        2: (old) => {
          const [first, last] = (old as { name: string }).name.split(' ');
          return { first, last };
        },
        3: (old) => ({ ...(old as object), initials: 'AL' }),
      },
    });
    expect(await profile.get()).toEqual({ first: 'Ada', last: 'Lovelace', initials: 'AL' });
    expect(JSON.parse(driver.data.get('profile')!)).toMatchObject({ s: 3 });
  });

  it('reports a missing step or a failing step as an incompatible version', async () => {
    const storage = createStorage({ driver: memoryDriver([['profile', v1]]) });
    const missing = storage.item('profile', { version: 3, migrations: { 3: (x) => x } });
    expect(await missing.get()).toBeUndefined();
    expect(missing.getSnapshot().error?.message).toContain('No migration to version 2');

    const failing = createStorage({ driver: memoryDriver([['profile', v1]]) }).item('profile', {
      version: 2,
      migrations: {
        2: () => {
          throw new Error('boom');
        },
      },
    });
    expect(await failing.get()).toBeUndefined();
    expect(failing.getSnapshot().error).toMatchObject({ code: 'INCOMPATIBLE_VERSION' });
  });

  it('validates the migrated value', async () => {
    const driver = memoryDriver([['n', '{"rns":1,"s":1,"d":"7"}']]);
    const n = createStorage({ driver }).item('n', {
      schema: z.number(),
      version: 2,
      migrations: { 2: (old) => old },
      defaultValue: 0,
    });
    expect(await n.get()).toBe(0);
    expect(n.getSnapshot().error?.code).toBe('VALIDATION_FAILED');
  });
});

describe('time to live', () => {
  it('expires values, removes them on read and purges the rest', async () => {
    let now = 1_000_000;
    const driver = memoryDriver();
    const storage = createStorage({ driver, now: () => now, namespace: 'cache' });
    const session = storage.item('session', { ttl: 1_000 });
    const other = storage.item('other');
    await session.set('abc');
    await other.set('x', { ttl: 10 });
    await storage.item('forever').set(true);
    expect(JSON.parse(driver.data.get('cache:session')!).e).toBe(1_001_000);

    now += 999;
    expect(await session.get()).toBe('abc');
    now += 1;
    expect(await session.get()).toBeUndefined();
    expect(driver.data.has('cache:session')).toBe(false);
    expect(await storage.purgeExpired()).toBe(1);
    expect(await storage.keys()).toEqual(['forever']);
  });

  it('lets a set without a TTL override nothing and a set with one override the default', async () => {
    let now = 0;
    const item = createStorage({ driver: memoryDriver(), now: () => now }).item('a', { ttl: 5 });
    await item.set(1, { ttl: 100 });
    now = 50;
    expect(await item.get()).toBe(1);
    expect(isStorageError(await rejection(item.set(2, { ttl: -1 })), 'INVALID_OPTION')).toBe(true);
  });
});

describe('cache', () => {
  it('rereads keys nobody watches once they fall out of the cache', async () => {
    const driver = memoryDriver();
    const storage = createStorage({ driver, cacheSize: 1 });
    const first = storage.item('first');
    await first.set('cached');
    await storage.item('second').set('pushes first out');
    driver.data.set('first', '{"rns":1,"s":1,"d":"changed outside"}');
    expect(await first.get()).toBe('changed outside');
  });

  it('keeps watched keys cached however small the cache is', async () => {
    const driver = memoryDriver();
    const storage = createStorage({ driver, cacheSize: 0 });
    const watched = storage.item('watched');
    const unsubscribe = watched.subscribe(() => undefined);
    await watched.set('kept');
    driver.data.set('watched', '{"rns":1,"s":1,"d":"changed outside"}');
    expect(await watched.get()).toBe('kept');
    unsubscribe();
  });

  it('returns the same snapshot object until the value changes', async () => {
    const item = createStorage({ driver: memoryDriver() }).item('a', { defaultValue: 0 });
    const before = item.getSnapshot();
    expect(item.getSnapshot()).toBe(before);
    await item.set(1);
    const after = item.getSnapshot();
    expect(after).not.toBe(before);
    expect(item.getSnapshot()).toBe(after);
    expect(Object.isFrozen(after)).toBe(true);
  });
});

describe('oversized stored text', () => {
  it('refuses to parse text longer than the limit and leaves it in place', async () => {
    const huge = `{"rns":1,"s":1,"d":"${'x'.repeat(2_000)}"}`;
    const driver = memoryDriver([['big', huge]]);
    const parse = vi.spyOn(JSON, 'parse');
    const storage = createStorage({ driver, maxValueBytes: 1_000 });
    const item = storage.item('big', { defaultValue: 'small' });
    expect(await item.get()).toBe('small');
    expect(item.getSnapshot().error?.code).toBe('VALUE_TOO_LARGE');
    expect(await storage.purgeExpired()).toBe(0);
    expect(parse).not.toHaveBeenCalled();
    expect(driver.data.get('big')).toBe(huge);
  });

  it('clears keys in its namespace even when their names are not valid item names', async () => {
    const driver = memoryDriver([
      ['app:bad\nname', 'x'],
      ['app:ok', 'y'],
      ['other', 'z'],
    ]);
    expect(await createStorage({ driver, namespace: 'app' }).clear()).toBe(2);
    expect([...driver.data.keys()]).toEqual(['other']);
  });
});

describe('numbers that are not numbers', () => {
  it('refuses a driver limit that is NaN or fractional', () => {
    for (const maxValueBytes of [NaN, 0, 2.5, Infinity]) {
      const driver = { ...memoryDriver(), maxValueBytes };
      expect(thrown(() => createStorage({ driver })).code).toBe('INVALID_OPTION');
    }
  });

  it('refuses to compute an expiry from a clock that returns NaN', async () => {
    const item = createStorage({ driver: memoryDriver(), now: () => NaN }).item('a');
    expect((await rejection(item.set(1, { ttl: 1_000 }))).code).toBe('INVALID_OPTION');
    await item.set(1);
    expect(await item.get()).toBe(1);
  });
});
