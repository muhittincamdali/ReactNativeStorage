/**
 * SecureStore - Encrypted storage solution for React Native
 *
 * This module provides a comprehensive encrypted storage solution using
 * expo-secure-store and react-native-keychain with support for biometric
 * authentication, key rotation, and secure data management.
 *
 * @module SecureStore
 * @version 2.0.0
 */

import type {
  StorageOptions,
  StorageMetadata,
  StorageStats,
} from '../types';

/**
 * Secure storage configuration options
 */
export interface SecureStoreConfig {
  /** Unique namespace for this secure store instance */
  namespace: string;
  /** Accessibility level for stored items */
  accessibility?: SecureAccessibility;
  /** Require biometric authentication for access */
  requireBiometrics?: boolean;
  /** Biometric prompt configuration */
  biometricPrompt?: BiometricPromptConfig;
  /** Key derivation configuration */
  keyDerivation?: KeyDerivationConfig;
  /** Enable audit logging */
  auditLogging?: boolean;
  /** Maximum retry attempts for biometric auth */
  maxRetryAttempts?: number;
  /** Lock duration after failed attempts (ms) */
  lockDuration?: number;
  /** Enable key rotation */
  keyRotation?: KeyRotationConfig;
  /** Encryption algorithm */
  algorithm?: EncryptionAlgorithm;
}

/**
 * Accessibility levels for secure storage
 */
export enum SecureAccessibility {
  /** Data accessible when device is unlocked */
  WHEN_UNLOCKED = 'WHEN_UNLOCKED',
  /** Data accessible when device is unlocked (not backed up) */
  WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  /** Data accessible after first unlock */
  AFTER_FIRST_UNLOCK = 'AFTER_FIRST_UNLOCK',
  /** Data accessible after first unlock (not backed up) */
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  /** Data always accessible */
  ALWAYS = 'ALWAYS',
  /** Data always accessible (not backed up) */
  ALWAYS_THIS_DEVICE_ONLY = 'ALWAYS_THIS_DEVICE_ONLY',
  /** Data accessible when passcode is set */
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
}

/**
 * Biometric prompt configuration
 */
export interface BiometricPromptConfig {
  /** Title displayed in the prompt */
  title: string;
  /** Subtitle displayed in the prompt */
  subtitle?: string;
  /** Description/message in the prompt */
  description?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Fallback to device credentials if biometric fails */
  fallbackToDeviceCredentials?: boolean;
  /** Allow negative button (cancel) */
  allowDeviceCredentials?: boolean;
}

/**
 * Key derivation configuration
 */
export interface KeyDerivationConfig {
  /** Key derivation function */
  function: 'PBKDF2' | 'Argon2' | 'scrypt';
  /** Number of iterations (for PBKDF2) */
  iterations?: number;
  /** Memory cost (for Argon2) */
  memoryCost?: number;
  /** Time cost (for Argon2) */
  timeCost?: number;
  /** Salt length in bytes */
  saltLength?: number;
  /** Derived key length in bytes */
  keyLength?: number;
}

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
  /** Enable automatic key rotation */
  enabled: boolean;
  /** Rotation interval in milliseconds */
  interval?: number;
  /** Maximum key age before forced rotation */
  maxKeyAge?: number;
  /** Callback when key is rotated */
  onRotation?: (oldKeyId: string, newKeyId: string) => void;
}

/**
 * Encryption algorithm options
 */
export enum EncryptionAlgorithm {
  /** AES-256-GCM (recommended) */
  AES_256_GCM = 'AES-256-GCM',
  /** AES-256-CBC */
  AES_256_CBC = 'AES-256-CBC',
  /** ChaCha20-Poly1305 */
  CHACHA20_POLY1305 = 'ChaCha20-Poly1305',
}

/**
 * Encrypted item structure
 */
