<div align="center">

# 📦 ReactNativeStorage

**Ultra-fast type-safe storage for React Native with MMKV, SQLite & encryption**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React Native](https://img.shields.io/badge/React_Native-0.73+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![npm](https://img.shields.io/badge/npm-Package-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://npmjs.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

- ⚡ **MMKV Backend** — 30x faster than AsyncStorage
- 🔐 **Encryption** — AES-256 secure storage
- 📊 **SQLite** — Relational data support
- 🎯 **Type-Safe** — Full TypeScript support
- 🔄 **Sync** — React hooks for reactive updates

---

## 🚀 Quick Start

```tsx
import { useStorage, secureStorage } from 'react-native-storage';

// Simple key-value
const [name, setName] = useStorage('name', '');

// Secure storage
await secureStorage.set('token', 'secret123');
const token = await secureStorage.get('token');

// SQLite
const db = useSQLite('app.db');
const users = await db.query('SELECT * FROM users');
```

---

## 📄 License

MIT • [@muhittincamdali](https://github.com/muhittincamdali)
