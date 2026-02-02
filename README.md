# ReactNativeStorage

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74+-green.svg)](https://reactnative.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)]()

A **type-safe**, **multi-backend** storage toolkit for React Native. Supports MMKV, SQLite, Keychain, encrypted storage, biometric authentication, and Zustand middleware — all with a unified interface.

---

## Features

- 🚀 **MMKV Backend** — Blazing fast key-value storage via `react-native-mmkv`
- 🗄️ **SQLite Backend** — Structured storage with query builder and migrations
- 🔐 **AES Encryption** — Encrypt sensitive data at rest
- 🧬 **Biometric Auth** — Face ID / Touch ID / Fingerprint gated access
- 🔑 **Keychain Integration** — Secure credential storage via `react-native-keychain`
- ⚛️ **React Hooks** — `useStorage` and `useSecureStorage` for seamless UI binding
- 🐻 **Zustand Middleware** — Persist Zustand stores with any backend
- 📦 **Type-Safe** — Full TypeScript support with generics
- ⏱️ **TTL Support** — Auto-expiring entries
- 🧠 **Memory Cache** — In-memory LRU layer on top of MMKV
- 🔄 **Batch Operations** — `getMultiple` / `setMultiple` for efficiency
- 🛠️ **Query Builder** — Fluent SQL builder for SQLite operations
- 📐 **Migration Runner** — Versioned schema migrations with rollback

---

## Installation

```bash
npm install react-native-storage-toolkit
```

### Peer Dependencies

Install the backends you need:

```bash
# MMKV (recommended for key-value)
npm install react-native-mmkv

# Keychain (secure credentials)
npm install react-native-keychain

# SQLite (structured data)
npm install react-native-quick-sqlite
```

### iOS

```bash
cd ios && pod install
```

---

## Quick Start

### Basic Storage (MMKV)

```typescript
import { Storage } from 'react-native-storage-toolkit';

const storage = new Storage({ instanceId: 'my-app' });
await storage.initialize();

// Type-safe get/set
await storage.set<string>('username', 'muhittin');
const name = await storage.get<string>('username');

// With TTL (auto-expires after 1 hour)
await storage.set('session', { token: 'abc123' }, 3600000);

// Batch operations
await storage.setMultiple([
  { key: 'theme', value: 'dark' },
  { key: 'lang', value: 'en' },
]);

const results = await storage.getMultiple<string>(['theme', 'lang']);

// Get or compute
const config = await storage.getOrSet('app-config', async () => {
  return await fetchRemoteConfig();
}, 86400000);

// Atomic increment
const loginCount = await storage.increment('login_count');
```

### Encrypted Storage

```typescript
import { Storage, EncryptedStorage } from 'react-native-storage-toolkit';

const base = new Storage();
await base.initialize();

const secure = new EncryptedStorage(base, 'my-256-bit-secret-key');
await secure.initialize();

await secure.set('credit-card', { last4: '4242', exp: '12/28' });
const card = await secure.get('credit-card');
// Data is AES encrypted at rest, keys are hashed
```

### Biometric-Protected Storage

```typescript
import { Storage, EncryptedStorage, BiometricStorage } from 'react-native-storage-toolkit';

const base = new Storage();
await base.initialize();

const encrypted = new EncryptedStorage(base, 'secret-key');
const biometric = new BiometricStorage(encrypted, {
  promptTitle: 'Unlock Vault',
  promptSubtitle: 'Authenticate to access your data',
  accessControl: 'biometryOrPasscode',
});

// Will prompt Face ID / Touch ID before access
await biometric.set('private-notes', 'my secret notes');
const notes = await biometric.get<string>('private-notes');

// Check auth state
if (biometric.isAuthenticated()) {
  console.log('Session active');
}
```

### Keychain Credentials

```typescript
import { KeychainStorage } from 'react-native-storage-toolkit';

const keychain = new KeychainStorage('com.myapp.auth');
await keychain.initialize();

await keychain.setCredentials('user@email.com', 'securePassword123');
const creds = await keychain.getCredentials();

// Internet credentials (per-server)
await keychain.setInternetCredentials('api.example.com', 'user', 'token');
const apiCreds = await keychain.getInternetCredentials('api.example.com');
```

### SQLite Storage

```typescript
import { SQLiteStorage, QueryBuilder, MigrationRunner } from 'react-native-storage-toolkit';

const db = new SQLiteStorage('myapp.db');
await db.initialize();

// Key-value interface
await db.set('user-prefs', { theme: 'dark', fontSize: 16 });
const prefs = await db.get('user-prefs');

// Query builder for custom queries
const query = QueryBuilder.from('storage')
  .select('key', 'value')
  .whereLike('key', 'user_%')
  .orderBy('timestamp', 'DESC')
  .limit(20);

const { sql, params } = query.buildSelect();

// Migrations
const runner = new MigrationRunner(db.getDatabase()!);
runner.register(
  {
    version: 1,
    description: 'Create users table',
    up: async (database) => {
      await database.execute(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        )
      `);
    },
    down: async (database) => {
      await database.execute('DROP TABLE IF EXISTS users');
    },
  },
  {
    version: 2,
    description: 'Add avatar column',
    up: async (database) => {
      await database.execute('ALTER TABLE users ADD COLUMN avatar TEXT');
    },
    down: async (database) => {
      // SQLite doesn't support DROP COLUMN, recreate table
      await database.execute('CREATE TABLE users_backup AS SELECT id, name, email FROM users');
      await database.execute('DROP TABLE users');
      await database.execute('ALTER TABLE users_backup RENAME TO users');
    },
  }
);

