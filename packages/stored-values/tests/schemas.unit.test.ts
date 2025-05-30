import { describe, expect, it } from 'vitest';
import {
  EmbeddingOptionsSchema,
  EmbeddingSchema,
  SearchOptionsSchema,
  SearchTargetSchema,
  SearchTermsSchema,
  StoredValueResultSchema,
  UuidSchema,
} from '../src/schemas';

describe('schemas.ts - Unit Tests', () => {
  describe('UuidSchema', () => {
    it('should validate correct UUID', () => {
      const uuid = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
      const result = UuidSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUID format', () => {
      expect(() => UuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => UuidSchema.parse('cc3ef3bc-44ec-4a43-8dc4')).toThrow();
      expect(() => UuidSchema.parse('')).toThrow();
    });

    it('should reject UUID without hyphens', () => {
      expect(() => UuidSchema.parse('cc3ef3bc44ec4a438dc4681cae5c996a')).toThrow();
    });
  });

  describe('EmbeddingSchema', () => {
    it('should validate correct embedding array (1536 dimensions)', () => {
      const embedding = new Array(1536).fill(0).map((_, i) => i * 0.001);
      const result = EmbeddingSchema.parse(embedding);
      expect(result).toEqual(embedding);
      expect(result).toHaveLength(1536);
    });

    it('should reject wrong dimension arrays', () => {
      expect(() => EmbeddingSchema.parse([0.1, 0.2, 0.3])).toThrow();
      expect(() => EmbeddingSchema.parse(new Array(1537).fill(0.1))).toThrow();
      expect(() => EmbeddingSchema.parse([])).toThrow();
    });

    it('should reject non-number values', () => {
      const invalidEmbedding = new Array(1536).fill(0);
      invalidEmbedding[100] = 'not a number';
      expect(() => EmbeddingSchema.parse(invalidEmbedding)).toThrow();
    });

    it('should allow negative numbers', () => {
      const embedding = new Array(1536).fill(-0.5);
      const result = EmbeddingSchema.parse(embedding);
      expect(result).toEqual(embedding);
    });
  });

  describe('SearchOptionsSchema', () => {
    it('should validate with defaults', () => {
      const result = SearchOptionsSchema.parse({});
      expect(result).toEqual({ limit: 10 });
    });

    it('should validate custom limit', () => {
      const result = SearchOptionsSchema.parse({ limit: 50 });
      expect(result).toEqual({ limit: 50 });
    });

    it('should validate with similarity threshold', () => {
      const result = SearchOptionsSchema.parse({
        limit: 20,
        similarityThreshold: 0.8,
      });
      expect(result).toEqual({ limit: 20, similarityThreshold: 0.8 });
    });

    it('should reject invalid limit values', () => {
      expect(() => SearchOptionsSchema.parse({ limit: 0 })).toThrow();
      expect(() => SearchOptionsSchema.parse({ limit: -5 })).toThrow();
      expect(() => SearchOptionsSchema.parse({ limit: 1001 })).toThrow();
      expect(() => SearchOptionsSchema.parse({ limit: 1.5 })).toThrow();
    });

    it('should reject invalid similarity threshold values', () => {
      expect(() => SearchOptionsSchema.parse({ similarityThreshold: -0.1 })).toThrow();
      expect(() => SearchOptionsSchema.parse({ similarityThreshold: 1.1 })).toThrow();
      expect(() => SearchOptionsSchema.parse({ similarityThreshold: 'high' })).toThrow();
    });
  });

  describe('SearchTargetSchema', () => {
    it('should validate complete search target', () => {
      const target = {
        database_name: 'production',
        schema_name: 'public',
        table_name: 'users',
        column_name: 'email',
      };
      const result = SearchTargetSchema.parse(target);
      expect(result).toEqual(target);
    });

    it('should reject empty strings', () => {
      expect(() =>
        SearchTargetSchema.parse({
          database_name: '',
          schema_name: 'public',
          table_name: 'users',
          column_name: 'email',
        })
      ).toThrow();

      expect(() =>
        SearchTargetSchema.parse({
          database_name: 'production',
          schema_name: '',
          table_name: 'users',
          column_name: 'email',
        })
      ).toThrow();
    });

    it('should reject missing fields', () => {
      expect(() =>
        SearchTargetSchema.parse({
          database_name: 'production',
          schema_name: 'public',
          table_name: 'users',
          // missing column_name
        })
      ).toThrow();
    });
  });

  describe('StoredValueResultSchema', () => {
    it('should validate complete stored value result', () => {
      const result = {
        id: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        value: 'test@example.com',
        database_name: 'production',
        column_name: 'email',
        table_name: 'users',
        schema_name: 'public',
        synced_at: new Date('2024-01-01'),
      };
      const validated = StoredValueResultSchema.parse(result);
      expect(validated).toEqual(result);
    });

    it('should allow null synced_at', () => {
      const result = {
        id: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        value: 'test@example.com',
        database_name: 'production',
        column_name: 'email',
        table_name: 'users',
        schema_name: 'public',
        synced_at: null,
      };
      const validated = StoredValueResultSchema.parse(result);
      expect(validated).toEqual(result);
    });

    it('should reject invalid date', () => {
      expect(() =>
        StoredValueResultSchema.parse({
          id: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
          value: 'test@example.com',
          database_name: 'production',
          column_name: 'email',
          table_name: 'users',
          schema_name: 'public',
          synced_at: 'invalid-date',
        })
      ).toThrow();
    });
  });

  describe('EmbeddingOptionsSchema', () => {
    it('should validate with defaults', () => {
      const result = EmbeddingOptionsSchema.parse({});
      expect(result).toEqual({ maxRetries: 3 });
    });

    it('should validate custom max retries', () => {
      const result = EmbeddingOptionsSchema.parse({ maxRetries: 5 });
      expect(result).toEqual({ maxRetries: 5 });
    });

    it('should validate with abort signal', () => {
      const controller = new AbortController();
      const result = EmbeddingOptionsSchema.parse({
        maxRetries: 2,
        abortSignal: controller.signal,
      });
      expect(result.maxRetries).toBe(2);
      expect(result.abortSignal).toBe(controller.signal);
    });

    it('should reject invalid max retries', () => {
      expect(() => EmbeddingOptionsSchema.parse({ maxRetries: -1 })).toThrow();
      expect(() => EmbeddingOptionsSchema.parse({ maxRetries: 11 })).toThrow();
      expect(() => EmbeddingOptionsSchema.parse({ maxRetries: 1.5 })).toThrow();
    });

    it('should reject invalid abort signal', () => {
      expect(() => EmbeddingOptionsSchema.parse({ abortSignal: 'not-a-signal' })).toThrow();
    });
  });

  describe('SearchTermsSchema', () => {
    it('should validate valid search terms', () => {
      const terms = ['user', 'email', 'address'];
      const result = SearchTermsSchema.parse(terms);
      expect(result).toEqual(terms);
    });

    it('should trim whitespace from terms', () => {
      const terms = ['  user  ', '  email  '];
      const result = SearchTermsSchema.parse(terms);
      expect(result).toEqual(['user', 'email']);
    });

    it('should reject empty array', () => {
      expect(() => SearchTermsSchema.parse([])).toThrow();
    });

    it('should reject too many terms', () => {
      const manyTerms = new Array(101).fill('term');
      expect(() => SearchTermsSchema.parse(manyTerms)).toThrow();
    });

    it('should reject non-string values', () => {
      expect(() => SearchTermsSchema.parse(['valid', 123, 'term'])).toThrow();
    });
  });
});
