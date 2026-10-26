import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import {
  createStorage,
  getOrCreateSecret,
  memoryDriver,
  mmkvDriver,
  secureStoreDriver,
  type StorageError,
} from 'react-native-storage-toolkit';
import { z } from 'zod';

/** Errors from unreadable data, shown in the app's "Last error" row instead of being logged. */
export const reportedErrors: StorageError[] = [];

// MMKV for everyday values. On the web, react-native-mmkv keeps them in localStorage.
const mmkv = createMMKV({ id: 'storage-demo' });
export const appStorage = createStorage({
  driver: mmkvDriver(mmkv),
  namespace: 'demo',
  onError: (error) => reportedErrors.push(error),
});

// The Keychain (iOS) or Keystore (Android) for secrets. Browsers have no equivalent, so the
// web build keeps the secret in memory for the session.
export const secureStorage = createStorage({
  driver:
    Platform.OS === 'web'
      ? memoryDriver()
      : secureStoreDriver(SecureStore, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }),
  namespace: 'secure',
});

export const ThemeChoice = z.enum(['system', 'light', 'dark']);
export type ThemeChoice = z.infer<typeof ThemeChoice>;

export const theme = appStorage.item('theme', { schema: ThemeChoice, defaultValue: 'system' });

export const launches = appStorage.item('launches', {
  schema: z.number().int().nonnegative(),
  defaultValue: 0,
});

/** A draft that is thrown away five minutes after the last edit. */
export const draft = appStorage.item('draft', {
  schema: z.string().max(500),
  defaultValue: '',
  ttl: 5 * 60 * 1000,
});

/**
 * Version 2 split `name` into `first` and `last`. A profile saved by version 1 of the app is
 * upgraded the first time it is read.
 */
const PROFILE_KEY = 'demo:profile';

// Stands in for a profile that version 1 of the app saved, so the migration below has
// something to upgrade on the first launch.
if (!mmkv.contains(PROFILE_KEY)) {
  mmkv.set(PROFILE_KEY, JSON.stringify({ rns: 1, s: 1, d: { name: 'Grace Brewster Hopper' } }));
}

/** The schema version in the stored record, read straight from MMKV. */
export function storedProfileVersion(): string {
  const raw = mmkv.getString(PROFILE_KEY);
  return raw === undefined ? 'none' : String((JSON.parse(raw) as { s?: unknown }).s);
}

const Profile = z.object({ first: z.string(), last: z.string() });
export const profile = appStorage.item('profile', {
  schema: Profile,
  defaultValue: { first: '', last: '' },
  version: 2,
  migrations: {
    2: (old) => {
      const [first = '', ...rest] = String((old as { name?: unknown }).name ?? '').split(' ');
      return { first, last: rest.join(' ') };
    },
  },
});

export const apiToken = secureStorage.item('api-token', { schema: z.string() });

export function createToken(): Promise<string> {
  return getOrCreateSecret(apiToken, { getRandomValues: Crypto.getRandomValues });
}
