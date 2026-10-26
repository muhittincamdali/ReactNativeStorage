import type { StorageDriver } from './driver';
import { StorageError } from './errors';
import { assertKeyName } from './validation';

export interface CopyKeysOptions {
  from: StorageDriver;
  to: StorageDriver;
  /** Keys to copy, or a filter over every key of `from`. Default: every key of `from`. */
  keys?: readonly string[] | ((key: string) => boolean);
  /** Replace keys that already exist in `to`. Default `false`: existing keys are skipped. */
  overwrite?: boolean;
  /** Delete each key from `from` once it is in `to`. Default `false`. */
  removeFromSource?: boolean;
}

export interface CopyKeysResult {
  /** Keys written to `to`. */
  copied: string[];
  /** Keys left alone because `to` already had them. */
  skipped: string[];
  /** Keys that `from` listed or was asked for but holds no value for. */
  missing: string[];
}

async function listKeys(driver: StorageDriver): Promise<readonly string[]> {
  if (!driver.getAllKeys) {
    throw new StorageError('UNSUPPORTED', `The ${driver.name} driver cannot list keys; pass keys`);
  }
  return driver.getAllKeys();
}

/**
 * Copies stored text from one driver to another, unchanged: the usual way to move an app from
 * AsyncStorage to MMKV. Values written by plain AsyncStorage stay plain; read them with an
 * item's `legacy` option. Keys are copied one at a time, so a failure leaves earlier keys
 * copied and later ones untouched; run it again to finish.
 */
export async function copyKeys(options: CopyKeysOptions): Promise<CopyKeysResult> {
  const { from, to, overwrite = false, removeFromSource = false } = options;
  const selection = options.keys;
  let keys: readonly string[];
  if (Array.isArray(selection)) keys = selection;
  else {
    const all = await listKeys(from);
    keys = typeof selection === 'function' ? all.filter((key) => selection(key)) : all;
  }
  const result: CopyKeysResult = { copied: [], skipped: [], missing: [] };
  for (const key of new Set(keys)) {
    assertKeyName(key);
    const value = await from.getItem(key);
    if (value === null) {
      result.missing.push(key);
      continue;
    }
    if (!overwrite && (await to.getItem(key)) !== null) {
      result.skipped.push(key);
      continue;
    }
    await to.setItem(key, value);
    if (removeFromSource) await from.removeItem(key);
    result.copied.push(key);
  }
  return result;
}
