---
title: Move from AsyncStorage to MMKV
group: Guides
---

# Move from AsyncStorage to MMKV

This guide moves an app that saves values with plain `AsyncStorage.setItem` to MMKV, without
losing what users already have on their devices. It takes three steps: copy the stored text
once, read the old format through `legacy`, and let each item rewrite itself.

## 1. Install MMKV

```sh
npx expo install react-native-mmkv react-native-nitro-modules
```

MMKV is a native module, so it needs a development build (`npx expo run:ios`), not Expo Go.

## 2. Copy the old keys once

Run `copyKeys` at start-up, before the first item is read. It copies every key that the target
does not have yet, so running it on every launch is safe; `removeFromSource` deletes each key
from AsyncStorage once it is in MMKV.

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';
import { asyncStorageDriver, copyKeys, mmkvDriver } from 'react-native-storage-toolkit';

export const mmkv = createMMKV({ id: 'app' });

export async function moveToMMKV(): Promise<void> {
  const result = await copyKeys({
    from: asyncStorageDriver(AsyncStorage),
    to: mmkvDriver(mmkv),
    keys: ['onboarded', 'theme', 'user'],
    removeFromSource: true,
  });
  // result.copied, result.skipped (already in MMKV) and result.missing (never saved).
}
```

Pass `keys` as a list when you know the names, or as a filter (`(key) => key.startsWith('@app/')`)
to select from `AsyncStorage.getAllKeys()`.

## 3. Read the old text with `legacy`

`copyKeys` copies text as it is, so MMKV now holds `"true"` or `{"id":1}`, not records written
by this library. Give each item a `legacy` reader that turns that text into the current value.
The value is then validated against the schema and saved in the new format, so the reader runs
once per key.

```ts
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { z } from 'zod';
import { mmkv } from './moveToMMKV';

const storage = createStorage({ driver: mmkvDriver(mmkv) });

export const onboarded = storage.item('onboarded', {
  schema: z.boolean(),
  defaultValue: false,
  legacy: (raw) => raw === 'true',
});

export const user = storage.item('user', {
  schema: z.object({ id: z.number(), name: z.string() }),
  legacy: (raw) => JSON.parse(raw),
});
```

If `legacy` throws, or its result fails the schema, the item returns its default value and
reports `CORRUPT_DATA` or `VALIDATION_FAILED` to the storage's `onError`. The stored text is
left in place, so a later fix to the reader can still recover it.

## Keys with a namespace

The example above uses no namespace, so the copied keys keep their names. To move them under a
namespace (`app:onboarded`), copy them yourself with the driver API:

```ts
const from = asyncStorageDriver(AsyncStorage);
const to = mmkvDriver(mmkv);
for (const key of ['onboarded', 'theme']) {
  const text = await from.getItem(key);
  if (text !== null) to.setItem(`app:${key}`, text);
}
```

## Check it

Install the old app version on a simulator, use it, then install the new one over it. Reading
`onboarded` must return what the old version saved, and `mmkv.getString('onboarded')` must start
with `{"rns":1` after the first read.
