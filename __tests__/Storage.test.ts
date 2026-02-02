import { Storage } from '../src/storage/Storage';
import { JsonSerializer, TypedSerializer } from '../src/utils/serializer';
import { QueryBuilder } from '../src/sqlite/QueryBuilder';
import { StorageConfigBuilder } from '../src/storage/StorageConfig';

describe('JsonSerializer', () => {
  const serializer = new JsonSerializer();

  it('should serialize and deserialize strings', () => {
    const value = 'hello world';
    const serialized = serializer.serialize(value);
    expect(serializer.deserialize(serialized)).toBe(value);
  });

  it('should serialize and deserialize objects', () => {
    const value = { name: 'test', count: 42, nested: { active: true } };
    const serialized = serializer.serialize(value);
    expect(serializer.deserialize(serialized)).toEqual(value);
  });

  it('should serialize and deserialize arrays', () => {
    const value = [1, 'two', { three: 3 }];
    const serialized = serializer.serialize(value);
    expect(serializer.deserialize(serialized)).toEqual(value);
  });

  it('should handle null and boolean values', () => {
    expect(serializer.deserialize(serializer.serialize(null))).toBeNull();
    expect(serializer.deserialize(serializer.serialize(true))).toBe(true);
    expect(serializer.deserialize(serializer.serialize(false))).toBe(false);
  });

  it('should throw on invalid JSON deserialization', () => {
    expect(() => serializer.deserialize('not valid json {')).toThrow();
  });
});

describe('TypedSerializer', () => {
  const serializer = new TypedSerializer();

  it('should preserve type information', () => {
    const value = 42;
    const serialized = serializer.serialize(value);
    const parsed = JSON.parse(serialized);
    expect(parsed.__type).toBe('number');
  });

  it('should handle date serialization', () => {
    const date = new Date('2026-01-15T10:30:00Z');
    const serialized = serializer.serialize(date);
    const deserialized = serializer.deserialize<Date>(serialized);
    expect(deserialized).toBeInstanceOf(Date);
  });
});

describe('QueryBuilder', () => {
  it('should build a basic SELECT query', () => {
    const { sql, params } = QueryBuilder.from('users').select('id', 'name').buildSelect();
    expect(sql).toBe('SELECT id, name FROM users');
    expect(params).toEqual([]);
  });

  it('should build SELECT with WHERE clause', () => {
    const { sql, params } = QueryBuilder.from('storage')
      .whereEquals('key', 'test_key')
      .buildSelect();
    expect(sql).toBe('SELECT * FROM storage WHERE key = ?');
    expect(params).toEqual(['test_key']);
  });

  it('should build SELECT with ORDER and LIMIT', () => {
    const { sql } = QueryBuilder.from('storage')
      .orderBy('timestamp', 'DESC')
      .limit(10)
      .offset(5)
      .buildSelect();
    expect(sql).toContain('ORDER BY timestamp DESC');
    expect(sql).toContain('LIMIT 10');
    expect(sql).toContain('OFFSET 5');
  });

  it('should build INSERT query', () => {
    const { sql, params } = QueryBuilder.from('storage').buildInsert({
      key: 'test',
      value: 'data',
      timestamp: 1000,
    });
    expect(sql).toContain('INSERT INTO storage');
    expect(params).toEqual(['test', 'data', 1000]);
  });

  it('should build UPDATE query with WHERE', () => {
    const { sql, params } = QueryBuilder.from('storage')
      .whereEquals('key', 'test')
      .buildUpdate({ value: 'updated' });
    expect(sql).toContain('UPDATE storage SET value = ?');
    expect(params).toEqual(['updated', 'test']);
  });

  it('should build DELETE query', () => {
    const { sql, params } = QueryBuilder.from('storage')
      .whereEquals('key', 'old')
      .buildDelete();
    expect(sql).toBe('DELETE FROM storage WHERE key = ?');
    expect(params).toEqual(['old']);
  });

  it('should handle LIKE conditions', () => {
    const { sql, params } = QueryBuilder.from('storage')
      .whereLike('key', 'user_%')
      .buildSelect();
    expect(sql).toContain('LIKE ?');
    expect(params).toEqual(['user_%']);
  });

  it('should handle IS NULL conditions', () => {
    const { sql } = QueryBuilder.from('storage').whereNull('ttl').buildSelect();
    expect(sql).toContain('ttl IS NULL');
  });
});

describe('StorageConfigBuilder', () => {
  it('should create config with defaults', () => {
    const config = new StorageConfigBuilder().build();
    expect(config.backend).toBe('mmkv');
    expect(config.enableLogging).toBe(false);
  });

  it('should allow chaining configuration', () => {
    const config = new StorageConfigBuilder()
      .setBackend('sqlite')
      .setEncryptionKey('secret-key')
      .setLogging(true)
      .setDefaultTTL(60000)
      .setMaxRetries(5)
      .build();

    expect(config.backend).toBe('sqlite');
    expect(config.encryptionKey).toBe('secret-key');
    expect(config.enableLogging).toBe(true);
    expect(config.defaultTTL).toBe(60000);
    expect(config.maxRetries).toBe(5);
  });

  it('should return frozen config object', () => {
    const config = new StorageConfigBuilder().build();
    expect(Object.isFrozen(config)).toBe(true);
  });
});
