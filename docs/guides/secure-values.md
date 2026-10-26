---
title: Keep tokens and keys secure
group: Guides
---

# Keep tokens and keys secure

MMKV and AsyncStorage keep data in the app's sandbox in plain form. Tokens, refresh tokens and
encryption keys belong in the Keychain (iOS) or the Android Keystore, which `expo-secure-store`
uses. This guide puts a token there and uses a generated key to encrypt MMKV.

## Store a token in SecureStore

```sh
npx expo install expo-secure-store
```

```ts
import * as SecureStore from 'expo-secure-store';
import { createStorage, secureStoreDriver } from 'react-native-storage-toolkit';
import { z } from 'zod';

const secure = createStorage({
  driver: secureStoreDriver(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  namespace: 'auth',
});

export const refreshToken = secure.item('refresh-token', { schema: z.string().min(1) });

await refreshToken.set(tokenFromServer);
const token = await refreshToken.get(); // string | undefined
await refreshToken.remove(); // on sign-out
```

Things to know about this driver:

- The options object is passed to every SecureStore call. `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps
  the value out of backups and off other devices.
- SecureStore cannot list its keys, so `keys()` and `clear()` reject with `UNSUPPORTED`. Remove
  each item on sign-out.
- Values are limited to 2048 bytes (`SECURE_STORE_MAX_VALUE_BYTES`); the SecureStore
  documentation notes that some iOS releases refused larger ones. Store a token, not a profile.
- The driver is asynchronous, so `useStorageItem` starts with `status: 'loading'`.
- Keys are written with only the characters SecureStore accepts: `auth:refresh-token` becomes
  `auth_3a_refresh-token`.

## Encrypt MMKV with a key from SecureStore

MMKV can encrypt its file. The key has to live somewhere safer than the file itself.
`getOrCreateSecret` returns the key stored in a SecureStore item or creates a random one the first
time. Concurrent calls for one key share the first call, also through two items declared for
that key, so two screens starting at once cannot create two different keys.

A new key is written only when nothing is stored. `getOrCreateSecret` never overwrites a stored
value it cannot use, because everything encrypted with the old key would become unreadable:

- an unreadable or invalid record rejects with its read error (`CORRUPT_DATA`,
  `VALIDATION_FAILED` or `INCOMPATIBLE_VERSION`);
- a stored value that is not a non-empty string rejects with `CORRUPT_DATA`;
- an expired value rejects with `EXPIRED`, so give the item no `ttl`;
- a failing read rejects with `DRIVER_ERROR`.

The stored text stays as it is in every case. Deciding what happens next is left to the app:
call `mmkvKey.remove()` and open the storage again only when the encrypted data may be lost.

```sh
npx expo install expo-crypto
```

```ts
import * as Crypto from 'expo-crypto';
import { createMMKV } from 'react-native-mmkv';
import { createStorage, getOrCreateSecret, mmkvDriver } from 'react-native-storage-toolkit';

const mmkvKey = secure.item('mmkv-key', { schema: z.string() });

export async function openEncryptedStorage() {
  const encryptionKey = await getOrCreateSecret(mmkvKey, {
    length: 16,
    getRandomValues: Crypto.getRandomValues,
  });
  const mmkv = createMMKV({ id: 'private', encryptionKey });
  return createStorage({ driver: mmkvDriver(mmkv), namespace: 'private' });
}
```

`length: 16` matches MMKV's default AES-128 key size; use 32 with `encryptionType: 'AES-256'`.
The secret uses the characters A–Z, a–z and 0–9 with equal probability (bytes that would favour
some characters are dropped), so 16 characters carry about 95 bits.

Without `getRandomValues`, the function uses `globalThis.crypto.getRandomValues` and explains what
to install when the runtime has none.

## What errors contain

`StorageError` messages name the key and the reason, never the value, so they are safe to send to
crash reporting. A schema's own messages can quote the value; they are kept apart in
`error.issues`. The `cause` of a `DRIVER_ERROR` is the native module's error, unchanged.
