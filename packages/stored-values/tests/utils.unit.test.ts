import { describe, expect, it } from 'vitest';
import {
  buildWhereClause,
  escapeSqlString,
  formatHalfvecLiteral,
  formatSchemaName,
  isValidEmbedding,
} from '../src/utils';

describe('utils.ts - Unit Tests', () => {
  describe('formatSchemaName', () => {
    it('should format UUID with hyphens to underscore format', () => {
      const uuid = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
      const result = formatSchemaName(uuid);
      expect(result).toBe('ds_cc3ef3bc_44ec_4a43_8dc4_681cae5c996a');
    });

    it('should handle UUID without hyphens', () => {
      const uuid = 'cc3ef3bc44ec4a438dc4681cae5c996a';
      const result = formatSchemaName(uuid);
      expect(result).toBe('ds_cc3ef3bc44ec4a438dc4681cae5c996a');
    });

    it('should handle empty string', () => {
      const result = formatSchemaName('');
      expect(result).toBe('ds_');
    });
  });

  describe('escapeSqlString', () => {
    it('should escape single quotes', () => {
      const input = "John's data";
      const result = escapeSqlString(input);
      expect(result).toBe("John''s data");
    });

    it('should escape multiple single quotes', () => {
      const input = "It's John's 'special' data";
      const result = escapeSqlString(input);
      expect(result).toBe("It''s John''s ''special'' data");
    });

    it('should handle strings without quotes', () => {
      const input = 'No quotes here';
      const result = escapeSqlString(input);
      expect(result).toBe('No quotes here');
    });

    it('should handle empty string', () => {
      const result = escapeSqlString('');
      expect(result).toBe('');
    });
  });

  describe('formatHalfvecLiteral', () => {
    it('should format embedding array as halfvec literal', () => {
      const embedding = [0.1, 0.2, 0.3];
      const result = formatHalfvecLiteral(embedding);
      expect(result).toBe("'[0.1,0.2,0.3]'::halfvec");
    });

    it('should handle single value embedding', () => {
      const embedding = [0.5];
      const result = formatHalfvecLiteral(embedding);
      expect(result).toBe("'[0.5]'::halfvec");
    });

    it('should handle empty array', () => {
      const embedding: number[] = [];
      const result = formatHalfvecLiteral(embedding);
      expect(result).toBe("'[]'::halfvec");
    });

    it('should handle negative numbers', () => {
      const embedding = [-0.1, 0.2, -0.3];
      const result = formatHalfvecLiteral(embedding);
      expect(result).toBe("'[-0.1,0.2,-0.3]'::halfvec");
    });

    it('should maintain precision', () => {
      const embedding = [0.123456789, 1.987654321];
      const result = formatHalfvecLiteral(embedding);
      expect(result).toBe("'[0.123456789,1.987654321]'::halfvec");
    });
  });

  describe('buildWhereClause', () => {
    it('should build WHERE clause from filters', () => {
      const filters = ["database_name = 'prod'", "table_name = 'users'"];
      const result = buildWhereClause(filters);
      expect(result).toBe("WHERE database_name = 'prod' AND table_name = 'users'");
    });

    it('should handle single filter', () => {
      const filters = ["column_name = 'email'"];
      const result = buildWhereClause(filters);
      expect(result).toBe("WHERE column_name = 'email'");
    });

    it('should return empty string for no filters', () => {
      const filters: string[] = [];
      const result = buildWhereClause(filters);
      expect(result).toBe('');
    });

    it('should handle complex filters', () => {
      const filters = [
        "database_name = 'test''s_db'",
        "schema_name IN ('public', 'private')",
        "value LIKE '%search%'",
      ];
      const result = buildWhereClause(filters);
      expect(result).toBe(
        "WHERE database_name = 'test''s_db' AND schema_name IN ('public', 'private') AND value LIKE '%search%'"
      );
    });
  });

  describe('isValidEmbedding', () => {
    it('should validate proper embedding', () => {
      const embedding = [0.1, 0.2, 0.3];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(true);
    });

    it('should reject empty embedding', () => {
      const embedding: number[] = [];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(false);
    });

    it('should reject embedding with non-numbers', () => {
      const embedding = [0.1, 'not a number', 0.3] as number[];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(false);
    });

    it('should reject embedding with NaN', () => {
      const embedding = [0.1, Number.NaN, 0.3];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(false);
    });

    it('should accept negative numbers', () => {
      const embedding = [-0.1, -0.2, -0.3];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(true);
    });

    it('should accept large embeddings', () => {
      const embedding = new Array(1536).fill(0).map((_, i) => i * 0.001);
      const result = isValidEmbedding(embedding);
      expect(result).toBe(true);
    });

    it('should reject null values', () => {
      const embedding = [0.1, null, 0.3] as number[];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(false);
    });

    it('should reject undefined values', () => {
      const embedding = [0.1, undefined, 0.3] as number[];
      const result = isValidEmbedding(embedding);
      expect(result).toBe(false);
    });
  });
});