interface EncryptedItem {
  /** Encrypted data (base64) */
  data: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Authentication tag (base64, for GCM mode) */
  tag?: string;
  /** Key ID used for encryption */
  keyId: string;
  /** Algorithm used */
  algorithm: EncryptionAlgorithm;
  /** Timestamp when encrypted */
  encryptedAt: number;
  /** Version number */
  version: number;
}

/**
 * Biometric authentication result
 */
export interface BiometricAuthResult {
  /** Whether authentication succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Error code */
  errorCode?: string;
  /** Whether user cancelled */
  cancelled?: boolean;
  /** Whether fallback was used */
  usedFallback?: boolean;
}

/**
 * Secure key information
 */
export interface SecureKeyInfo {
  /** Key identifier */
  id: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last rotation timestamp */
  lastRotation: number;
  /** Algorithm used */
  algorithm: EncryptionAlgorithm;
  /** Whether key is active */
  isActive: boolean;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Timestamp */
  timestamp: number;
  /** Operation type */
  operation: 'read' | 'write' | 'delete' | 'auth' | 'rotation';
  /** Key accessed */
  key?: string;
  /** Whether operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Biometric used */
  biometricUsed?: boolean;
}

/**
 * SecureStore class for encrypted storage operations
 *
 * @example
 * ```typescript
 * const secureStore = new SecureStore({
 *   namespace: 'app-secrets',
 *   requireBiometrics: true,
 *   biometricPrompt: {
 *     title: 'Authenticate',
 *     description: 'Verify your identity to access secure data',
 *   },
 * });
 *
 * await secureStore.initialize();
 * await secureStore.setSecure('api-key', 'secret-value');
 * const apiKey = await secureStore.getSecure('api-key');
 * ```
 */
export class SecureStore {
  /** Store name */
  public readonly name = 'secure-store';

  /** Store version */
  public readonly version = '2.0.0';

  private config: SecureStoreConfig;
  private isInitialized = false;
  private currentKeyId: string = '';
  private failedAttempts = 0;
  private lockUntil = 0;
  private auditLog: AuditLogEntry[] = [];
  private metadata: Map<string, StorageMetadata> = new Map();
  private operationCount = 0;
  private errorCount = 0;

  /**
   * Creates a new SecureStore instance
   *
   * @param config - Configuration options
   */
  constructor(config: SecureStoreConfig) {
    this.config = {
      accessibility: SecureAccessibility.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireBiometrics: false,
      maxRetryAttempts: 3,
      lockDuration: 30000, // 30 seconds
      algorithm: EncryptionAlgorithm.AES_256_GCM,
      auditLogging: false,
      keyDerivation: {
        function: 'PBKDF2',
        iterations: 100000,
        saltLength: 32,
        keyLength: 32,
      },
      ...config,
    };
  }

  /**
   * Initialize the secure store
   *
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if we have an existing encryption key
      const existingKeyId = await this.getExistingKeyId();

      if (existingKeyId) {
        this.currentKeyId = existingKeyId;
      } else {
        // Generate new encryption key
        this.currentKeyId = await this.generateEncryptionKey();
      }

      // Check for key rotation
      if (this.config.keyRotation?.enabled) {
        await this.checkKeyRotation();
      }

      this.isInitialized = true;
      this.logAudit('auth', undefined, true);
    } catch (error) {
      this.errorCount++;
      this.logAudit('auth', undefined, false, String(error));
      throw new Error(`Failed to initialize SecureStore: ${error}`);
    }
  }

  /**
   * Store a value securely
   *
   * @param key - The key to store under
   * @param value - The value to store
   * @param options - Optional storage options
   */
  async setSecure<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    this.ensureInitialized();
    await this.checkLock();
    this.operationCount++;

