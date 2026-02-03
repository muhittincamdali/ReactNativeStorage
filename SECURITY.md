# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities to: security@muhittincamdali.com

**Do NOT open public issues for security vulnerabilities.**

## Security Features

### Secure Storage
- Uses iOS Keychain and Android Keystore
- AES-256 encryption for sensitive data
- Biometric authentication support

### Best Practices

```typescript
// ✅ Use secure storage for sensitive data
import { SecureStorage } from 'react-native-storage';

await SecureStorage.setItem('authToken', token, {
  biometric: true,
  accessibility: 'whenUnlockedThisDeviceOnly',
});

// ❌ Don't use plain storage for sensitive data
await AsyncStorage.setItem('authToken', token);
```

### Encryption

```typescript
// Enable encryption for MMKV
const storage = new MMKVStorage({
  encryptionKey: 'your-secret-key',
});
```

Thank you for helping keep ReactNativeStorage secure! 🛡️
