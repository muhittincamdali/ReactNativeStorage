# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-26

A rewrite. The 1.x sources were removed: their storage backends were
not covered by tests, the JSI bridge only logged keys, and the `useStorage` hook logged stored
values. Nothing from the 1.x API is kept.

### Added

- `createStorage({ driver, namespace, maxValueBytes, cacheSize, onError, now })` and
  `storage.item(name, options)`: typed values with `get`, `set` (a value or an updater),
  `remove`, `load`, and `subscribe` / `getSnapshot` for `useSyncExternalStore`.
- Validation with any Standard Schema v1 (Zod, Valibot, ArkType) or a type guard, on write and
  on read; the item's type is inferred from the schema.
- Schema versions with step-by-step `migrations`, a `legacy` reader for values written before
  adoption, and records from a newer version left untouched (`INCOMPATIBLE_VERSION`).
- Time to live per item or per write, `purgeExpired()`, and expiry timers for subscribed items.
- A codec that keeps `Date`, `Map`, `Set`, `bigint`, `NaN`, the infinities, `-0` and `undefined`
  and refuses functions, class instances, circular references and invalid dates.
- Drivers: `mmkvDriver` (react-native-mmkv 3 and 4), `asyncStorageDriver` (AsyncStorage 2 and 3),
  `secureStoreDriver` (expo-secure-store), `webStorageDriver` (`localStorage`) and `memoryDriver`.
- `useStorageItem` in `react-native-storage-toolkit/react`.
- `copyKeys` (for example from AsyncStorage to MMKV), `toStateStorage` (Zustand, Jotai, Redux
  Persist, TanStack Query persisters), `randomSecret` and `getOrCreateSecret`.
- `StorageError` with a `code` for every failure.
- Example app `Examples/StorageDemo` (Expo SDK 58, React Native 0.88), the end-to-end script
  `scripts/e2e-ios.sh`, TypeDoc reference and four guides.

### Security

- Error messages name the key and the reason, never the stored value or its property names;
  where the problem is and schema messages, which may quote the value, are kept in
  `error.issues`.
- Limits at every boundary: keys (1–512 characters, no control characters), namespaces, value
  size in UTF-8 bytes (1 MiB by default, 2048 bytes for SecureStore), nesting depth (64),
  schema versions (up to 10,000), `bigint` digits (4,096), TTLs and clocks (finite, safe
  integers), timer delays (at most 2^31-1 ms) and the cache (500 unwatched keys by default).
  Stored text longer than the limit is not parsed.
- Decoding defines `__proto__` as an own property, so stored data cannot change a prototype.
- `getOrCreateSecret` writes a new secret only when nothing is stored. Corrupt, invalid,
  non-string, empty or expired data rejects (`EXPIRED` for an expired one) and is left in place,
  and concurrent calls for one driver key share one read and one write.
- `randomSecret` draws characters without modulo bias and stops after 64 batches of a random
  source that returns no usable bytes.

## [1.0.0] - 2026-02-03

First release, since removed in full; see 2.0.0.

[Unreleased]: https://github.com/muhittincamdali/ReactNativeStorage/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/muhittincamdali/ReactNativeStorage/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/muhittincamdali/ReactNativeStorage/releases/tag/v1.0.0
