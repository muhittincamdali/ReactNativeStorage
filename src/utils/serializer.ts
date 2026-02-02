import { Serializer } from '../types';

export class JsonSerializer implements Serializer {
  serialize<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new StorageSerializationError(
        `Failed to serialize value: ${(error as Error).message}`
      );
    }
  }

  deserialize<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      throw new StorageSerializationError(
        `Failed to deserialize value: ${(error as Error).message}`
      );
    }
  }
}

export class TypedSerializer implements Serializer {
  serialize<T>(value: T): string {
    const wrapper = {
      __type: typeof value,
      __value: value,
      __date: value instanceof Date ? value.toISOString() : undefined,
    };
    return JSON.stringify(wrapper);
  }

  deserialize<T>(raw: string): T {
    const wrapper = JSON.parse(raw);
    if (wrapper.__type === 'object' && wrapper.__date) {
      return new Date(wrapper.__date) as unknown as T;
    }
    return wrapper.__value as T;
  }
}

export class StorageSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageSerializationError';
  }
}
