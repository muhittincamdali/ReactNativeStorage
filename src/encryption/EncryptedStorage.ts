import { IStorage, StorageConfig, StorageEntry } from '../types';
import { createDefaultConfig } from '../storage/StorageConfig';
import { JsonSerializer } from '../utils/serializer';

interface CryptoModule {
  encrypt(data: string, key: string): string;
  decrypt(data: string, key: string): string;
  generateKey(length: number): string;
  hash(data: string, algorithm: string): string;
}

export class EncryptedStorage implements IStorage {
  private storage: IStorage;
  private encryptionKey: string;
  private config: StorageConfig;
  private serializer: JsonSerializer;
  private crypto: CryptoModule | null = null;

  constructor(storage: IStorage, encryptionKey: string, config?: Partial<StorageConfig>) {
    this.storage = storage;
    this.encryptionKey = encryptionKey;
    this.config = createDefaultConfig({ ...config, backend: 'encrypted' });
    this.serializer = new JsonSerializer();
  }

  async initialize(): Promise<void> {
    try {
      this.crypto = require('react-native-aes-crypto');
      this.log('Encryption module loaded');
    } catch {
      this.crypto = this.createFallbackCrypto();
      this.log('Using fallback encryption (base64 only - not secure for production)');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const hashedKey = this.hashKey(key);
    const encrypted = await this.storage.get<string>(hashedKey);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      const entry = this.serializer.deserialize<StorageEntry<T>>(decrypted);
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const hashedKey = this.hashKey(key);
    const entry: StorageEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      encrypted: true,
    };

    const serialized = this.serializer.serialize(entry);
    const encrypted = this.encrypt(serialized);
    await this.storage.set(hashedKey, encrypted, ttl);
  }

  async remove(key: string): Promise<void> {
    const hashedKey = this.hashKey(key);
    await this.storage.remove(hashedKey);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }

  async has(key: string): Promise<boolean> {
    const hashedKey = this.hashKey(key);
    return this.storage.has(hashedKey);
  }

  async keys(): Promise<string[]> {
    return this.storage.keys();
  }

  async getMultiple<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, await this.get<T>(key));
    }
    return results;
  }

  async setMultiple<T>(entries: Array<{ key: string; value: T }>): Promise<void> {
    for (const { key, value } of entries) {
      await this.set(key, value);
    }
  }

  private encrypt(data: string): string {
    if (this.crypto) {
      return this.crypto.encrypt(data, this.encryptionKey);
    }
    return Buffer.from(data).toString('base64');
  }

  private decrypt(data: string): string {
    if (this.crypto) {
      return this.crypto.decrypt(data, this.encryptionKey);
    }
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `enc_${Math.abs(hash).toString(36)}`;
  }

  private createFallbackCrypto(): CryptoModule {
    return {
      encrypt: (data: string, _key: string) => Buffer.from(data).toString('base64'),
      decrypt: (data: string, _key: string) => Buffer.from(data, 'base64').toString('utf-8'),
      generateKey: (length: number) => Array.from({ length }, () => Math.random().toString(36)[2]).join(''),
      hash: (data: string, _algorithm: string) => Buffer.from(data).toString('base64'),
    };
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.warn(`[EncryptedStorage] ${message}`);
    }
  }
}
