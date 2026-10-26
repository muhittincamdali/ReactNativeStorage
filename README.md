<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/banner-light.svg" alt="React Native Storage: Typed, validated key-value storage for React Native and Expo on MMKV, AsyncStorage or SecureStore."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-version-light.svg" alt="Latest version: v1.0.0"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-license-light.svg" alt="License: MIT"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/badge-framework-light.svg" alt="Language version: React 18+"></picture></a>
</p>

<p align="center">
<a href="#quick-start"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-start-en-light.svg" alt="Get started"></picture></a>
<a href="https://muhittincamdali.github.io/ReactNativeStorage/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-docs-en-light.svg" alt="Documentation"></picture></a>
<a href="https://github.com/muhittincamdali/ReactNativeStorage/tree/main/Examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/ReactNativeStorage/main/.github/brand/button-examples-en-light.svg" alt="Examples"></picture></a>
</p>

<!-- brand:end -->

A TypeScript library for keeping app data on the device in React Native and Expo apps. You
declare each value once, with a name, a default value and optionally a schema, a lifetime and a
version; then you read and write it from anywhere, or show it in a component with a hook that
re-renders when it changes. The bytes are stored by a driver you choose: MMKV, AsyncStorage,
SecureStore, `localStorage` or memory. It is for apps that have outgrown hand-written
`JSON.parse(await AsyncStorage.getItem(...))` calls and want stored data to be checked, typed and
upgradable across app versions.

## Highlights

- **Typed and validated** — any [Standard Schema](https://standardschema.dev) (Zod, Valibot,
  ArkType) or a type guard checks values on write and on read; the item's type comes from the
  schema.
- **One API over five backends** — MMKV (synchronous, so hooks have the value on the first
  render), AsyncStorage, SecureStore (Keychain and Keystore), `localStorage` and memory, behind
  the same `get`, `set`, `remove` and `useStorageItem`.
- **Data that survives app updates** — every record carries a schema version; migrations upgrade
  old records step by step, a `legacy` reader adopts values written before this library, and
  records from a newer app version are left untouched.
- **Expiry** — a time to live per item or per write; a component showing an expired value falls
  back to the default at the moment it expires.
- **Failures that do not crash the app** — corrupt or invalid stored data returns the default
  value and reaches `onError`; error messages name the key, never the value.
- **Tested** — 163 Vitest tests cover the codec, validation, migrations, TTL, ordering of
  concurrent writes, every driver, the hook and the helpers; the example app runs on an iOS 27
  simulator against the real MMKV and Keychain in [`scripts/e2e-ios.sh`](scripts/e2e-ios.sh).

## Quick start

**1. Add the package**

```sh
npm install github:muhittincamdali/ReactNativeStorage react-native-mmkv react-native-nitro-modules
```

The package is installed from GitHub. MMKV is a native module: run the app with
`npx expo run:ios` or `npx expo run:android` (a development build), not in Expo Go.

**2. Import the module**

```tsx
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';
```

**3. Use it**

This component, from [`Examples/StorageDemo/src/QuickStart.tsx`](Examples/StorageDemo/src/QuickStart.tsx),
counts presses and still shows the count after the app restarts:

```tsx
import { Button } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';

const storage = createStorage({ driver: mmkvDriver(createMMKV()) });
export const pressCount = storage.item('press-count', { defaultValue: 0 });

export function PressCounter() {
  const [count, setCount] = useStorageItem(pressCount);
  return <Button title={`Pressed ${count} times`} onPress={() => setCount((n) => n + 1)} />;
}
```

## Installation

The package is not on the npm registry. Install it from GitHub with npm, pnpm or Yarn:

```sh
npm install github:muhittincamdali/ReactNativeStorage
```

It ships TypeScript sources, which Metro, Expo, Vitest and the `jest-expo` preset compile
directly; nothing runs at install time. Then add the backend you want to use:

