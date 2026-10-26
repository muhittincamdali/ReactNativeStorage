// The Usage samples from README.md, with memoryDriver() in place of mmkvDriver(createMMKV())
// and a stub for expo-secure-store. If you change a sample there, change it here too.
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  createStorage,
  memoryDriver,
  secureStoreDriver,
  toStateStorage,
  type SecureStoreLike,
} from '../src/index';

const driver = memoryDriver();
const warn = vi.fn();

// "Check values with a schema"
const storage = createStorage({
  driver,
  namespace: 'app',
  onError: (error) => warn(error.code, error.key), // the key, never the value
});

export const theme = storage.item('theme', {
  schema: z.enum(['system', 'light', 'dark']),
  defaultValue: 'system',
});

// "Change the shape of stored data"
export const profile = storage.item('profile', {
  schema: z.object({ first: z.string(), last: z.string() }),
  version: 2,
  migrations: {
    2: (old) => {
      const [first = '', ...rest] = String((old as { name?: unknown }).name ?? '').split(' ');
      return { first, last: rest.join(' ') };
    },
  },
});

// "Keep a token in the Keychain"
const keychain = new Map<string, string>();
const SecureStore: SecureStoreLike<{ keychainAccessible: number }> & {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: number;
} = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: async (key) => keychain.get(key) ?? null,
  setItemAsync: async (key, value) => void keychain.set(key, value),
  deleteItemAsync: async (key) => void keychain.delete(key),
};
const secure = createStorage({
  driver: secureStoreDriver(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  namespace: 'auth',
});
export const refreshToken = secure.item('refresh-token', { schema: z.string() });

// "Persist a Zustand store"
type Cart = { items: string[]; add: (item: string) => void };

export const useCart = create<Cart>()(
  persist(
    (set) => ({ items: [], add: (item) => set((cart) => ({ items: [...cart.items, item] })) }),
    {
      name: 'cart',
      storage: createJSONStorage(() => toStateStorage(storage)),
    },
  ),
);

describe('README samples', () => {
  it('checks values with a schema', async () => {
    await theme.set('dark');
    // @ts-expect-error "purple" is not in the enum
    await expect(theme.set('purple')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(await theme.get()).toBe('dark');
  });

  it('lets values expire', async () => {
    let now = 0;
    const clocked = createStorage({ driver: memoryDriver(), now: () => now });
    const draft = clocked.item('draft', { defaultValue: '', ttl: 5 * 60 * 1000 });
    await draft.set('Buy milk'); // gone five minutes later
    const otp = clocked.item<string>('otp');
    await otp.set('482913', { ttl: 30_000 }); // a lifetime for one write
    now = 5 * 60 * 1000;
    expect(await clocked.purgeExpired()).toBe(2);
    expect(await draft.get()).toBe('');
  });

  it('migrates a version 1 profile', async () => {
    driver.setItem('app:profile', '{"rns":1,"s":1,"d":{"name":"Grace Brewster Hopper"}}');
    expect(await profile.get()).toEqual({ first: 'Grace', last: 'Brewster Hopper' });
  });

  it('keeps the token in the Keychain stub under an encoded key', async () => {
    await refreshToken.set('token-123');
    expect([...keychain.keys()]).toEqual(['auth_3a_refresh-token']);
  });

  it('persists the Zustand cart', async () => {
    useCart.getState().add('apple');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(driver.data.has('app:cart')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});
