# ReactNativeStorage API Documentation

## MMKV Storage

### Basic Usage

```typescript
import { MMKVStorage } from 'react-native-storage';

// Initialize
const storage = new MMKVStorage();

// Store value
await storage.set('user', { id: 1, name: 'John' });

// Retrieve value
const user = await storage.get<User>('user');

// Delete value
await storage.delete('user');

// Clear all
await storage.clear();
```

### With Encryption

```typescript
const storage = new MMKVStorage({
  id: 'secure-storage',
  encryptionKey: 'your-256-bit-key',
});
```

### React Hook

```typescript
function UserProfile() {
  const [user, setUser, removeUser] = useMMKV<User>('user');
  
  return (
    <View>
      <Text>{user?.name}</Text>
      <Button onPress={() => setUser({ name: 'Jane' })} />
    </View>
  );
}
```

## SQLite Storage

### Schema Definition

```typescript
import { SQLiteStorage, Schema } from 'react-native-storage';

const userSchema: Schema = {
  name: 'users',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'email', type: 'TEXT', unique: true },
    { name: 'createdAt', type: 'TEXT' },
  ],
};

const db = new SQLiteStorage({
  name: 'app.db',
  schemas: [userSchema],
});
```

### CRUD Operations

```typescript
// Create
await db.insert('users', { name: 'John', email: 'john@example.com' });

// Read
const users = await db.select<User>('users', {
  where: { name: 'John' },
  orderBy: 'createdAt DESC',
  limit: 10,
});

// Update
await db.update('users', { name: 'Jane' }, { where: { id: 1 } });

// Delete
await db.delete('users', { where: { id: 1 } });
```

### Transactions

```typescript
await db.transaction(async (tx) => {
  await tx.insert('users', user1);
  await tx.insert('users', user2);
  // Rolls back if any operation fails
});
```

## Secure Storage

### Basic Usage

```typescript
import { SecureStorage } from 'react-native-storage';

// Store securely
await SecureStorage.setItem('authToken', token);

// Retrieve
const token = await SecureStorage.getItem('authToken');

// With biometric
await SecureStorage.setItem('sensitiveData', data, {
  biometric: true,
  biometricPrompt: 'Authenticate to access data',
});
```

## File Storage

### File Operations

```typescript
import { FileStorage } from 'react-native-storage';

// Save file
await FileStorage.saveFile('documents/report.pdf', fileData);

// Read file
const data = await FileStorage.readFile('documents/report.pdf');

// Delete file
await FileStorage.deleteFile('documents/report.pdf');

// List files
const files = await FileStorage.listFiles('documents');
```

### Image Caching

```typescript
import { ImageCache } from 'react-native-storage';

// Cache image
await ImageCache.cache('https://example.com/image.jpg');

// Get cached path
const localPath = await ImageCache.getPath('https://example.com/image.jpg');

// Clear cache
await ImageCache.clear();
```

## Hooks

| Hook | Description |
|------|-------------|
| `useMMKV<T>` | MMKV storage hook |
| `useSQLite<T>` | SQLite query hook |
| `useSecure<T>` | Secure storage hook |
| `useFileStorage` | File storage hook |
| `useImageCache` | Image caching hook |

## Configuration

```typescript
import { configure } from 'react-native-storage';

configure({
  defaultBackend: 'mmkv',
  encryption: true,
  logging: __DEV__,
  migrations: [
    // Migration scripts
  ],
});
```
