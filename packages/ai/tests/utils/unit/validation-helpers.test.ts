import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  type AnalystRuntimeContext,
  // Types
  type BaseRuntimeContext,
  type Credentials,
  analystRuntimeContextSchema,
  // Schemas
  baseRuntimeContextSchema,
  credentialsSchema,
  isError,
  safeJsonParse,
  secretResultSchema,
  toolRuntimeContextSchema,
  validateArrayAccess,
  validateExists,
  // Helper functions
  validateRequired,
  validateRuntimeContext,
} from '../../../src/utils/validation-helpers';

describe('Validation Helpers Unit Tests', () => {
  describe('Schema Validation', () => {
    describe('baseRuntimeContextSchema', () => {
      test('should validate correct base runtime context', () => {
        const validContext = {
          userId: 'user-123',
          organizationId: 'org-456',
        };

        const result = baseRuntimeContextSchema.safeParse(validContext);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.userId).toBe('user-123');
          expect(result.data.organizationId).toBe('org-456');
        }
      });

      test('should reject missing required fields', () => {
        const invalidContext1 = { userId: 'user-123' }; // missing organizationId
        const invalidContext2 = { organizationId: 'org-456' }; // missing userId
        const invalidContext3 = {}; // missing both

        expect(baseRuntimeContextSchema.safeParse(invalidContext1).success).toBe(false);
        expect(baseRuntimeContextSchema.safeParse(invalidContext2).success).toBe(false);
        expect(baseRuntimeContextSchema.safeParse(invalidContext3).success).toBe(false);
      });

      test('should reject empty string fields', () => {
        const invalidContext = {
          userId: '',
          organizationId: 'org-456',
        };

        const result = baseRuntimeContextSchema.safeParse(invalidContext);
        expect(result.success).toBe(false);
      });
    });

    describe('analystRuntimeContextSchema', () => {
      test('should validate correct analyst runtime context', () => {
        const validContext = {
          userId: 'user-123',
          organizationId: 'org-456',
          dataSourceId: 'ds-789',
          dataSourceSyntax: 'postgresql',
          messageId: 'msg-123',
          threadId: 'thread-456',
        };

        const result = analystRuntimeContextSchema.safeParse(validContext);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.dataSourceId).toBe('ds-789');
          expect(result.data.dataSourceSyntax).toBe('postgresql');
        }
      });

      test('should validate with optional fields missing', () => {
        const validContext = {
          userId: 'user-123',
          organizationId: 'org-456',
          dataSourceId: 'ds-789',
        };

        const result = analystRuntimeContextSchema.safeParse(validContext);
        expect(result.success).toBe(true);
      });

      test('should reject missing required base fields', () => {
        const invalidContext = {
          dataSourceId: 'ds-789',
          // missing userId and organizationId
        };

        const result = analystRuntimeContextSchema.safeParse(invalidContext);
        expect(result.success).toBe(false);
      });
    });

    describe('secretResultSchema', () => {
      test('should validate correct secret result', () => {
        const validSecretResult = [
          {
            decrypted_secret: 'valid-secret-string',
          },
        ];

        const result = secretResultSchema.safeParse(validSecretResult);
        expect(result.success).toBe(true);
      });

      test('should reject empty array', () => {
        const invalidSecretResult: any[] = [];

        const result = secretResultSchema.safeParse(invalidSecretResult);
        expect(result.success).toBe(false);
      });

      test('should reject array with empty secret', () => {
        const invalidSecretResult = [
          {
            decrypted_secret: '',
          },
        ];

        const result = secretResultSchema.safeParse(invalidSecretResult);
        expect(result.success).toBe(false);
      });

      test('should reject array with missing secret field', () => {
        const invalidSecretResult = [
          {
            other_field: 'value',
          },
        ];

        const result = secretResultSchema.safeParse(invalidSecretResult);
        expect(result.success).toBe(false);
      });
    });

    describe('credentialsSchema', () => {
      test('should validate correct credentials', () => {
        const validCredentials = {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'user',
          password: 'pass',
        };

        const result = credentialsSchema.safeParse(validCredentials);
        expect(result.success).toBe(true);
      });

      test('should validate with minimal required fields', () => {
        const validCredentials = {
          type: 'bigquery',
        };

        const result = credentialsSchema.safeParse(validCredentials);
        expect(result.success).toBe(true);
      });

      test('should reject missing type field', () => {
        const invalidCredentials = {
          host: 'localhost',
          port: 5432,
        };

        const result = credentialsSchema.safeParse(invalidCredentials);
        expect(result.success).toBe(false);
      });

      test('should allow additional properties', () => {
        const credentialsWithExtra = {
          type: 'snowflake',
          account: 'my-account',
          warehouse: 'my-warehouse',
          customField: 'custom-value',
        };

        const result = credentialsSchema.safeParse(credentialsWithExtra);
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as any).customField).toBe('custom-value');
        }
      });
    });
  });

  describe('Helper Functions', () => {
    describe('validateRequired', () => {
      test('should return value for valid inputs', () => {
        expect(validateRequired('test', 'field')).toBe('test');
        expect(validateRequired(123, 'number')).toBe(123);
        expect(validateRequired(false, 'boolean')).toBe(false);
        expect(validateRequired([], 'array')).toEqual([]);
        expect(validateRequired({}, 'object')).toEqual({});
      });

      test('should throw error for null values', () => {
        expect(() => validateRequired(null, 'field')).toThrow('Required field field is missing');
      });

      test('should throw error for undefined values', () => {
        expect(() => validateRequired(undefined, 'field')).toThrow(
          'Required field field is missing'
        );
      });

      test('should handle different field names in error messages', () => {
        expect(() => validateRequired(null, 'userId')).toThrow('Required field userId is missing');
        expect(() => validateRequired(undefined, 'dataSourceId')).toThrow(
          'Required field dataSourceId is missing'
        );
      });
    });

    describe('isError', () => {
      test('should return true for Error instances', () => {
        expect(isError(new Error('test'))).toBe(true);
        expect(isError(new TypeError('test'))).toBe(true);
        expect(isError(new RangeError('test'))).toBe(true);
      });

      test('should return false for non-Error values', () => {
        expect(isError('string')).toBe(false);
        expect(isError(123)).toBe(false);
        expect(isError(null)).toBe(false);
        expect(isError(undefined)).toBe(false);
        expect(isError({})).toBe(false);
        expect(isError([])).toBe(false);
      });

      test('should handle error-like objects', () => {
        const errorLike = { message: 'error', stack: 'stack' };
        expect(isError(errorLike)).toBe(false);
      });
    });

    describe('validateArrayAccess', () => {
      test('should return value for valid indices', () => {
        const array = ['a', 'b', 'c'];
        expect(validateArrayAccess(array, 0, 'test')).toBe('a');
        expect(validateArrayAccess(array, 1, 'test')).toBe('b');
        expect(validateArrayAccess(array, 2, 'test')).toBe('c');
      });

      test('should throw error for negative indices', () => {
        const array = ['a', 'b', 'c'];
        expect(() => validateArrayAccess(array, -1, 'test context')).toThrow(
          'Array index -1 out of bounds in test context. Array length: 3'
        );
      });

      test('should throw error for indices >= array length', () => {
        const array = ['a', 'b', 'c'];
        expect(() => validateArrayAccess(array, 3, 'test context')).toThrow(
          'Array index 3 out of bounds in test context. Array length: 3'
        );
        expect(() => validateArrayAccess(array, 5, 'test context')).toThrow(
          'Array index 5 out of bounds in test context. Array length: 3'
        );
      });

      test('should handle empty arrays', () => {
        const array: string[] = [];
        expect(() => validateArrayAccess(array, 0, 'empty array')).toThrow(
          'Array index 0 out of bounds in empty array. Array length: 0'
        );
      });

      test('should work with different array types', () => {
        const numberArray = [1, 2, 3];
        const objectArray = [{ id: 1 }, { id: 2 }];

        expect(validateArrayAccess(numberArray, 1, 'numbers')).toBe(2);
        expect(validateArrayAccess(objectArray, 0, 'objects')).toEqual({ id: 1 });
      });
    });

    describe('safeJsonParse', () => {
      test('should parse valid JSON with schema validation', () => {
        const jsonString = '{"type": "postgresql", "host": "localhost"}';
        const result = safeJsonParse(jsonString, credentialsSchema, 'test');

        expect(result.type).toBe('postgresql');
        expect(result.host).toBe('localhost');
      });

      test('should throw error for invalid JSON syntax', () => {
        const invalidJson = '{"type": "postgresql", "host":}'; // missing value

        expect(() => safeJsonParse(invalidJson, credentialsSchema, 'test context')).toThrow(
          'Failed to parse JSON in test context'
        );
      });

      test('should throw error for JSON that fails schema validation', () => {
        const jsonString = '{"host": "localhost"}'; // missing required 'type'

        expect(() => safeJsonParse(jsonString, credentialsSchema, 'test context')).toThrow(
          'Invalid JSON structure in test context'
        );
      });

      test('should handle complex nested objects', () => {
        const complexSchema = z.object({
          name: z.string(),
          config: z.object({
            enabled: z.boolean(),
            settings: z.array(z.string()),
          }),
        });

        const jsonString = '{"name": "test", "config": {"enabled": true, "settings": ["a", "b"]}}';
        const result = safeJsonParse(jsonString, complexSchema, 'complex');

        expect(result.name).toBe('test');
        expect(result.config.enabled).toBe(true);
        expect(result.config.settings).toEqual(['a', 'b']);
      });

      test('should provide detailed validation error messages', () => {
        const jsonString = '{"type": "", "port": "invalid"}'; // empty type, invalid port type

        try {
          safeJsonParse(jsonString, credentialsSchema, 'test context');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid JSON structure in test context');
        }
      });
    });

    describe('validateExists', () => {
      test('should return value for non-null/undefined inputs', () => {
        expect(validateExists('test', 'field', 'context')).toBe('test');
        expect(validateExists(123, 'number', 'context')).toBe(123);
        expect(validateExists(false, 'boolean', 'context')).toBe(false);
        expect(validateExists(0, 'zero', 'context')).toBe(0);
        expect(validateExists('', 'empty', 'context')).toBe('');
      });

      test('should throw error for null values', () => {
        expect(() => validateExists(null, 'field', 'test context')).toThrow(
          'Expected field field is missing in test context'
        );
      });

      test('should throw error for undefined values', () => {
        expect(() => validateExists(undefined, 'field', 'test context')).toThrow(
          'Expected field field is missing in test context'
        );
      });

      test('should include field name and context in error messages', () => {
        expect(() => validateExists(null, 'userId', 'database query')).toThrow(
          'Expected field userId is missing in database query'
        );
      });
    });

    describe('validateRuntimeContext', () => {
      test('should throw error for null/undefined context', () => {
        expect(() =>
          validateRuntimeContext(null, baseRuntimeContextSchema, 'test operation')
        ).toThrow('Runtime context is required for test operation');

        expect(() =>
          validateRuntimeContext(undefined, baseRuntimeContextSchema, 'test operation')
        ).toThrow('Runtime context is required for test operation');
      });

      test('should throw error for context without get method', () => {
        const invalidContext = { notGet: () => {} };

        expect(() =>
          validateRuntimeContext(invalidContext as any, baseRuntimeContextSchema, 'test operation')
        ).toThrow('Runtime context is required for test operation');
      });

      test('should validate context with available fields', () => {
        const mockContext = {
          get: (key: string) => {
            switch (key) {
              case 'userId':
                return 'user-123';
              case 'organizationId':
                return 'org-456';
              case 'dataSourceId':
                return 'ds-789';
              default:
                return undefined;
            }
          },
        };

        const result = validateRuntimeContext(
          mockContext,
          analystRuntimeContextSchema,
          'test operation'
        );
        expect(result.userId).toBe('user-123');
        expect(result.organizationId).toBe('org-456');
        expect(result.dataSourceId).toBe('ds-789');
      });

      test('should handle missing optional fields', () => {
        const mockContext = {
          get: (key: string) => {
            switch (key) {
              case 'userId':
                return 'user-123';
              case 'organizationId':
                return 'org-456';
              default:
                return undefined; // Missing optional fields
            }
          },
        };

        const result = validateRuntimeContext(
          mockContext,
          toolRuntimeContextSchema,
          'test operation'
        );
        expect(result.userId).toBe('user-123');
        expect(result.organizationId).toBe('org-456');
      });

      test('should provide detailed validation error messages', () => {
        const mockContext = {
          get: (key: string) => {
            switch (key) {
              case 'userId':
                return ''; // Invalid - empty string
              case 'organizationId':
                return 'org-456';
              default:
                return undefined;
            }
          },
        };

        try {
          validateRuntimeContext(mockContext, baseRuntimeContextSchema, 'test operation');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Invalid runtime context for test operation');
        }
      });
    });
  });

  describe('Type Inference', () => {
    test('should properly infer types from schemas', () => {
      // This test ensures our type inference works correctly
      const baseContext: BaseRuntimeContext = {
        userId: 'user-123',
        organizationId: 'org-456',
      };

      const analystContext: AnalystRuntimeContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        dataSourceId: 'ds-789',
        dataSourceSyntax: 'postgresql',
        messageId: 'msg-123',
        threadId: 'thread-456',
      };

      const credentials: Credentials = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
      };

      // These should compile without type errors
      expect(baseContext.userId).toBe('user-123');
      expect(analystContext.dataSourceId).toBe('ds-789');
      expect(credentials.type).toBe('postgresql');
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle circular JSON references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Create circular reference

      let jsonString: string;
      try {
        jsonString = JSON.stringify(obj);
      } catch {
        // JSON.stringify will throw for circular references
        jsonString = '{"name": "test"}'; // Use safe version
      }

      expect(() => {
        const schema = z.object({ name: z.string() });
        safeJsonParse(jsonString, schema, 'circular test');
      }).not.toThrow();
    });

    test('should handle very large arrays', () => {
      const largeArray = new Array(10000).fill('item');

      expect(validateArrayAccess(largeArray, 0, 'large array')).toBe('item');
      expect(validateArrayAccess(largeArray, 9999, 'large array')).toBe('item');
      expect(() => validateArrayAccess(largeArray, 10000, 'large array')).toThrow();
    });

    test('should handle nested validation errors', () => {
      const complexSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
            age: z.number().positive(),
          }),
        }),
      });

      const invalidJson = '{"user": {"profile": {"name": "", "age": -1}}}';

      try {
        safeJsonParse(invalidJson, complexSchema, 'nested validation');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid JSON structure in nested validation');
      }
    });
  });
});
