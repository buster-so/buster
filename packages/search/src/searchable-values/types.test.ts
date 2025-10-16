import { describe, expect, it } from 'vitest';
import {
  BatchConfigSchema,
  createUniqueKey,
  DeduplicationResultSchema,
  ErrorTypeSchema,
  generateNamespace,
  isValidForEmbedding,
  parseUniqueKey,
  SearchableValueSchema,
  SearchRequestSchema,
  SearchResponseSchema,
  SearchResultSchema,
  SyncErrorSchema,
  SyncJobMetadataSchema,
  SyncJobPayloadSchema,
  SyncJobStatusSchema,
  TurbopufferDocumentSchema,
  TurbopufferQuerySchema,
  UpsertResultSchema,
} from './types';

describe('Searchable Values Types', () => {
  describe('SearchableValueSchema', () => {
    it('should validate a valid searchable value', () => {
      const validValue = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
      };

      const result = SearchableValueSchema.safeParse(validValue);
      expect(result.success).toBe(true);
    });

    it('should validate with optional embedding and synced_at', () => {
      const validValue = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
        embedding: new Array(512).fill(0.1),
        synced_at: '2024-01-01T00:00:00Z',
      };

      const result = SearchableValueSchema.safeParse(validValue);
      expect(result.success).toBe(true);
    });

    it('should accept embeddings of any length', () => {
      const value100 = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
        embedding: new Array(100).fill(0.1), // 100 dimensions
      };

      const value1536 = {
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
        embedding: new Array(1536).fill(0.1), // 1536 dimensions (default for text-embedding-3-small)
      };

      const result100 = SearchableValueSchema.safeParse(value100);
      const result1536 = SearchableValueSchema.safeParse(value1536);

      expect(result100.success).toBe(true);
      expect(result1536.success).toBe(true);
    });

    it('should reject empty required fields', () => {
      const invalidValue = {
        database: '',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John Doe',
      };

      const result = SearchableValueSchema.safeParse(invalidValue);
      expect(result.success).toBe(false);
    });
  });

  describe('TurbopufferQuerySchema', () => {
    it('should validate with only required dataSourceId', () => {
      const query = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should validate with all optional filters', () => {
      const query = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        database: 'mydb',
        schema: 'public',
        table: 'users',
        column: 'name',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const query = {
        dataSourceId: 'not-a-uuid',
      };

      const result = TurbopufferQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe('SyncJobPayloadSchema', () => {
    it('should validate daily sync job', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'daily',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate manual sync job with filters', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'manual',
        database: 'mydb',
        table: 'users',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sync type', () => {
      const payload = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'invalid',
      };

      const result = SyncJobPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('BatchConfigSchema', () => {
    it('should use defaults when not specified', () => {
      const config = {};
      const result = BatchConfigSchema.parse(config);

      expect(result.batchSize).toBe(100);
      expect(result.maxRetries).toBe(3);
      expect(result.rateLimitDelay).toBe(1000);
    });

    it('should accept custom values within limits', () => {
      const config = {
        batchSize: 500,
        maxRetries: 5,
        rateLimitDelay: 2000,
      };

      const result = BatchConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it('should reject batch size over limit', () => {
      const config = {
        batchSize: 1001,
      };

      const result = BatchConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    describe('createUniqueKey', () => {
      it('should create a hashed key under 64 bytes', () => {
        const value = {
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John Doe',
        };

        const key = createUniqueKey(value);
        // Key should be in format: db:schema:table:col:hash
        expect(key).toMatch(/^[^:]+:[^:]+:[^:]+:[^:]+:[a-z0-9]{8}$/);
        // Must be under 64 bytes
        expect(key.length).toBeLessThanOrEqual(64);
      });

      it('should stay under 64 bytes even with long names', () => {
        const value = {
          database: 'postgres',
          schema: 'ont_ont',
          table: 'customer',
          column: 'filter_technical_knowledge',
          value: 'Intermediate',
        };

        const key = createUniqueKey(value);
        // This was the problematic case that was 65 bytes
        expect(key.length).toBeLessThanOrEqual(64);
        expect(key).toMatch(/^[^:]+:[^:]+:[^:]+:[^:]+:[a-z0-9]{8}$/);
      });

      it('should truncate very long component names', () => {
        const value = {
          database: 'very_long_database_name_that_exceeds_limits',
          schema: 'extremely_long_schema_name_with_many_characters',
          table: 'super_duper_long_table_name_here',
          column: 'this_is_a_very_long_column_name_that_should_be_truncated',
          value: 'Some value with a long description here',
        };

        const key = createUniqueKey(value);
        expect(key.length).toBeLessThanOrEqual(64);
        // Should contain truncation indicators
        expect(key).toContain('..');
      });

      it('should generate different hashes for different values', () => {
        const value1 = {
          database: 'db',
          schema: 'schema',
          table: 'table',
          column: 'col',
          value: 'Value 1',
        };

        const value2 = {
          database: 'db',
          schema: 'schema',
          table: 'table',
          column: 'col',
          value: 'Value 2',
        };

        const key1 = createUniqueKey(value1);
        const key2 = createUniqueKey(value2);

        // Same metadata but different values should produce different keys
        expect(key1).not.toBe(key2);
        // Both should be valid and under limit
        expect(key1.length).toBeLessThanOrEqual(64);
        expect(key2.length).toBeLessThanOrEqual(64);
      });

      it('should handle values with colons by hashing', () => {
        const value = {
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'url',
          value: 'https://example.com:8080/path',
        };

        const key = createUniqueKey(value);
        // Should create a hashed key, not include the actual value
        expect(key).toMatch(/^mydb:public:users:url:[a-z0-9]{8}$/);
        expect(key.length).toBeLessThanOrEqual(64);
      });
    });

    describe('parseUniqueKey', () => {
      it('should parse a hashed unique key', () => {
        const key = 'mydb:public:users:name:abc12345';
        const parsed = parseUniqueKey(key);

        expect(parsed).toEqual({
          database: 'mydb',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'abc12345', // This is the hash, not the original value
        });
      });

      it('should parse keys with truncated components', () => {
        const key = 'very..name:extr..ters:supe..here:this..ated:12345678';
        const parsed = parseUniqueKey(key);

        expect(parsed).toEqual({
          database: 'very..name',
          schema: 'extr..ters',
          table: 'supe..here',
          column: 'this..ated',
          value: '12345678',
        });
      });

      it('should throw on invalid key format', () => {
        expect(() => parseUniqueKey('invalid')).toThrow('Invalid unique key format');
        expect(() => parseUniqueKey('only:three:parts')).toThrow('Invalid unique key format');
        expect(() => parseUniqueKey('too:many:parts:here:is:extra')).toThrow(
          'Invalid unique key format'
        );
      });
    });

    describe('generateNamespace', () => {
      it('should generate correct namespace format', () => {
        const dataSourceId = '123e4567-e89b-12d3-a456-426614174000';
        const namespace = generateNamespace(dataSourceId);

        expect(namespace).toBe('123e4567-e89b-12d3-a456-426614174000');
      });
    });

    describe('isValidForEmbedding', () => {
      it('should accept valid text values', () => {
        expect(isValidForEmbedding('John Doe')).toBe(true);
        expect(isValidForEmbedding('This is a valid description')).toBe(true);
        expect(isValidForEmbedding('Product ABC-123')).toBe(true);
      });

      it('should reject empty or whitespace values', () => {
        expect(isValidForEmbedding('')).toBe(false);
        expect(isValidForEmbedding('   ')).toBe(false);
        expect(isValidForEmbedding('\t\n')).toBe(false);
      });

      it('should reject values too short', () => {
        expect(isValidForEmbedding('ab')).toBe(false);
        expect(isValidForEmbedding('1')).toBe(false);
      });

      it('should reject values too long', () => {
        const longValue = 'a'.repeat(8001);
        expect(isValidForEmbedding(longValue)).toBe(false);
      });

      it('should reject UUID values', () => {
        expect(isValidForEmbedding('123e4567-e89b-12d3-a456-426614174000')).toBe(false);
      });

      it('should reject numeric ID values', () => {
        expect(isValidForEmbedding('123456')).toBe(false);
        expect(isValidForEmbedding('9999999')).toBe(false);
      });
    });
  });
});
