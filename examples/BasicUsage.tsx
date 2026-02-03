/**
 * Basic Usage Examples for ReactNativeStorage
 *
 * This file demonstrates common usage patterns for the storage library.
 *
 * @example
 * ```tsx
 * import { Storage, MMKVProvider } from '@mhttncmdl/react-native-storage';
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useStorage, useStorageMany, useStorageQuery } from '../src/hooks/useStorage';
import type { StorageProvider } from '../src/types';

// ============================================================================
// Example 1: Simple Key-Value Storage
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

interface SimpleStorageExampleProps {
  storage: StorageProvider;
}

/**
 * Simple storage example showing basic CRUD operations
 */
export function SimpleStorageExample({ storage }: SimpleStorageExampleProps) {
  const {
    value: user,
    loading,
    error,
    set,
    remove,
    refresh,
  } = useStorage<User>(storage, 'current-user', {
    defaultValue: { id: '', name: '', email: '', createdAt: 0 },
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = useCallback(async () => {
    try {
      await set({
        id: user?.id || String(Date.now()),
        name,
        email,
        createdAt: user?.createdAt || Date.now(),
      });
      Alert.alert('Success', 'User saved successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to save user');
    }
  }, [set, user, name, email]);

  const handleDelete = useCallback(async () => {
    try {
      await remove();
      setName('');
      setEmail('');
      Alert.alert('Success', 'User deleted');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete user');
    }
  }, [remove]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
        <TouchableOpacity style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {user?.createdAt ? (
        <Text style={styles.timestamp}>
          Created: {new Date(user.createdAt).toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
}

// ============================================================================
// Example 2: Settings Management with TTL
// ============================================================================

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoSync: boolean;
  syncInterval: number;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: true,
  autoSync: true,
  syncInterval: 300000, // 5 minutes
};

interface SettingsExampleProps {
  storage: StorageProvider;
}

/**
 * Settings management with validation and TTL
 */
export function SettingsExample({ storage }: SettingsExampleProps) {
  const { value: settings, set, reset, isDirty, lastSync } = useStorage<AppSettings>(
    storage,
    'app-settings',
    {
      defaultValue: defaultSettings,
      ttl: 86400000, // 24 hours
      optimistic: true,
      validate: (value) => {
        if (!['light', 'dark', 'system'].includes(value.theme)) {
          return 'Invalid theme';
        }
        if (value.syncInterval < 60000) {
          return 'Sync interval must be at least 1 minute';
        }
        return true;
      },
    }
  );

  const handleThemeChange = (theme: AppSettings['theme']) => {
    if (settings) {
      set({ ...settings, theme });
    }
  };

  const handleToggle = (key: keyof Pick<AppSettings, 'notifications' | 'autoSync'>) => {
    if (settings) {
      set({ ...settings, [key]: !settings[key] });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Theme Selection */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Theme</Text>
        <View style={styles.segmentedControl}>
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.segment,
                settings?.theme === theme && styles.segmentActive,
              ]}
              onPress={() => handleThemeChange(theme)}
            >
              <Text
                style={[
                  styles.segmentText,
                  settings?.theme === theme && styles.segmentTextActive,
                ]}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Toggle Settings */}
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => handleToggle('notifications')}
      >
        <Text style={styles.settingLabel}>Notifications</Text>
        <View
          style={[
            styles.toggle,
            settings?.notifications && styles.toggleActive,
          ]}
        >
          <View style={[styles.toggleKnob, settings?.notifications && styles.toggleKnobActive]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => handleToggle('autoSync')}
      >
        <Text style={styles.settingLabel}>Auto Sync</Text>
        <View
          style={[styles.toggle, settings?.autoSync && styles.toggleActive]}
        >
          <View style={[styles.toggleKnob, settings?.autoSync && styles.toggleKnobActive]} />
        </View>
      </TouchableOpacity>

      {/* Reset Button */}
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={reset}>
        <Text style={styles.buttonText}>Reset to Defaults</Text>
      </TouchableOpacity>

      {/* Status */}
      <View style={styles.statusContainer}>
        {isDirty && <Text style={styles.statusText}>Unsaved changes</Text>}
        {lastSync && (
          <Text style={styles.statusText}>
            Last saved: {new Date(lastSync).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Example 3: Todo List with Query
// ============================================================================

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

interface TodoListExampleProps {
  storage: StorageProvider;
}

/**
 * Todo list with querying and pagination
 */
export function TodoListExample({ storage }: TodoListExampleProps) {
  const {
    items,
    loading,
    hasMore,
    fetchMore,
    refetch,
    total,
  } = useStorageQuery<Todo>(storage, {
    prefix: 'todo:',
    limit: 10,
    sort: { field: 'createdAt', order: 'desc' },
  });

  const [newTodoTitle, setNewTodoTitle] = useState('');

  const handleAddTodo = useCallback(async () => {
    if (!newTodoTitle.trim()) return;

    const todo: Todo = {
      id: String(Date.now()),
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.set(`todo:${todo.id}`, todo);
    setNewTodoTitle('');
    refetch();
  }, [storage, newTodoTitle, refetch]);

  const handleToggleTodo = useCallback(
    async (todo: Todo) => {
      const updated: Todo = {
        ...todo,
        completed: !todo.completed,
        updatedAt: Date.now(),
      };
      await storage.set(`todo:${todo.id}`, updated);
      refetch();
    },
    [storage, refetch]
  );

  const handleDeleteTodo = useCallback(
    async (id: string) => {
      await storage.remove(`todo:${id}`);
      refetch();
    },
    [storage, refetch]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todo List ({total})</Text>

      {/* Add Todo */}
      <View style={styles.addTodoContainer}>
        <TextInput
          style={[styles.input, styles.todoInput]}
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          placeholder="Add a new todo..."
          placeholderTextColor="#999"
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={handleAddTodo}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Todo List */}
      <ScrollView style={styles.todoList}>
        {items.map((item) => (
          <View key={item.key} style={styles.todoItem}>
            <TouchableOpacity
              style={styles.todoCheckbox}
              onPress={() => handleToggleTodo(item.value)}
            >
              <View
                style={[
                  styles.checkbox,
                  item.value.completed && styles.checkboxChecked,
                ]}
              >
                {item.value.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <Text
              style={[
                styles.todoTitle,
                item.value.completed && styles.todoTitleCompleted,
              ]}
            >
              {item.value.title}
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTodo(item.value.id)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}

        {loading && (
          <ActivityIndicator style={styles.loadingMore} color="#007AFF" />
        )}

        {hasMore && !loading && (
          <TouchableOpacity
            style={[styles.button, styles.loadMoreButton]}
            onPress={fetchMore}
          >
            <Text style={styles.buttonText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Example 4: Multi-Key Management
// ============================================================================

interface DashboardData {
  users: number;
  posts: number;
  comments: number;
}

interface DashboardExampleProps {
  storage: StorageProvider;
}

/**
 * Dashboard with multiple storage keys
 */
export function DashboardExample({ storage }: DashboardExampleProps) {
  const { values, loading, setMany, refresh } = useStorageMany<DashboardData>(
    storage,
    ['dashboard:users', 'dashboard:posts', 'dashboard:comments']
  );

  const handleRefreshData = useCallback(async () => {
    // Simulate fetching new data
    await setMany([
      { key: 'dashboard:users', value: { users: Math.floor(Math.random() * 1000), posts: 0, comments: 0 } },
      { key: 'dashboard:posts', value: { users: 0, posts: Math.floor(Math.random() * 500), comments: 0 } },
      { key: 'dashboard:comments', value: { users: 0, posts: 0, comments: Math.floor(Math.random() * 2000) } },
    ]);
  }, [setMany]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const users = values.get('dashboard:users');
  const posts = values.get('dashboard:posts');
  const comments = values.get('dashboard:comments');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users?.users || 0}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{posts?.posts || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{comments?.comments || 0}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleRefreshData}>
          <Text style={styles.buttonText}>Simulate Update</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={refresh}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#FF3B30',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#8E8E93',
  },
  timestamp: {
    marginTop: 20,
    color: '#666',
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  segmentActive: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    color: '#007AFF',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  statusContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  addTodoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  todoInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addButton: {
    paddingHorizontal: 16,
  },
  todoList: {
    flex: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  todoCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todoTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingMore: {
    paddingVertical: 20,
  },
  loadMoreButton: {
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default {
  SimpleStorageExample,
  SettingsExample,
  TodoListExample,
  DashboardExample,
};
