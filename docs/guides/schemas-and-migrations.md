---
title: Change the shape of stored data
group: Guides
---

# Change the shape of stored data

Values outlive app versions. A user who skips three releases opens the app with data written by
the oldest one. This guide shows how an item validates what it reads, and how to upgrade old
values step by step.

## Validate with a schema

Any [Standard Schema](https://standardschema.dev) works: Zod 3.24 and later, Valibot 1, ArkType 2.
A type guard works too. The item infers its type from the schema.

```ts
import { z } from 'zod';

const Settings = z.object({ fontSize: z.number().min(10).max(40), haptics: z.boolean() });

export const settings = storage.item('settings', {
  schema: Settings,
  defaultValue: { fontSize: 16, haptics: true },
});

await settings.set({ fontSize: 99, haptics: true }); // rejects with VALIDATION_FAILED
```

The schema runs twice:

- **On write**, so nothing invalid reaches storage. `set` rejects and writes nothing.
- **On read**, because storage can hold anything: a value from an older version, from another
  library, or edited on a rooted device. An invalid stored value gives the default value, the
  snapshot reports `status: 'error'`, and `onError` receives the error once.

Error messages contain the key and the path of the first issue (`at fontSize`), never the value.
Schema messages can quote the value, so they are in `error.issues`, which you can log on purpose.

Schemas must be synchronous. A Zod schema with an `async` refinement is refused with
`INVALID_OPTION`, because hooks read values during rendering.

## Upgrade old values with migrations

Every record stores the item's `version` (1 by default). When the shape changes, raise the
version and add one migration per step. `migrations[n]` turns a version `n - 1` value into a
version `n` value.

```ts
export const profile = storage.item('profile', {
  schema: z.object({ first: z.string(), last: z.string(), initials: z.string() }),
  version: 3,
  migrations: {
    // Version 2 split the name.
    2: (old) => {
      const [first = '', ...rest] = String((old as { name: string }).name).split(' ');
      return { first, last: rest.join(' ') };
    },
    // Version 3 added initials.
    3: (old) => {
      const { first, last } = old as { first: string; last: string };
      return { first, last, initials: `${first[0] ?? ''}${last[0] ?? ''}` };
    },
  },
});
```

A version 1 record runs steps 2 and 3, a version 2 record only step 3. The result is validated
and written back, so each record is migrated once.

Rules that keep this safe:

- Keep every old step. A user can jump from version 1 to the newest one.
- A migration receives `unknown`: the stored value has not been validated yet. Check what you
  read.
- A record with a **newer** version than the item (the user downgraded the app) is not touched:
  the item returns its default value and reports `INCOMPATIBLE_VERSION`, and the newer app still
  finds the record when the user updates again.
- A missing step or a migration that throws also reports `INCOMPATIBLE_VERSION` and leaves the
  record as it is.

## Values the codec keeps

Records are JSON, but the codec keeps types that JSON changes:

| Value                             | Plain `JSON.stringify` | Stored by this library |
| --------------------------------- | ---------------------- | ---------------------- |
| `new Date(…)`                     | ISO string             | `Date`                 |
| `new Map(…)`, `new Set(…)`        | `{}`                   | `Map`, `Set`           |
| `NaN`, `Infinity`, `-0`           | `null`, `null`, `0`    | the same number        |
| `undefined` in an object or array | dropped / `null`       | `undefined`            |
| `123n`                            | throws                 | `123n`                 |

Functions, symbols, class instances, circular references and invalid dates are refused with
`UNSERIALIZABLE`, naming where they are (`at user.avatar`), instead of being dropped silently.
Nesting is limited to 64 levels.
