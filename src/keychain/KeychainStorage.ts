import { KeychainEntry } from '../types';

interface KeychainModule {
  setGenericPassword(username: string, password: string, options?: Record<string, unknown>): Promise<boolean>;
  getGenericPassword(options?: Record<string, unknown>): Promise<{ username: string; password: string } | false>;
  resetGenericPassword(options?: Record<string, unknown>): Promise<boolean>;
  setInternetCredentials(server: string, username: string, password: string, options?: Record<string, unknown>): Promise<boolean>;
  getInternetCredentials(server: string, options?: Record<string, unknown>): Promise<{ username: string; password: string } | false>;
  resetInternetCredentials(server: string): Promise<boolean>;
  getSupportedBiometryType(): Promise<string | null>;
}

export class KeychainStorage {
  private keychain: KeychainModule | null = null;
  private service: string;
  private accessGroup?: string;

  constructor(service = 'com.app.storage', accessGroup?: string) {
    this.service = service;
    this.accessGroup = accessGroup;
  }

  async initialize(): Promise<void> {
    try {
      this.keychain = require('react-native-keychain');
    } catch {
      throw new KeychainError('react-native-keychain is not installed');
    }
  }

  private ensureInitialized(): void {
    if (!this.keychain) {
      throw new KeychainError('KeychainStorage not initialized. Call initialize() first.');
    }
  }

  async setCredentials(username: string, password: string): Promise<boolean> {
    this.ensureInitialized();
    return this.keychain!.setGenericPassword(username, password, {
      service: this.service,
      accessGroup: this.accessGroup,
    });
  }

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    this.ensureInitialized();
    const result = await this.keychain!.getGenericPassword({
      service: this.service,
      accessGroup: this.accessGroup,
    });
    return result || null;
  }

  async removeCredentials(): Promise<boolean> {
    this.ensureInitialized();
    return this.keychain!.resetGenericPassword({
      service: this.service,
    });
  }

  async setInternetCredentials(server: string, username: string, password: string): Promise<boolean> {
    this.ensureInitialized();
    return this.keychain!.setInternetCredentials(server, username, password, {
      accessGroup: this.accessGroup,
    });
  }

  async getInternetCredentials(server: string): Promise<{ username: string; password: string } | null> {
    this.ensureInitialized();
    const result = await this.keychain!.getInternetCredentials(server, {
      accessGroup: this.accessGroup,
    });
    return result || null;
  }

  async removeInternetCredentials(server: string): Promise<boolean> {
    this.ensureInitialized();
    return this.keychain!.resetInternetCredentials(server);
  }

  async storeEntry(entry: KeychainEntry): Promise<boolean> {
    this.ensureInitialized();
    return this.keychain!.setGenericPassword(entry.username, entry.password, {
      service: entry.service,
      accessGroup: entry.accessGroup ?? this.accessGroup,
    });
  }

  async retrieveEntry(service?: string): Promise<KeychainEntry | null> {
    this.ensureInitialized();
    const result = await this.keychain!.getGenericPassword({
      service: service ?? this.service,
    });

    if (!result) return null;

    return {
      service: service ?? this.service,
      username: result.username,
      password: result.password,
      accessGroup: this.accessGroup,
    };
  }

  async getSupportedBiometryType(): Promise<string | null> {
    this.ensureInitialized();
    return this.keychain!.getSupportedBiometryType();
  }

  async hasCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return creds !== null;
  }
}

export class KeychainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeychainError';
  }
}
