---
title: Test code that uses storage
group: Guides
---

# Test code that uses storage

Native modules do not run in Jest or Vitest. Build your storages from a driver you pass in, and
give tests `memoryDriver()`: everything else (validation, TTL, migrations, hooks) behaves as in
the app.

## Inject the driver

```ts
// storage.ts
import { createStorage, type StorageDriver } from 'react-native-storage-toolkit';
import { z } from 'zod';

export function createAppStorage(driver: StorageDriver) {
  const storage = createStorage({ driver, namespace: 'app' });
  return {
    storage,
    theme: storage.item('theme', { schema: z.enum(['light', 'dark']), defaultValue: 'light' }),
  };
}
```

```ts
// app.ts
import { createMMKV } from 'react-native-mmkv';
import { mmkvDriver } from 'react-native-storage-toolkit';
import { createAppStorage } from './storage';

export const { theme } = createAppStorage(mmkvDriver(createMMKV()));
```

## Use the memory driver in tests

```ts
import { memoryDriver } from 'react-native-storage-toolkit';
import { expect, it } from 'vitest';
import { createAppStorage } from './storage';

it('remembers the theme', async () => {
  const driver = memoryDriver();
  const { theme } = createAppStorage(driver);
  await theme.set('dark');
  expect(await theme.get()).toBe('dark');
  expect(driver.data.get('app:theme')).toBe('{"rns":1,"s":1,"d":"dark"}');
});
```

`memoryDriver(entries)` starts with stored text, which is how you test migrations and legacy
readers:

```ts
const driver = memoryDriver([['app:theme', '{"rns":1,"s":1,"d":"blue"}']]);
const { theme } = createAppStorage(driver);
expect(await theme.get()).toBe('light'); // "blue" fails the schema
```

## Control time

TTLs read the clock through the `now` option, so a test can move time without fake timers:

```ts
let now = 0;
const storage = createStorage({ driver: memoryDriver(), now: () => now });
const code = storage.item('otp', { ttl: 30_000 });
await code.set('123456');
now = 30_000;
expect(await code.get()).toBeUndefined();
```

For components that stay mounted while a value expires, use your test runner's fake timers with
`now: () => Date.now()`; the item sets a timer for the expiry time.

## Jest with React Native

The package ships TypeScript sources, so Jest has to transform it. The `jest-expo` preset already
transforms every package whose name starts with `react-native`. The plain React Native preset
(`@react-native/jest-preset`) only transforms `react-native` itself, so add the package to its
pattern:

```js
// jest.config.js
module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-storage-toolkit)/)',
  ],
};
```