| Backend      | Install                                                         | Driver                                          |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| MMKV         | `npx expo install react-native-mmkv react-native-nitro-modules` | `mmkvDriver(createMMKV())`                      |
| AsyncStorage | `npx expo install @react-native-async-storage/async-storage`    | `asyncStorageDriver(AsyncStorage)`              |
| SecureStore  | `npx expo install expo-secure-store`                            | `secureStoreDriver(SecureStore, options)`       |
| Web Storage  | nothing                                                         | `webStorageDriver(window.localStorage, window)` |
| Memory       | nothing                                                         | `memoryDriver()`                                |

## Usage

The samples below are compiled and run by [`test/readme.test.ts`](test/readme.test.ts),
with the memory driver in place of MMKV.

### Check values with a schema

The schema runs when you write and when you read. Writing an invalid value rejects and writes
nothing; reading an invalid stored value gives the default value and calls `onError`.

```ts
import { z } from 'zod';

const storage = createStorage({
  driver: mmkvDriver(createMMKV()),
  namespace: 'app',
  onError: (error) => console.warn(error.code, error.key), // the key, never the value
});

export const theme = storage.item('theme', {
  schema: z.enum(['system', 'light', 'dark']),
  defaultValue: 'system',
});

await theme.set('dark');
await theme.set('purple'); // rejects: StorageError VALIDATION_FAILED
```

### Show a value in a component

`useStorageItem` returns the value, a setter that accepts a value or an updater, and the item's
state. Every component that shows the item re-renders after a write, wherever it came from.

```tsx
function ThemePicker() {
  const [value, setValue, { status, error }] = useStorageItem(theme);
  if (status === 'error') return <Text>Could not read the theme: {error?.code}</Text>;
  return <Button title={`Theme: ${value}`} onPress={() => setValue('dark')} />;
}
```

With an asynchronous driver (AsyncStorage, SecureStore) the first render has the default value
and `status: 'loading'`.

### Let values expire

```ts
const draft = storage.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
await draft.set('Buy milk'); // gone five minutes later

const otp = storage.item<string>('otp');
await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
await storage.purgeExpired(); // removes every expired value in the namespace
```

### Change the shape of stored data

Raise `version` and add a migration per step. Old records are upgraded when read and saved in
the new shape.

```ts
export const profile = storage.item('profile', {
  schema: z.object({ first: z.string(), last: z.string() }),
  version: 2,
  migrations: {
    2: (old) => {
      const [first = '', ...rest] = String((old as { name?: unknown }).name ?? '').split(' ');
      return { first, last: rest.join(' ') };
    },
  },
});
```

### Keep a token in the Keychain

```ts
import * as SecureStore from 'expo-secure-store';

const secure = createStorage({
  driver: secureStoreDriver(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  namespace: 'auth',
});
export const refreshToken = secure.item('refresh-token', { schema: z.string() });
```

`getOrCreateSecret(item)` creates a random key once and returns it afterwards, for example to
encrypt an MMKV instance. It never overwrites a stored value it cannot use: corrupt, invalid or
expired data rejects with a `StorageError` and stays in place. See
[Keep tokens and keys secure](docs/guides/secure-values.md).

### Persist a Zustand store

```ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toStateStorage } from 'react-native-storage-toolkit';

type Cart = { items: string[]; add: (item: string) => void };

export const useCart = create<Cart>()(
  persist(
    (set) => ({ items: [], add: (item) => set((cart) => ({ items: [...cart.items, item] })) }),
    {
      name: 'cart',
      storage: createJSONStorage(() => toStateStorage(storage)),
    },
  ),
);
```

The same adapter works with Jotai, Redux Persist and TanStack Query persisters.

## Demo

[`Examples/StorageDemo`](Examples/StorageDemo) is an Expo SDK 58 app (React Native 0.88) that
uses every feature above with the real MMKV and SecureStore: a counter, a theme checked by Zod,
a draft with a five-minute TTL, a profile migrated from version 1, and a token created with
`expo-crypto` and kept in the Keychain. The screens below come from
[`scripts/capture-screenshots.sh`](scripts/capture-screenshots.sh), which installs the app on an
iPhone simulator and captures it.

