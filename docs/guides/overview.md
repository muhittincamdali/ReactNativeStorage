# React Native Storage

Typed key-value storage for React Native and Expo. Declare each value once with a name, a
default value and, if you like, a schema; then read and write it from anywhere, or show it in a
component with `useStorageItem`. The values are saved by a driver you choose: MMKV,
AsyncStorage, SecureStore, `localStorage` or memory.

```ts
import { createMMKV } from 'react-native-mmkv';
import { createStorage, mmkvDriver } from 'react-native-storage-toolkit';
import { useStorageItem } from 'react-native-storage-toolkit/react';

const storage = createStorage({ driver: mmkvDriver(createMMKV()) });
const pressCount = storage.item('press-count', { defaultValue: 0 });

function PressCounter() {
  const [count, setCount] = useStorageItem(pressCount);
  return <Button title={`Pressed ${count} times`} onPress={() => setCount((n) => n + 1)} />;
}
```

## Where to start

- {@link "react-native-storage-toolkit"!createStorage | createStorage} creates a storage on top of a driver, with an optional namespace.
- {@link "react-native-storage-toolkit"!Storage.item | Storage.item} declares a typed value: default value, schema, TTL, version and
  migrations.
- {@link "react-native-storage-toolkit"!StorageItem | StorageItem} reads and writes it: `get`, `set`, `remove`, `subscribe`.
- {@link "react-native-storage-toolkit/react"!useStorageItem | useStorageItem} shows it in a component.
- {@link "react-native-storage-toolkit"!StorageError | StorageError} is the one error type; its `code` says what went wrong.

## Guides

- [Move from AsyncStorage to MMKV](migrating-from-async-storage.md)
- [Change the shape of stored data](schemas-and-migrations.md)
- [Keep tokens and keys secure](secure-values.md)
- [Test code that uses storage](testing.md)

The source, the example app and the issue tracker are on
[GitHub](https://github.com/muhittincamdali/ReactNativeStorage).
