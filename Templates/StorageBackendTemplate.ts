// StorageBackendTemplate.ts
// ReactNativeStorage
//
// Template for creating custom storage backends

import { EventEmitter } from 'events';

// ============================================================
// TYPES
// ============================================================

/**
 * Storage backend interface.
 * Implement this interface to create custom storage backends.
 */
export interface StorageBackend<T = unknown> {
  /** Get a value from storage */
  get<V = T>(key: string): Promise<V | null>;
  
  /** Set a value in storage */
  set<V = T>(key: string, value: V): Promise<void>;
  
  /** Delete a value from storage */
  delete(key: string): Promise<void>;
  
  /** Check if a key exists */
  has(key: string): Promise<boolean>;
  
  /** Get all keys */
  keys(): Promise<string[]>;
  
  /** Clear all storage */
  clear(): Promise<void>;
}

/**
 * Storage options for configuration.
 */
export interface StorageOptions {
  /** Storage namespace/ID */
  id?: string;
  
  /** Enable encryption */
  encryption?: boolean;
  
  /** Encryption key */
  encryptionKey?: string;
  
  /** Enable logging */
  logging?: boolean;
}

/**
 * Storage event types.
 */
export type StorageEvent = 
  | { type: 'set'; key: string; value: unknown }
  | { type: 'delete'; key: string }
  | { type: 'clear' };

// ============================================================
// CUSTOM BACKEND TEMPLATE
// ============================================================

/**
 * Template for creating a custom storage backend.
 * 
 * @example
 * ```typescript
 * const storage = new CustomStorageBackend({
 *   id: 'my-storage',
 *   encryption: true,
 * });
 * 
 * await storage.set('user', { name: 'John' });
 * const user = await storage.get('user');
 * ```
 */
export class CustomStorageBackend<T = unknown> implements StorageBackend<T> {
  private readonly id: string;
  private readonly options: StorageOptions;
  private readonly emitter: EventEmitter;
  
  // In-memory cache (replace with actual storage)
  private cache: Map<string, string> = new Map();
  
  constructor(options: StorageOptions = {}) {
    this.id = options.id || 'default';
    this.options = options;
    this.emitter = new EventEmitter();
    
    this.log('Storage initialized with id:', this.id);
  }
  
  // --------------------------------------------------------
  // PUBLIC METHODS
  // --------------------------------------------------------
  
  /**
   * Get a value from storage.
   * 
   * @param key - The key to retrieve
   * @returns The value or null if not found
   */
  async get<V = T>(key: string): Promise<V | null> {
    this.log('Getting key:', key);
    
    const fullKey = this.getFullKey(key);
    const raw = this.cache.get(fullKey);
    
    if (raw === undefined) {
      return null;
    }
    
    try {
      const decrypted = await this.decrypt(raw);
      return JSON.parse(decrypted) as V;
    } catch (error) {
      this.logError('Error parsing value for key:', key, error);
      return null;
    }
  }
  
  /**
   * Set a value in storage.
   * 
   * @param key - The key to set
   * @param value - The value to store
   */
  async set<V = T>(key: string, value: V): Promise<void> {
    this.log('Setting key:', key);
    
    const fullKey = this.getFullKey(key);
    const serialized = JSON.stringify(value);
    const encrypted = await this.encrypt(serialized);
    
    this.cache.set(fullKey, encrypted);
    
    this.emit({ type: 'set', key, value });
  }
  
  /**
   * Delete a value from storage.
   * 
   * @param key - The key to delete
   */
  async delete(key: string): Promise<void> {
    this.log('Deleting key:', key);
    
    const fullKey = this.getFullKey(key);
    this.cache.delete(fullKey);
    
    this.emit({ type: 'delete', key });
  }
  
  /**
   * Check if a key exists in storage.
   * 
   * @param key - The key to check
   * @returns True if the key exists
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return this.cache.has(fullKey);
  }
  
  /**
   * Get all keys in storage.
   * 
   * @returns Array of keys
   */
  async keys(): Promise<string[]> {
    const prefix = `${this.id}:`;
    return Array.from(this.cache.keys())
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }
  
