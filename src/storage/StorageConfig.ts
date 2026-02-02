import { StorageBackend, StorageConfig, Serializer } from '../types';
import { JsonSerializer } from '../utils/serializer';

const DEFAULT_CONFIG: StorageConfig = {
  backend: 'mmkv',
  enableLogging: false,
  defaultTTL: 0,
  maxRetries: 3,
  serializer: new JsonSerializer(),
};

export class StorageConfigBuilder {
  private config: StorageConfig;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  setBackend(backend: StorageBackend): this {
    this.config.backend = backend;
    return this;
  }

  setEncryptionKey(key: string): this {
    this.config.encryptionKey = key;
    return this;
  }

  setInstanceId(id: string): this {
    this.config.instanceId = id;
    return this;
  }

  setLogging(enabled: boolean): this {
    this.config.enableLogging = enabled;
    return this;
  }

  setDefaultTTL(ttl: number): this {
    this.config.defaultTTL = ttl;
    return this;
  }

  setMaxRetries(retries: number): this {
    this.config.maxRetries = retries;
    return this;
  }

  setSerializer(serializer: Serializer): this {
    this.config.serializer = serializer;
    return this;
  }

  build(): StorageConfig {
    return Object.freeze({ ...this.config });
  }
}

export function createDefaultConfig(overrides?: Partial<StorageConfig>): StorageConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}
