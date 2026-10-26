import * as v from 'valibot';
import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { createStorage, memoryDriver, type StorageItem } from '../src/index';

// These tests run in `npm run typecheck`; at run time they only create items.
const storage = createStorage({ driver: memoryDriver() });

describe('item types', () => {
  it('takes the type from a Zod schema, not from the default value', () => {
    const theme = storage.item('theme', {
      schema: z.enum(['system', 'light', 'dark']),
      defaultValue: 'system',
    });
    expectTypeOf(theme).toEqualTypeOf<StorageItem<'system' | 'light' | 'dark'>>();
    // @ts-expect-error "purple" is not in the enum
    void theme.set('purple').catch(() => undefined);
  });

  it('takes the type from a Valibot schema and from a type guard', () => {
    const tags = storage.item('tags', { schema: v.array(v.string()) });
    expectTypeOf(tags).toEqualTypeOf<StorageItem<string[] | undefined>>();
    const isFlag = (value: unknown): value is boolean => typeof value === 'boolean';
    const flag = storage.item('flag', { schema: isFlag, defaultValue: false });
    expectTypeOf(flag).toEqualTypeOf<StorageItem<boolean>>();
  });

  it('refuses a default value that the schema would reject', () => {
    // @ts-expect-error 3 is not a string
    storage.item('name', { schema: z.string(), defaultValue: 3 });
  });

  it('adds undefined when there is no default value', () => {
    expectTypeOf(storage.item<string>('token')).toEqualTypeOf<StorageItem<string | undefined>>();
    expectTypeOf(storage.item('count', { defaultValue: 0 })).toEqualTypeOf<StorageItem<number>>();
  });
});