  /**
   * Clear all values in storage.
   */
  async clear(): Promise<void> {
    this.log('Clearing storage');
    
    const prefix = `${this.id}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    
    this.emit({ type: 'clear' });
  }
  
  // --------------------------------------------------------
  // EVENT HANDLING
  // --------------------------------------------------------
  
  /**
   * Subscribe to storage events.
   * 
   * @param callback - Event handler
   * @returns Unsubscribe function
   */
  subscribe(callback: (event: StorageEvent) => void): () => void {
    this.emitter.on('change', callback);
    return () => this.emitter.off('change', callback);
  }
  
  // --------------------------------------------------------
  // PRIVATE METHODS
  // --------------------------------------------------------
  
  private getFullKey(key: string): string {
    return `${this.id}:${key}`;
  }
  
  private async encrypt(data: string): Promise<string> {
    if (!this.options.encryption) {
      return data;
    }
    
    // Implement actual encryption
    // Example: Use crypto-js or react-native-crypto
    return Buffer.from(data).toString('base64');
  }
  
  private async decrypt(data: string): Promise<string> {
    if (!this.options.encryption) {
      return data;
    }
    
    // Implement actual decryption
    return Buffer.from(data, 'base64').toString('utf8');
  }
  
  private emit(event: StorageEvent): void {
    this.emitter.emit('change', event);
  }
  
  private log(...args: unknown[]): void {
    if (this.options.logging) {
      console.log('[Storage]', ...args);
    }
  }
  
  private logError(...args: unknown[]): void {
    if (this.options.logging) {
      console.error('[Storage Error]', ...args);
    }
  }
}

// ============================================================
// REACT HOOK TEMPLATE
// ============================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for using custom storage.
 * 
 * @example
 * ```typescript
 * function Profile() {
 *   const [user, setUser, removeUser] = useCustomStorage<User>('user');
 *   
 *   return (
 *     <View>
 *       <Text>{user?.name}</Text>
 *       <Button onPress={() => setUser({ name: 'Jane' })} />
 *     </View>
 *   );
 * }
 * ```
 */
export function useCustomStorage<T>(
  key: string,
  initialValue?: T,
  storage: StorageBackend<T> = new CustomStorageBackend()
): [T | null, (value: T) => Promise<void>, () => Promise<void>] {
  const [value, setValue] = useState<T | null>(initialValue ?? null);
  const [loading, setLoading] = useState(true);
  
  // Load initial value
  useEffect(() => {
    let mounted = true;
    
    async function load() {
      try {
        const stored = await storage.get<T>(key);
        if (mounted) {
          setValue(stored ?? initialValue ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading storage:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    load();
    
    return () => {
      mounted = false;
    };
  }, [key]);
  
  // Set value
  const set = useCallback(async (newValue: T) => {
    try {
      await storage.set(key, newValue);
      setValue(newValue);
    } catch (error) {
      console.error('Error setting storage:', error);
      throw error;
    }
  }, [key, storage]);
  
  // Remove value
  const remove = useCallback(async () => {
    try {
      await storage.delete(key);
      setValue(null);
    } catch (error) {
      console.error('Error removing storage:', error);
      throw error;
    }
  }, [key, storage]);
  
  return [value, set, remove];
}

// ============================================================
// USAGE EXAMPLE
// ============================================================

/*
// Create storage instance
const storage = new CustomStorageBackend({
  id: 'app-storage',
  encryption: true,
  encryptionKey: 'your-secret-key',
  logging: __DEV__,
});

// Use directly
await storage.set('user', { id: 1, name: 'John' });
const user = await storage.get('user');
console.log(user); // { id: 1, name: 'John' }

// Use with hook
function App() {
  const [settings, setSettings] = useCustomStorage('settings', {
    theme: 'dark',
    notifications: true,
  });
  
  return (
    <Button
      title="Toggle Theme"
      onPress={() => setSettings({
        ...settings,
        theme: settings?.theme === 'dark' ? 'light' : 'dark',
      })}
    />
  );
}

// Subscribe to changes
const unsubscribe = storage.subscribe((event) => {
  console.log('Storage changed:', event);
});

// Later: unsubscribe
unsubscribe();
*/

export default CustomStorageBackend;
