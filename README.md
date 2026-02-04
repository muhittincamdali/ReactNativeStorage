<p align="center">
  <img src="assets/logo.png" alt="ReactNativeStorage" width="200"/>
</p>

<h1 align="center">ReactNativeStorage</h1>

<p align="center">
  <strong>📦 Ultra-fast type-safe storage for React Native with MMKV, SQLite & encryption</strong>
</p>

<p align="center">
  <a href="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml">
    <img src="https://github.com/muhittincamdali/ReactNativeStorage/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <img src="https://img.shields.io/badge/React_Native-0.75-blue.svg" alt="React Native"/>
</p>

---

## Why ReactNativeStorage?

AsyncStorage is slow. MMKV is fast but low-level. SQLite needs SQL knowledge. **ReactNativeStorage** provides a unified, type-safe API with multiple backends.

```typescript
// Simple API
const storage = createStorage<User>('users');
await storage.set('user_1', user);
const user = await storage.get('user_1');

// With hooks
const [user, setUser] = useStorage<User>('currentUser');
```

## Features

| Feature | Description |
|---------|-------------|
| ⚡ **MMKV Backend** | 30x faster than AsyncStorage |
| 🗃️ **SQLite** | Complex queries support |
| 🔐 **Encryption** | Secure storage option |
| 📝 **TypeScript** | Full type safety |
| ⚛️ **Hooks** | React state integration |
| 🔄 **Migrations** | Schema versioning |

## Quick Start

```typescript
import { createStorage } from 'react-native-storage';

interface User {
  id: string;
  name: string;
  email: string;
}

// Create typed storage
const userStorage = createStorage<User>('users');

// Set
await userStorage.set('user_1', { id: '1', name: 'John', email: 'john@example.com' });

// Get
const user = await userStorage.get('user_1');

// Delete
await userStorage.delete('user_1');

// Get all
const allUsers = await userStorage.getAll();
```

## React Hooks

```typescript
import { useStorage, useStorageItem } from 'react-native-storage';

function ProfileScreen() {
  // Single item
  const [user, setUser, loading] = useStorageItem<User>('currentUser');
  
  // Collection
  const [users] = useStorage<User[]>('users', []);
  
  return (
    <View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text>{user?.name}</Text>
      )}
    </View>
  );
}
```

## Backends

### MMKV (Default - Fastest)

```typescript
const storage = createStorage('data', { backend: 'mmkv' });
```

### SQLite (Complex Queries)

```typescript
const storage = createStorage('data', { 
  backend: 'sqlite',
  tableName: 'users'
});

// Query support
const adults = await storage.query({
  where: { age: { $gte: 18 } },
  orderBy: 'name',
  limit: 10
});
```

### Encrypted

```typescript
const secureStorage = createStorage('secrets', {
  backend: 'mmkv',
  encryption: {
    key: 'your-encryption-key'
  }
});
```

## Migrations

```typescript
const storage = createStorage('users', {
  version: 2,
  migrations: {
    1: (data) => ({ ...data, newField: 'default' }),
    2: (data) => ({ ...data, renamedField: data.oldField })
  }
});
```

## Persistence

```typescript
// Zustand integration
import { persist } from 'zustand/middleware';
import { createStorageAdapter } from 'react-native-storage';

const useStore = create(
  persist(
    (set) => ({ count: 0 }),
    { storage: createStorageAdapter() }
  )
);
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License

---

## 📈 Star History

<a href="https://star-history.com/#muhittincamdali/ReactNativeStorage&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=muhittincamdali/ReactNativeStorage&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=muhittincamdali/ReactNativeStorage&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=muhittincamdali/ReactNativeStorage&type=Date" />
 </picture>
</a>
