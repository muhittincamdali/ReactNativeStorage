/**
 * Advanced Usage Examples for ReactNativeStorage
 *
 * This file demonstrates advanced patterns including encryption,
 * cloud sync, migrations, and custom providers.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { StorageProvider } from '../src/types';
import { SecureStore, createBiometricStore } from '../src/encryption/SecureStore';
import { CloudSync, CloudProvider, SyncStrategy } from '../src/sync/CloudSync';
import { MigrationManager, createMigrationManager } from '../src/migration/MigrationManager';

// ============================================================================
// Example 1: Storage Context Provider Pattern
// ============================================================================

interface StorageContextValue {
  storage: StorageProvider | null;
  secureStorage: SecureStore | null;
  isReady: boolean;
}

const StorageContext = createContext<StorageContextValue>({
  storage: null,
  secureStorage: null,
  isReady: false,
});

/**
 * Custom hook for accessing storage context
 */
export function useStorageContext() {
  const context = useContext(StorageContext);
  if (!context.isReady) {
    throw new Error('Storage context is not ready');
  }
  return context;
}

interface StorageProviderWrapperProps {
  children: React.ReactNode;
  storage: StorageProvider;
}

/**
 * Storage provider wrapper that initializes storage and provides context
 */
export function StorageProviderWrapper({ children, storage }: StorageProviderWrapperProps) {
  const [isReady, setIsReady] = useState(false);
  const [secureStorage, setSecureStorage] = useState<SecureStore | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Initialize main storage
        if ('initialize' in storage) {
          await (storage as any).initialize();
        }

        // Initialize secure storage for sensitive data
        const secure = createBiometricStore('app-secrets', {
          title: 'Authenticate',
          description: 'Verify your identity to access secure data',
        });
        await secure.initialize();
        setSecureStorage(secure);

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        Alert.alert('Error', 'Failed to initialize storage');
      }
    };

    initializeStorage();
  }, [storage]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing storage...</Text>
      </View>
    );
  }

  return (
    <StorageContext.Provider value={{ storage, secureStorage, isReady }}>
      {children}
    </StorageContext.Provider>
  );
}

// ============================================================================
// Example 2: Secure Storage with Biometrics
// ============================================================================

interface SecureStorageExampleProps {
  secureStore: SecureStore;
}

/**
 * Demonstrates secure storage with biometric authentication
 */