const applied = await runner.migrate();
console.log(`Applied ${applied} migrations`);
```

### React Hooks

```typescript
import { useStorage, useSecureStorage } from 'react-native-storage-toolkit';

function ProfileScreen() {
  const storage = useRef(new Storage()).current;

  const {
    value: username,
    loading,
    error,
    set: setUsername,
    remove: removeUsername,
    refresh,
  } = useStorage<string>(storage, 'username', {
    defaultValue: 'Guest',
    ttl: 86400000,
  });

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Hello, {username}!</Text>
      <Button title="Update" onPress={() => setUsername('New Name')} />
      <Button title="Clear" onPress={removeUsername} />
    </View>
  );
}
```

### Zustand Middleware

```typescript
import { create } from 'zustand';
import { Storage, createStoragePersist } from 'react-native-storage-toolkit';

const storage = new Storage({ instanceId: 'zustand-store' });
storage.initialize();

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
}

const useAppStore = create<AppState>(
  createStoragePersist<AppState>({
    name: 'app-state',
    storage,
    version: 1,
    partialize: (state) => ({
      theme: state.theme,
      language: state.language,
    }),
    debounceMs: 200,
  })((set) => ({
    theme: 'light',
    language: 'en',
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
  }))
);
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Your App                        │
├──────────┬──────────┬──────────┬────────────────┤
│ useStorage│useSecure │ Zustand  │   Direct API   │
│   Hook   │  Hook    │Middleware│                │
├──────────┴──────────┴──────────┴────────────────┤
│              Unified IStorage Interface          │
├──────────┬──────────┬──────────┬────────────────┤
│   MMKV   │  SQLite  │ Keychain │  Encrypted     │
│ Backend  │ Backend  │ Backend  │   Backend      │
├──────────┴──────────┴──────────┴────────────────┤
│          Native Modules (iOS / Android)          │
└─────────────────────────────────────────────────┘
```

---

## Configuration

```typescript
import { StorageConfigBuilder } from 'react-native-storage-toolkit';

const config = new StorageConfigBuilder()
  .setBackend('mmkv')
  .setInstanceId('my-app-v2')
  .setEncryptionKey('optional-encryption-key')
  .setLogging(true)
  .setDefaultTTL(3600000) // 1 hour default
  .setMaxRetries(3)
  .build();

const storage = new Storage(config);
```

---

## API Reference

### `Storage`

| Method | Returns | Description |
|--------|---------|-------------|
| `initialize()` | `Promise<void>` | Initialize MMKV backend |
| `get<T>(key)` | `Promise<T \| null>` | Get value by key |
| `set<T>(key, value, ttl?)` | `Promise<void>` | Set value with optional TTL |
| `remove(key)` | `Promise<void>` | Remove entry |
| `clear()` | `Promise<void>` | Clear all entries |
| `has(key)` | `Promise<boolean>` | Check if key exists |
| `keys()` | `Promise<string[]>` | Get all keys |
| `getMultiple<T>(keys)` | `Promise<Map>` | Batch get |
| `setMultiple<T>(entries)` | `Promise<void>` | Batch set |
| `getOrSet<T>(key, factory, ttl?)` | `Promise<T>` | Get or compute and cache |
| `increment(key, amount?)` | `Promise<number>` | Atomic increment |

### `SQLiteStorage`

Extends `IStorage` with additional methods:

| Method | Returns | Description |
|--------|---------|-------------|
| `count()` | `Promise<number>` | Total entry count |
| `cleanExpired()` | `Promise<number>` | Remove expired entries |
| `close()` | `Promise<void>` | Close database connection |

### `KeychainStorage`

| Method | Returns | Description |
|--------|---------|-------------|
| `setCredentials(user, pass)` | `Promise<boolean>` | Store credentials |
| `getCredentials()` | `Promise<object \| null>` | Retrieve credentials |
| `removeCredentials()` | `Promise<boolean>` | Remove credentials |
| `setInternetCredentials(...)` | `Promise<boolean>` | Per-server credentials |
| `hasCredentials()` | `Promise<boolean>` | Check stored credentials |

---

## Requirements

- React Native >= 0.70
- TypeScript >= 5.0
- iOS 13+ / Android API 23+

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT © 2026 [Muhittin Camdali](https://github.com/muhittincamdali)