| Light                                                                           | Dark                                                                          |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Storage Demo, top of the screen, light](docs/images/demo-top-light.png)       | ![Storage Demo, top of the screen, dark](docs/images/demo-top-dark.png)       |
| ![Storage Demo, bottom of the screen, light](docs/images/demo-bottom-light.png) | ![Storage Demo, bottom of the screen, dark](docs/images/demo-bottom-dark.png) |

Run it yourself:

```sh
cd Examples/StorageDemo
npm install
npx expo run:ios      # or: npx expo run:android, npx expo start --web
```

## Documentation

Reference documentation and articles:

- [API reference](https://muhittincamdali.github.io/ReactNativeStorage/) — every export, built
  with TypeDoc from the sources (`npm run docs` builds it locally into `docs/api`).
- [Error codes](src/errors.ts) — what each `StorageError` code means.

## Guides

- [Move from AsyncStorage to MMKV](docs/guides/migrating-from-async-storage.md) — copy the old
  keys once and read them through `legacy`.
- [Change the shape of stored data](docs/guides/schemas-and-migrations.md) — schemas, versions
  and migrations, and which values the codec keeps.
- [Keep tokens and keys secure](docs/guides/secure-values.md) — SecureStore and an encryption
  key for MMKV.
- [Test code that uses storage](docs/guides/testing.md) — the memory driver, a controlled clock
  and Jest settings.

## Requirements

| Toolchain                           | Minimum version                       |
| ----------------------------------- | ------------------------------------- |
| React                               | 18 (for `useSyncExternalStore`)       |
| TypeScript, if you type-check       | 5.0                                   |
| react-native-mmkv, for `mmkvDriver` | 3 (version 4 needs React Native 0.76) |
| Node.js, to work on this repository | 22.12                                 |

The example app and the end-to-end script are tested with Expo SDK 58, React Native 0.88,
Xcode 27 and the iOS 27 simulator.

## Architecture

```text
useStorageItem (src/react.ts)          React hook over useSyncExternalStore
        │
StorageItem (src/item.ts)              get / set / remove, snapshots, expiry timers
        │  RecordFormat (src/record.ts)   schema, versions, migrations, legacy, size limit
        │  codec + envelope               {rns, s, e, d} records; Date, Map, Set, bigint, NaN…
        │
Storage (src/storage.ts)               namespace, keys, clear, purgeExpired, onError
        │  KeyStore (src/keyStore.ts)     LRU cache, shared reads, ordered writes, listeners
        │
StorageDriver (src/driver.ts)          mmkv · async-storage · secure-store · web-storage · memory
```

Decisions a contributor should know:

- Drivers adapt an instance the app created and match it by shape, so the package has no
  runtime dependencies and supports several versions of each backend.
- Reads never throw for bad data, only for a failing driver; writes reject and write nothing.
- The key store shows a write at once and sends writes to one key in call order; when the newest
  write fails, it returns to the last value the backend confirmed.
- Every limit is checked at the boundary: key length and characters, value size in UTF-8 bytes,
  nesting depth, schema versions, TTLs (finite and within the safe integer range) and timer
  delays (at most 2^31-1 ms).

## Roadmap

Planned next, tracked in the [issue tracker](https://github.com/muhittincamdali/ReactNativeStorage/issues):

- publish the package to the npm registry;
- an Android emulator run of the end-to-end script in CI;
- an optional key index for SecureStore, so `clear()` can remove every secret on sign-out.

## Contributing

Contributions are welcome. Read the [contributing guide](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CONTRIBUTING.md) and the [code of conduct](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/CODE_OF_CONDUCT.md) before opening a pull request. Report security issues privately as described in the [security policy](https://github.com/muhittincamdali/ReactNativeStorage/blob/main/SECURITY.md).

## License

Released under the MIT license. See [LICENSE](LICENSE).
