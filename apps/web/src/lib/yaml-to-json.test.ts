import { describe, it, expect } from 'vitest';
import { yamlToJson, yamlToJsonSafe, YamlParseError, isJsonSerializable } from './yaml-to-json';

describe('yamlToJson', () => {
  it('should parse simple YAML to JSON object', () => {
    const yamlString = `
name: "Test App"
version: 1.0
enabled: true
`;

    interface Config {
      name: string;
      version: number;
      enabled: boolean;
    }

    const result = yamlToJson<Config>(yamlString);

    expect(result).toEqual({
      name: 'Test App',
      version: 1.0,
      enabled: true
    });
  });

  it('should handle nested objects', () => {
    const yamlString = `
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
`;

    interface DatabaseConfig {
      database: {
        host: string;
        port: number;
        credentials: {
          username: string;
          password: string;
        };
      };
    }

    const result = yamlToJson<DatabaseConfig>(yamlString);

    expect(result.database.host).toBe('localhost');
    expect(result.database.port).toBe(5432);
    expect(result.database.credentials.username).toBe('admin');
  });

  it('should handle arrays', () => {
    const yamlString = `
fruits:
  - apple
  - banana
  - orange
numbers:
  - 1
  - 2
  - 3
`;

    interface ListConfig {
      fruits: string[];
      numbers: number[];
    }

    const result = yamlToJson<ListConfig>(yamlString);

    expect(result.fruits).toEqual(['apple', 'banana', 'orange']);
    expect(result.numbers).toEqual([1, 2, 3]);
  });

  it('should throw YamlParseError for invalid YAML', () => {
    const invalidYaml = `
name: "Test
version: 1.0
    invalid indentation
`;

    expect(() => yamlToJson(invalidYaml)).toThrow(YamlParseError);
  });

  it('should throw YamlParseError for non-string input', () => {
    expect(() => yamlToJson(123 as any)).toThrow(YamlParseError);
    expect(() => yamlToJson(null as any)).toThrow(YamlParseError);
    expect(() => yamlToJson(undefined as any)).toThrow(YamlParseError);
  });

  it('should throw YamlParseError for empty string', () => {
    expect(() => yamlToJson('')).toThrow(YamlParseError);
    expect(() => yamlToJson('   ')).toThrow(YamlParseError);
  });

  it('should handle options parameter', () => {
    const yamlString = `
name: "Test App"
version: 1.0
`;

    const result = yamlToJson(yamlString, {
      filename: 'test.yaml'
    });

    expect(result).toEqual({
      name: 'Test App',
      version: 1.0
    });
  });

  it('should throw YamlParseError for duplicate keys', () => {
    const yamlWithDuplicates = `
name: "First"
name: "Second"
`;

    // js-yaml always throws for duplicate keys
    expect(() => yamlToJson(yamlWithDuplicates)).toThrow(YamlParseError);
  });
});

describe('isJsonSerializable', () => {
  it('should return true for JSON-serializable values', () => {
    expect(isJsonSerializable({})).toBe(true);
    expect(isJsonSerializable([])).toBe(true);
    expect(isJsonSerializable('string')).toBe(true);
    expect(isJsonSerializable(123)).toBe(true);
    expect(isJsonSerializable(true)).toBe(true);
    expect(isJsonSerializable(null)).toBe(true);
    expect(isJsonSerializable({ name: 'test', value: 42 })).toBe(true);
  });

  it('should return false for non-JSON-serializable values', () => {
    expect(isJsonSerializable(undefined)).toBe(false);
    expect(isJsonSerializable(() => {})).toBe(false);
    expect(isJsonSerializable(Symbol('test'))).toBe(false);

    // Circular reference
    const circular: any = {};
    circular.self = circular;
    expect(isJsonSerializable(circular)).toBe(false);
  });
});

describe('yamlToJsonSafe', () => {
  it('should parse valid YAML that is JSON-serializable', () => {
    const yamlString = `
name: "Test App"
version: 1.0
settings:
  debug: true
  maxRetries: 3
`;

    interface Config {
      name: string;
      version: number;
      settings: {
        debug: boolean;
        maxRetries: number;
      };
    }

    const result = yamlToJsonSafe<Config>(yamlString);

    expect(result).toEqual({
      name: 'Test App',
      version: 1.0,
      settings: {
        debug: true,
        maxRetries: 3
      }
    });
  });

  it('should throw YamlParseError for invalid YAML', () => {
    const invalidYaml = `
name: "Test
invalid: yaml
`;

    expect(() => yamlToJsonSafe(invalidYaml)).toThrow(YamlParseError);
  });
});

describe('YamlParseError', () => {
  it('should store original error', () => {
    const originalError = new Error('Original error message');
    const yamlError = new YamlParseError('YAML parse failed', originalError);

    expect(yamlError.message).toBe('YAML parse failed');
    expect(yamlError.name).toBe('YamlParseError');
    expect(yamlError.originalError).toBe(originalError);
  });

  it('should be instanceof Error and YamlParseError', () => {
    const yamlError = new YamlParseError('Test error', new Error());

    expect(yamlError instanceof Error).toBe(true);
    expect(yamlError instanceof YamlParseError).toBe(true);
  });
});

// Type safety tests (these test TypeScript compilation)
describe('Type Safety', () => {
  it('should provide proper type inference', () => {
    interface TestConfig {
      name: string;
      count: number;
    }

    const yaml = `
name: "test"
count: 42
`;

    const result = yamlToJson<TestConfig>(yaml);

    // These should be properly typed
    expect(typeof result.name).toBe('string');
    expect(typeof result.count).toBe('number');

    // TypeScript should catch these at compile time
    // result.name = 123; // This would be a TypeScript error
    // result.invalidProperty; // This would be a TypeScript error
  });

  it('should work with unknown type as default', () => {
    const yaml = `
unknown: "structure"
dynamic: true
`;

    const result = yamlToJson(yaml); // No generic type specified

    // Result should be typed as unknown
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });
});
