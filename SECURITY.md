# Security policy

## Supported versions

| Version                 | Supported                                     |
| ----------------------- | --------------------------------------------- |
| 2.x (the `main` branch) | Yes                                           |
| 1.x                     | No: removed; it had no tested storage backend |

## Reporting a vulnerability

Report it privately through
[GitHub security advisories](https://github.com/muhittincamdali/ReactNativeStorage/security/advisories/new),
not in a public issue. Include the version or commit, the driver you use, and the smallest code
that shows the problem. You will get an answer within seven days.

## What this library protects, and what it does not

It protects against data that is malformed, oversized or crafted, and against leaking values
through errors:

- Stored text is never trusted. Records are parsed with `JSON.parse`, decoded with a depth limit
  of 64, defined as own properties (so `__proto__` cannot change a prototype), checked against
  the item's schema and limited to `maxValueBytes` before they are parsed.
- Keys, namespaces, TTLs, versions, limits and the clock are checked at the boundary: control
  characters, `NaN`, infinities, fractions and values outside the safe integer range are refused
  with `INVALID_KEY` or `INVALID_OPTION`.
- `StorageError` messages name the key and the reason, never the value. Schema messages, which
  can quote the value, are kept in `error.issues`; log them only if the value is not secret.
- `secureStoreDriver` keeps values in the iOS Keychain or the Android Keystore through
  expo-secure-store; `randomSecret` and `getOrCreateSecret` use `crypto.getRandomValues` without
  modulo bias.

It does not encrypt anything itself. MMKV, AsyncStorage and `localStorage` keep data in the
app's sandbox or the browser profile in plain form unless you encrypt MMKV (see
[Keep tokens and keys secure](docs/guides/secure-values.md)). Anyone with access to an unlocked,
jailbroken or rooted device, or to an unencrypted backup, can read that data. Keep tokens and
keys in SecureStore.
