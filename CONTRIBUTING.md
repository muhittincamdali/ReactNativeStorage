# Contributing to ReactNativeStorage

Thank you for your interest in contributing! 📦

## Development Setup

```bash
# Clone the repository
git clone https://github.com/muhittincamdali/ReactNativeStorage.git
cd ReactNativeStorage

# Install dependencies
npm install

# Run tests
npm test

# Run example app
cd example && npm install && npm start
```

## Adding New Storage Backends

### 1. Create Backend Module

```typescript
// src/backends/MyBackend.ts
import { StorageBackend, StorageOptions } from '../types';

export class MyBackend implements StorageBackend {
  async get<T>(key: string): Promise<T | null> {
    // Implementation
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    // Implementation
  }
  
  async delete(key: string): Promise<void> {
    // Implementation
  }
  
  async clear(): Promise<void> {
    // Implementation
  }
}
```

### 2. Add Hook

```typescript
// src/hooks/useMyStorage.ts
export function useMyStorage<T>(key: string, initialValue: T) {
  // React hook implementation
}
```

### 3. Add Tests

```typescript
describe('MyBackend', () => {
  it('should store and retrieve values', async () => {
    const backend = new MyBackend();
    await backend.set('key', 'value');
    expect(await backend.get('key')).toBe('value');
  });
});
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments
- Use Prettier for formatting

## Pull Request Checklist

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Documentation updated
- [ ] CHANGELOG entry added

Thank you for contributing! 🙏