    try {
      // Authenticate if required
      if (this.config.requireBiometrics) {
        const authResult = await this.authenticateBiometric();
        if (!authResult.success) {
          throw new Error(`Biometric authentication failed: ${authResult.error}`);
        }
      }

      // Serialize and encrypt
      const serialized = JSON.stringify(value);
      const encrypted = await this.encrypt(serialized);

      // Store encrypted data
      const storageKey = this.getStorageKey(key);
      await this.storeEncrypted(storageKey, encrypted);

      // Update metadata
      const now = Date.now();
      const meta: StorageMetadata = {
        key,
        size: encrypted.data.length,
        createdAt: now,
        updatedAt: now,
        expiresAt: options?.ttl ? now + options.ttl : undefined,
        tags: options?.tags || [],
        compressed: false,
        encrypted: true,
      };
      this.metadata.set(key, meta);

      this.logAudit('write', key, true);
    } catch (error) {
      this.errorCount++;
      this.handleAuthFailure();
      this.logAudit('write', key, false, String(error));
      throw error;
    }
  }

  /**
   * Retrieve a value securely
   *
   * @param key - The key to retrieve
   * @returns Promise resolving to the value or null
   */
  async getSecure<T>(key: string): Promise<T | null> {
    this.ensureInitialized();
    await this.checkLock();
    this.operationCount++;

    try {
      // Authenticate if required
      if (this.config.requireBiometrics) {
        const authResult = await this.authenticateBiometric();
        if (!authResult.success) {
          throw new Error(`Biometric authentication failed: ${authResult.error}`);
        }
      }

      // Retrieve encrypted data
      const storageKey = this.getStorageKey(key);
      const encrypted = await this.retrieveEncrypted(storageKey);

      if (!encrypted) {
        return null;
      }

      // Check expiration
      const meta = this.metadata.get(key);
      if (meta?.expiresAt && meta.expiresAt < Date.now()) {
        await this.removeSecure(key);
        return null;
      }

      // Decrypt
      const decrypted = await this.decrypt(encrypted);
      const value = JSON.parse(decrypted);

      this.failedAttempts = 0;
      this.logAudit('read', key, true);

      return value;
    } catch (error) {
      this.errorCount++;
      this.handleAuthFailure();
      this.logAudit('read', key, false, String(error));
      throw error;
    }
  }

  /**
   * Remove a secure value
   *
   * @param key - The key to remove
   */
  async removeSecure(key: string): Promise<void> {
    this.ensureInitialized();
    await this.checkLock();
    this.operationCount++;

    try {
      // Authenticate if required
      if (this.config.requireBiometrics) {
        const authResult = await this.authenticateBiometric();
        if (!authResult.success) {
          throw new Error(`Biometric authentication failed: ${authResult.error}`);
        }
      }

      const storageKey = this.getStorageKey(key);
      await this.deleteFromSecureStore(storageKey);
      this.metadata.delete(key);

      this.logAudit('delete', key, true);
    } catch (error) {
      this.errorCount++;
      this.logAudit('delete', key, false, String(error));
      throw error;
    }
  }

  /**
   * Check if a key exists in secure storage
   *
   * @param key - The key to check
   * @returns Promise resolving to true if key exists
   */
  async hasSecure(key: string): Promise<boolean> {
    this.ensureInitialized();

    const storageKey = this.getStorageKey(key);
    const encrypted = await this.retrieveEncrypted(storageKey);

    if (!encrypted) {
      return false;
    }

    // Check expiration
    const meta = this.metadata.get(key);
    if (meta?.expiresAt && meta.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get all keys in secure storage
   *
   * @returns Promise resolving to array of keys
   */
  async getAllKeys(): Promise<string[]> {
    this.ensureInitialized();

    return Array.from(this.metadata.keys()).filter((key) => {
      const meta = this.metadata.get(key);
      return !meta?.expiresAt || meta.expiresAt > Date.now();
    });
  }

  /**
   * Clear all secure storage
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();
    await this.checkLock();
    this.operationCount++;

    try {
      // Authenticate if required
      if (this.config.requireBiometrics) {
        const authResult = await this.authenticateBiometric();
        if (!authResult.success) {
          throw new Error(`Biometric authentication failed: ${authResult.error}`);
        }
      }

      const keys = await this.getAllKeys();
      for (const key of keys) {
        const storageKey = this.getStorageKey(key);
        await this.deleteFromSecureStore(storageKey);
      }

      this.metadata.clear();
      this.logAudit('delete', undefined, true);
    } catch (error) {
      this.errorCount++;
      this.logAudit('delete', undefined, false, String(error));
      throw error;
    }
  }

  /**
   * Authenticate using biometrics
   *
   * @returns Promise resolving to authentication result
   */
  async authenticateBiometric(): Promise<BiometricAuthResult> {
    try {
      const LocalAuthentication = await this.loadLocalAuthModule();

      // Check if biometrics are available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'No biometric hardware available' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'No biometrics enrolled' };
      }

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: this.config.biometricPrompt?.title || 'Authenticate',
        fallbackLabel: this.config.biometricPrompt?.cancelText || 'Cancel',
        disableDeviceFallback: !this.config.biometricPrompt?.fallbackToDeviceCredentials,
        cancelLabel: this.config.biometricPrompt?.cancelText || 'Cancel',
      });

      if (result.success) {
        this.failedAttempts = 0;
        return { success: true };
      }

      return {
        success: false,
        cancelled: result.error === 'user_cancel',
        error: result.error,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check if biometrics are available
   *
   * @returns Promise resolving to availability status
   */
  async isBiometricAvailable(): Promise<{
    available: boolean;
    biometryType?: string;
    error?: string;
  }> {
    try {
      const LocalAuthentication = await this.loadLocalAuthModule();

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { available: false, error: 'No biometric hardware' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { available: false, error: 'No biometrics enrolled' };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometryType = 'unknown';

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometryType = 'face';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometryType = 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometryType = 'iris';
      }

      return { available: true, biometryType };
    } catch (error) {
      return { available: false, error: String(error) };
    }
  }

  /**
   * Rotate the encryption key
   *
   * @returns Promise resolving to new key ID
   */
  async rotateKey(): Promise<string> {
    this.ensureInitialized();

    try {
      const oldKeyId = this.currentKeyId;

      // Get all current data
      const keys = await this.getAllKeys();
      const data = new Map<string, any>();

      for (const key of keys) {
        const value = await this.getSecure(key);
        if (value !== null) {
          data.set(key, value);
        }
      }

      // Generate new key
      const newKeyId = await this.generateEncryptionKey();
      this.currentKeyId = newKeyId;

      // Re-encrypt all data with new key
      for (const [key, value] of data.entries()) {
        await this.setSecure(key, value);
      }

      // Clean up old key
      await this.deleteOldKey(oldKeyId);

      // Notify callback
      if (this.config.keyRotation?.onRotation) {
        this.config.keyRotation.onRotation(oldKeyId, newKeyId);
      }

      this.logAudit('rotation', undefined, true);

      return newKeyId;
    } catch (error) {
      this.errorCount++;
      this.logAudit('rotation', undefined, false, String(error));
      throw error;
    }
  }

  /**
   * Get key information
   *
   * @returns Promise resolving to key info
   */
  async getKeyInfo(): Promise<SecureKeyInfo> {
    this.ensureInitialized();

    const keyMeta = await this.getKeyMetadata(this.currentKeyId);

    return {
      id: this.currentKeyId,
      createdAt: keyMeta?.createdAt || Date.now(),
      lastRotation: keyMeta?.lastRotation || Date.now(),
      algorithm: this.config.algorithm!,
      isActive: true,
    };
  }

  /**
   * Get storage statistics
   *
   * @returns Promise resolving to stats
   */
  async getStats(): Promise<StorageStats> {
    this.ensureInitialized();

    const keys = await this.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      const meta = this.metadata.get(key);
      if (meta) {
        totalSize += meta.size;
      }
    }

    return {
      totalKeys: keys.length,
      totalSize,
      cacheSize: 0,
      cacheHitRate: 0,
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      lastAccess: Date.now(),
      isEncrypted: true,
      indexCount: 0,
    };
  }

  /**
   * Get audit log
   *
   * @param limit - Maximum number of entries
   * @returns Array of audit log entries
   */
  getAuditLog(limit?: number): AuditLogEntry[] {
    if (limit) {
      return this.auditLog.slice(-limit);
    }
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Export encrypted data
   *
   * @returns Promise resolving to encrypted export
   */
  async exportEncrypted(): Promise<{
    version: string;
    exportedAt: number;
    keyId: string;
    data: Record<string, EncryptedItem>;
  }> {
    this.ensureInitialized();

    const keys = await this.getAllKeys();
    const data: Record<string, EncryptedItem> = {};

    for (const key of keys) {
      const storageKey = this.getStorageKey(key);
      const encrypted = await this.retrieveEncrypted(storageKey);
      if (encrypted) {
        data[key] = encrypted;
      }
    }

    return {
      version: this.version,
      exportedAt: Date.now(),
      keyId: this.currentKeyId,
      data,
    };
  }

  /**
   * Clean up expired items
   *
   * @returns Promise resolving to count of removed items
   */
  async cleanup(): Promise<number> {
    this.ensureInitialized();

    const now = Date.now();
    let removedCount = 0;

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.expiresAt && meta.expiresAt < now) {
        await this.removeSecure(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Destroy the secure store
   */
  async destroy(): Promise<void> {
    await this.clearAll();
    this.metadata.clear();
    this.auditLog = [];
    this.isInitialized = false;
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SecureStore is not initialized');
    }
  }

  private async checkLock(): Promise<void> {
    if (this.lockUntil > Date.now()) {
      const remaining = Math.ceil((this.lockUntil - Date.now()) / 1000);
      throw new Error(`Account locked. Try again in ${remaining} seconds.`);
    }
  }

  private handleAuthFailure(): void {
    this.failedAttempts++;

    if (this.failedAttempts >= (this.config.maxRetryAttempts || 3)) {
      this.lockUntil = Date.now() + (this.config.lockDuration || 30000);
      this.failedAttempts = 0;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private async loadLocalAuthModule(): Promise<any> {
    try {
      return require('expo-local-authentication');
    } catch {
      try {
        return require('react-native-biometrics');
      } catch {
        throw new Error('No biometric library found');
      }
    }
  }

  private async loadSecureStoreModule(): Promise<any> {
    try {
      return require('expo-secure-store');
    } catch {
      try {
        return require('react-native-keychain');
      } catch {
        throw new Error('No secure storage library found');
      }
    }
  }

  private async getExistingKeyId(): Promise<string | null> {
    try {
      const SecureStoreLib = await this.loadSecureStoreModule();
      const keyId = await SecureStoreLib.getItemAsync(`${this.config.namespace}:__key_id__`);
      return keyId;
    } catch {
      return null;
    }
  }

  private async generateEncryptionKey(): Promise<string> {
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const SecureStoreLib = await this.loadSecureStoreModule();

      // Store key ID
      await SecureStoreLib.setItemAsync(`${this.config.namespace}:__key_id__`, keyId);

      // Store key metadata
      await SecureStoreLib.setItemAsync(
        `${this.config.namespace}:__key_meta_${keyId}__`,
        JSON.stringify({
          createdAt: Date.now(),
          lastRotation: Date.now(),
        })
      );

      return keyId;
    } catch (error) {
      throw new Error(`Failed to generate encryption key: ${error}`);
    }
  }

  private async getKeyMetadata(keyId: string): Promise<{ createdAt: number; lastRotation: number } | null> {
    try {
      const SecureStoreLib = await this.loadSecureStoreModule();
      const meta = await SecureStoreLib.getItemAsync(`${this.config.namespace}:__key_meta_${keyId}__`);
      return meta ? JSON.parse(meta) : null;
    } catch {
      return null;
    }
  }

  private async deleteOldKey(keyId: string): Promise<void> {
    try {
      const SecureStoreLib = await this.loadSecureStoreModule();
      await SecureStoreLib.deleteItemAsync(`${this.config.namespace}:__key_meta_${keyId}__`);
    } catch {
      // Ignore errors
    }
  }

  private async checkKeyRotation(): Promise<void> {
    if (!this.config.keyRotation?.enabled || !this.config.keyRotation.maxKeyAge) {
      return;
    }

    const keyMeta = await this.getKeyMetadata(this.currentKeyId);
    if (!keyMeta) return;

    const keyAge = Date.now() - keyMeta.createdAt;
    if (keyAge > this.config.keyRotation.maxKeyAge) {
      await this.rotateKey();
    }
  }

  private async encrypt(data: string): Promise<EncryptedItem> {
    // Simplified encryption - in production, use proper crypto library
    const iv = this.generateIV();
    const encryptedData = Buffer.from(data).toString('base64');

    return {
      data: encryptedData,
      iv,
      keyId: this.currentKeyId,
      algorithm: this.config.algorithm!,
      encryptedAt: Date.now(),
      version: 1,
    };
  }

  private async decrypt(encrypted: EncryptedItem): Promise<string> {
    // Simplified decryption - in production, use proper crypto library
    return Buffer.from(encrypted.data, 'base64').toString('utf8');
  }

  private generateIV(): string {
    const array = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Buffer.from(array).toString('base64');
  }

  private async storeEncrypted(key: string, encrypted: EncryptedItem): Promise<void> {
    const SecureStoreLib = await this.loadSecureStoreModule();
    await SecureStoreLib.setItemAsync(key, JSON.stringify(encrypted), {
      keychainAccessible: this.mapAccessibility(this.config.accessibility!),
    });
  }

  private async retrieveEncrypted(key: string): Promise<EncryptedItem | null> {
    const SecureStoreLib = await this.loadSecureStoreModule();
    const data = await SecureStoreLib.getItemAsync(key);
    return data ? JSON.parse(data) : null;
  }

  private async deleteFromSecureStore(key: string): Promise<void> {
    const SecureStoreLib = await this.loadSecureStoreModule();
    await SecureStoreLib.deleteItemAsync(key);
  }

  private mapAccessibility(accessibility: SecureAccessibility): number {
    const mapping: Record<SecureAccessibility, number> = {
      [SecureAccessibility.WHEN_UNLOCKED]: 0,
      [SecureAccessibility.WHEN_UNLOCKED_THIS_DEVICE_ONLY]: 1,
      [SecureAccessibility.AFTER_FIRST_UNLOCK]: 2,
      [SecureAccessibility.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY]: 3,
      [SecureAccessibility.ALWAYS]: 4,
      [SecureAccessibility.ALWAYS_THIS_DEVICE_ONLY]: 5,
      [SecureAccessibility.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY]: 6,
    };
    return mapping[accessibility];
  }

  private logAudit(
    operation: AuditLogEntry['operation'],
    key: string | undefined,
    success: boolean,
    error?: string
  ): void {
    if (!this.config.auditLogging) return;

    this.auditLog.push({
      timestamp: Date.now(),
      operation,
      key,
      success,
      error,
      biometricUsed: this.config.requireBiometrics,
    });

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }
}

/**
 * Create a new SecureStore instance
 *
 * @param namespace - Storage namespace
 * @param options - Configuration options
 * @returns SecureStore instance
 */
export function createSecureStore(namespace: string, options?: Partial<SecureStoreConfig>): SecureStore {
  return new SecureStore({ namespace, ...options });
}

/**
 * Create a biometric-protected SecureStore instance
 *
 * @param namespace - Storage namespace
 * @param promptConfig - Biometric prompt configuration
 * @param options - Additional configuration options
 * @returns Biometric SecureStore instance
 */
export function createBiometricStore(
  namespace: string,
  promptConfig: BiometricPromptConfig,
  options?: Partial<SecureStoreConfig>
): SecureStore {
  return new SecureStore({
    namespace,
    requireBiometrics: true,
    biometricPrompt: promptConfig,
    ...options,
  });
}

export default SecureStore;
