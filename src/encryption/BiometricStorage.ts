import { IStorage, BiometricOptions } from '../types';

type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: BiometricType;
}

export class BiometricStorage {
  private storage: IStorage;
  private options: BiometricOptions;
  private authenticated = false;
  private authTimeout: number;
  private lastAuthTime = 0;

  constructor(
    storage: IStorage,
    options?: BiometricOptions,
    authTimeoutMs = 300000
  ) {
    this.storage = storage;
    this.options = {
      promptTitle: 'Authenticate',
      promptSubtitle: 'Confirm your identity to access secure data',
      fallbackLabel: 'Use Passcode',
      accessControl: 'biometryOrPasscode',
      ...options,
    };
    this.authTimeout = authTimeoutMs;
  }

  async authenticate(): Promise<BiometricResult> {
    try {
      const Keychain = require('react-native-keychain');
      const supported = await Keychain.getSupportedBiometryType();

      if (!supported) {
        return { success: false, error: 'Biometric authentication not available' };
      }

      const result = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: this.options.promptTitle,
          subtitle: this.options.promptSubtitle,
          cancel: this.options.fallbackLabel,
        },
      });

      this.authenticated = !!result;
      this.lastAuthTime = Date.now();
      return {
        success: !!result,
        biometryType: supported as BiometricType,
      };
    } catch (error) {
      this.authenticated = false;
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureAuthenticated();
    return this.storage.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.ensureAuthenticated();
    await this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.storage.remove(key);
  }

  isAuthenticated(): boolean {
    if (!this.authenticated) return false;
    if (Date.now() - this.lastAuthTime > this.authTimeout) {
      this.authenticated = false;
      return false;
    }
    return true;
  }

  invalidateSession(): void {
    this.authenticated = false;
    this.lastAuthTime = 0;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      const result = await this.authenticate();
      if (!result.success) {
        throw new BiometricAuthError(result.error ?? 'Authentication failed');
      }
    }
  }
}

export class BiometricAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BiometricAuthError';
  }
}