export function SecureStorageExample({ secureStore }: SecureStorageExampleProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const result = await secureStore.isBiometricAvailable();
    setBiometricAvailable(result.available);
  };

  const handleLoadSecret = async () => {
    setLoading(true);
    try {
      const key = await secureStore.getSecure<string>('api-key');
      setApiKey(key);
      Alert.alert('Success', key ? 'Secret loaded' : 'No secret found');
    } catch (error) {
      Alert.alert('Error', 'Failed to load secret. Authentication may have failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecret = async () => {
    setLoading(true);
    try {
      const newKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await secureStore.setSecure('api-key', newKey);
      setApiKey(newKey);
      Alert.alert('Success', 'Secret saved securely');
    } catch (error) {
      Alert.alert('Error', 'Failed to save secret');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSecret = async () => {
    setLoading(true);
    try {
      await secureStore.removeSecure('api-key');
      setApiKey(null);
      Alert.alert('Success', 'Secret deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Secure Storage</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Biometric Authentication</Text>
        <Text style={[styles.infoValue, { color: biometricAvailable ? '#34C759' : '#FF3B30' }]}>
          {biometricAvailable ? 'Available' : 'Not Available'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Current Secret</Text>
        <Text style={styles.infoValue}>
          {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : (
        <View style={styles.buttonColumn}>
          <TouchableOpacity style={styles.button} onPress={handleLoadSecret}>
            <Text style={styles.buttonText}>Load Secret</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleSaveSecret}>
            <Text style={styles.buttonText}>Generate & Save Secret</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleDeleteSecret}>
            <Text style={styles.buttonText}>Delete Secret</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Example 3: Cloud Sync with Conflict Resolution
// ============================================================================

interface CloudSyncExampleProps {
  storage: StorageProvider;
}

/**
 * Demonstrates cloud synchronization with Firebase
 */
export function CloudSyncExample({ storage }: CloudSyncExampleProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [cloudSync, setCloudSync] = useState<CloudSync | null>(null);

  useEffect(() => {
    // Initialize cloud sync (would need actual Firebase config)
    const sync = new CloudSync({
      provider: CloudProvider.CUSTOM_REST,
      providerConfig: {
        type: 'custom_rest',
        baseUrl: 'https://api.example.com',
        endpoints: {
          get: '/storage/get',
          set: '/storage/set',
          delete: '/storage/delete',
          list: '/storage/list',
          sync: '/storage/sync',
        },
      },
      strategy: SyncStrategy.INCREMENTAL,
      conflictResolution: 'last_write_wins' as any,
      realtime: false,
      offlineQueue: true,
      callbacks: {
        onSyncStart: () => setSyncStatus('syncing'),
        onSyncComplete: (result) => {
          setSyncStatus(result.success ? 'success' : 'error');
          setLastSync(new Date());
        },
        onSyncError: () => setSyncStatus('error'),
        onProgress: (progress) => {
          console.log(`Sync progress: ${progress.percentage}%`);
        },
      },
    });

    setCloudSync(sync);

    return () => {
      sync.destroy();
    };
  }, [storage]);

  const handleSync = async () => {
    if (!cloudSync) return;

    try {
      await cloudSync.sync();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync with cloud');
    }
  };

  const handleCheckStatus = () => {
    if (!cloudSync) return;

    const status = cloudSync.getStatus();
    setPendingChanges(status.pendingChanges);

    Alert.alert(
      'Sync Status',
      `Connected: ${status.isConnected}\nPending: ${status.pendingChanges}\nLast Sync: ${
        status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'
      }`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cloud Sync</Text>

      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, styles[`status_${syncStatus}`]]} />
        <Text style={styles.statusText}>
          {syncStatus === 'idle' && 'Ready to sync'}
          {syncStatus === 'syncing' && 'Syncing...'}
          {syncStatus === 'success' && 'Sync complete'}
          {syncStatus === 'error' && 'Sync failed'}
        </Text>
      </View>

      {lastSync && (
        <Text style={styles.lastSyncText}>
          Last sync: {lastSync.toLocaleTimeString()}
        </Text>
      )}

      {pendingChanges > 0 && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>{pendingChanges} pending changes</Text>
        </View>
      )}

      <View style={styles.buttonColumn}>
        <TouchableOpacity
          style={[styles.button, syncStatus === 'syncing' && styles.buttonDisabled]}
          onPress={handleSync}
          disabled={syncStatus === 'syncing'}
        >
          <Text style={styles.buttonText}>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleCheckStatus}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Check Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Example 4: Data Migration
// ============================================================================

interface MigrationExampleProps {
  storage: StorageProvider;
}

/**
 * Demonstrates schema migrations
 */
export function MigrationExample({ storage }: MigrationExampleProps) {
  const [currentVersion, setCurrentVersion] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [migrationManager, setMigrationManager] = useState<MigrationManager | null>(null);

  useEffect(() => {
    const manager = createMigrationManager(storage, [
      {
        version: 1,
        name: 'Initial schema',
        description: 'Create initial data structure',
        up: async (ctx) => {
          ctx.log('Creating initial schema...');
          // Migration logic here
        },
        down: async (ctx) => {
          ctx.log('Reverting initial schema...');
        },
      },
      {
        version: 2,
        name: 'Add user preferences',
        description: 'Add user preferences field to settings',
        up: async (ctx) => {
          await ctx.helpers.addField(/^settings:/, 'preferences', {});
        },
        down: async (ctx) => {
          await ctx.helpers.removeField(/^settings:/, 'preferences');
        },
      },
      {
        version: 3,
        name: 'Rename keys',
        description: 'Rename old keys to new format',
        up: async (ctx) => {
          await ctx.helpers.transformAll(/^user_/, (key, value) => {
            return { ...value, migrated: true };
          });
        },
        down: async (ctx) => {
          await ctx.helpers.transformAll(/^user_/, (key, value: any) => {
            const { migrated, ...rest } = value;
            return rest;
          });
        },
      },
    ]);

    manager.initialize().then(() => {
      setMigrationManager(manager);
      setCurrentVersion(manager.getCurrentVersion());
      setHistory(manager.getHistory());
    });
  }, [storage]);

  const handleMigrate = async (targetVersion: number) => {
    if (!migrationManager) return;

    setMigrating(true);
    try {
      const result = await migrationManager.migrate(targetVersion);

      if (result.success) {
        Alert.alert('Success', `Migrated to version ${targetVersion}`);
      } else {
        Alert.alert('Error', `Migration failed: ${result.errors[0]?.message}`);
      }

      setCurrentVersion(migrationManager.getCurrentVersion());
      setHistory(migrationManager.getHistory());
    } catch (error) {
      Alert.alert('Error', 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const handleValidate = async () => {
    if (!migrationManager) return;

    const result = await migrationManager.validate();
    Alert.alert(
      result.valid ? 'Valid' : 'Invalid',
      result.valid ? 'All migrations are valid' : result.errors.join('\n')
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Data Migration</Text>

      <View style={styles.versionCard}>
        <Text style={styles.versionLabel}>Current Version</Text>
        <Text style={styles.versionNumber}>{currentVersion}</Text>
      </View>

      {migrating ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <View style={styles.buttonColumn}>
          <TouchableOpacity style={styles.button} onPress={() => handleMigrate(3)}>
            <Text style={styles.buttonText}>Migrate to Latest (v3)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleValidate}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Validate Migrations</Text>
          </TouchableOpacity>

          {currentVersion > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={() => handleMigrate(currentVersion - 1)}
            >
              <Text style={styles.buttonText}>Rollback One Version</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.historyTitle}>Migration History</Text>
      <ScrollView style={styles.historyList}>
        {history.map((entry, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyVersion}>v{entry.version}</Text>
              <View style={[styles.historyStatus, entry.success ? styles.statusSuccess : styles.statusError]} />
            </View>
            <Text style={styles.historyName}>{entry.name}</Text>
            <Text style={styles.historyDate}>
              {new Date(entry.executedAt).toLocaleString()}
            </Text>
          </View>
        ))}
        {history.length === 0 && (
          <Text style={styles.emptyText}>No migrations executed yet</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  buttonColumn: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  status_idle: {
    backgroundColor: '#8E8E93',
  },
  status_syncing: {
    backgroundColor: '#FF9500',
  },
  status_success: {
    backgroundColor: '#34C759',
  },
  status_error: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  versionCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  versionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyVersion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  historyStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusSuccess: {
    backgroundColor: '#34C759',
  },
  statusError: {
    backgroundColor: '#FF3B30',
  },
  historyName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});

export default {
  StorageProviderWrapper,
  SecureStorageExample,
  CloudSyncExample,
  MigrationExample,
};
