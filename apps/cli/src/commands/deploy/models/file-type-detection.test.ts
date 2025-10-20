import { describe, expect, it } from 'vitest';
import { detectFileType, getFileTypeDescription, isValidFileType } from './file-type-detection';

describe('file-type-detection', () => {
  describe('detectFileType', () => {
    describe('Buster format detection', () => {
      it('should detect valid Buster format with dimensions', () => {
        const data = {
          name: 'users',
          dimensions: [{ name: 'id', searchable: false }],
          measures: [],
        };

        expect(detectFileType(data)).toBe('buster');
      });

      it('should detect valid Buster format with measures', () => {
        const data = {
          name: 'orders',
          measures: [{ name: 'total' }],
          dimensions: [],
        };

        expect(detectFileType(data)).toBe('buster');
      });

      it('should detect valid Buster format with both dimensions and measures', () => {
        const data = {
          name: 'products',
          dimensions: [{ name: 'category' }],
          measures: [{ name: 'price' }],
        };

        expect(detectFileType(data)).toBe('buster');
      });

      it('should detect Buster format even with invalid field types (for error reporting)', () => {
        const data = {
          name: 123, // Invalid type, but still detected as Buster
          dimensions: 'not an array', // Invalid type
        };

        expect(detectFileType(data)).toBe('buster');
      });

      it('should detect Buster format with additional fields', () => {
        const data = {
          name: 'users',
          description: 'User model',
          dimensions: [],
          measures: [],
          metrics: [],
          filters: [],
        };

        expect(detectFileType(data)).toBe('buster');
      });
    });

    describe('dbt format detection', () => {
      it('should detect dbt format with models array', () => {
        const data = {
          version: 2,
          models: [
            {
              name: 'users',
              columns: [],
            },
          ],
        };

        expect(detectFileType(data)).toBe('dbt');
      });

      it('should detect dbt format with semantic_models array', () => {
        const data = {
          version: 2,
          semantic_models: [
            {
              name: 'orders_semantic',
              model: "ref('orders')",
              entities: [],
              dimensions: [],
              measures: [],
            },
          ],
        };

        expect(detectFileType(data)).toBe('dbt');
      });

      it('should detect dbt format with both models and semantic_models', () => {
        const data = {
          version: 2,
          models: [{ name: 'users', columns: [] }],
          semantic_models: [{ name: 'users_semantic', model: "ref('users')" }],
        };

        expect(detectFileType(data)).toBe('dbt');
      });

      it('should detect dbt format with empty arrays', () => {
        const data = {
          version: 2,
          models: [],
          semantic_models: [],
        };

        expect(detectFileType(data)).toBe('dbt');
      });

      it('should prioritize Buster detection over dbt if both keys exist', () => {
        // This shouldn't happen in practice, but test the detection order
        // Buster detection comes first in the implementation
        const data = {
          name: 'test',
          dimensions: [],
          models: [], // Has both Buster (name+dimensions) and dbt (models) keys
        };

        expect(detectFileType(data)).toBe('buster');
      });
    });

    describe('unknown format detection', () => {
      it('should return unknown for null', () => {
        expect(detectFileType(null)).toBe('unknown');
      });

      it('should return unknown for undefined', () => {
        expect(detectFileType(undefined)).toBe('unknown');
      });

      it('should return unknown for empty object', () => {
        expect(detectFileType({})).toBe('unknown');
      });

      it('should return unknown for non-object types', () => {
        expect(detectFileType('string')).toBe('unknown');
        expect(detectFileType(123)).toBe('unknown');
        expect(detectFileType(true)).toBe('unknown');
        expect(detectFileType([])).toBe('unknown');
      });

      it('should return unknown for object without required keys', () => {
        const data = {
          description: 'Some data',
          config: {},
        };

        expect(detectFileType(data)).toBe('unknown');
      });

      it('should return unknown for Buster-like object missing dimensions/measures', () => {
        const data = {
          name: 'test',
          description: 'Has name but no dimensions or measures',
        };

        expect(detectFileType(data)).toBe('unknown');
      });
    });
  });

  describe('isValidFileType', () => {
    it('should return true for buster type', () => {
      expect(isValidFileType('buster')).toBe(true);
    });

    it('should return true for dbt type', () => {
      expect(isValidFileType('dbt')).toBe(true);
    });

    it('should return false for unknown type', () => {
      expect(isValidFileType('unknown')).toBe(false);
    });
  });

  describe('getFileTypeDescription', () => {
    it('should return description for buster type', () => {
      const description = getFileTypeDescription('buster');
      expect(description).toContain('Buster');
      expect(description).toContain('YAML');
    });

    it('should return description for dbt type', () => {
      const description = getFileTypeDescription('dbt');
      expect(description).toContain('dbt');
      expect(description).toContain('metadata');
    });

    it('should return description for unknown type', () => {
      const description = getFileTypeDescription('unknown');
      expect(description).toContain('Unknown');
      expect(description).toContain('format');
    });
  });
});
