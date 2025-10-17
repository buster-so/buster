import { getClient } from '@buster/database/connection';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  extractSearchableColumnsFromYaml,
  healthCheck,
  type SearchTarget,
  type StoredValueResult,
  StoredValuesError,
  searchValuesAcrossTargets,
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
} from './search';

// Mock dependencies
vi.mock('@buster/database/connection', () => ({
  getClient: vi.fn(),
}));

describe('search.ts - Unit Tests', () => {
  const mockClient = {
    unsafe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getClient as Mock).mockReturnValue(mockClient);
  });

  describe('searchValuesByEmbedding', () => {
    const mockResults: StoredValueResult[] = [
      {
        id: 'test-id-1',
        value: 'test value 1',
        database_name: 'test_db',
        column_name: 'test_col',
        table_name: 'test_table',
        schema_name: 'public',
        synced_at: new Date('2024-01-01'),
      },
    ];

    const validEmbedding = new Array(512).fill(0.1);

    it('should search values with valid embedding', async () => {
      mockClient.unsafe.mockResolvedValue(mockResults);

      const result = await searchValuesByEmbedding(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        { limit: 10 }
      );

      expect(result).toEqual(mockResults);
      expect(mockClient.unsafe).toHaveBeenCalledTimes(1);

      const [query, params] = mockClient.unsafe.mock.calls[0];
      expect(query).toContain('ds_cc3ef3bc_44ec_4a43_8dc4_681cae5c996a');
      expect(query).toContain('LIMIT $2');
      expect(params).toEqual([`[${validEmbedding.join(',')}]`, 10]);
    });

    it('should use default options when none provided', async () => {
      mockClient.unsafe.mockResolvedValue(mockResults);

      const result = await searchValuesByEmbedding(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding
      );

      expect(result).toEqual(mockResults);
      const [, params] = mockClient.unsafe.mock.calls[0];
      expect(params[1]).toBe(10); // default limit
    });

    it('should handle similarity threshold', async () => {
      mockClient.unsafe.mockResolvedValue(mockResults);

      await searchValuesByEmbedding('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', validEmbedding, {
        limit: 5,
        similarityThreshold: 0.8,
      });

      const [query, params] = mockClient.unsafe.mock.calls[0];
      expect(query).toContain('WHERE 1 - (embedding <=> $1) >= $3');
      expect(query).toContain('ORDER BY similarity DESC');
      expect(params).toEqual([`[${validEmbedding.join(',')}]`, 5, 0.8]);
    });

    it('should throw StoredValuesError for invalid UUID', async () => {
      await expect(searchValuesByEmbedding('invalid-uuid', validEmbedding)).rejects.toThrow(
        StoredValuesError
      );
    });

    it('should accept embeddings of any length', async () => {
      mockClient.unsafe.mockResolvedValue(mockResults);

      // Should now accept smaller embeddings since the schema was changed
      const result = await searchValuesByEmbedding(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        [0.1, 0.2, 0.3]
      );

      expect(result).toEqual(mockResults);
      expect(mockClient.unsafe).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockClient.unsafe.mockRejectedValue(new Error('Database error'));

      await expect(
        searchValuesByEmbedding('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a', validEmbedding)
      ).rejects.toThrow(StoredValuesError);
    });
  });

  describe('searchValuesByEmbeddingWithFilters', () => {
    const validEmbedding = new Array(512).fill(0.1);

    it('should apply all filters when provided', async () => {
      mockClient.unsafe.mockResolvedValue([]);

      await searchValuesByEmbeddingWithFilters(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        { limit: 10 },
        'test_db',
        'public',
        'users',
        'email'
      );

      const [query, params] = mockClient.unsafe.mock.calls[0];
      expect(query).toContain('database_name = $3');
      expect(query).toContain('schema_name = $4');
      expect(query).toContain('table_name = $5');
      expect(query).toContain('column_name = $6');
      expect(params).toEqual([
        `[${validEmbedding.join(',')}]`,
        10,
        'test_db',
        'public',
        'users',
        'email',
      ]);
    });

    it('should apply no filters when none provided', async () => {
      mockClient.unsafe.mockResolvedValue([]);

      await searchValuesByEmbeddingWithFilters(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding
      );

      const [query] = mockClient.unsafe.mock.calls[0];
      expect(query).not.toContain('WHERE');
    });

    it('should apply partial filters correctly', async () => {
      mockClient.unsafe.mockResolvedValue([]);

      await searchValuesByEmbeddingWithFilters(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        { limit: 10 },
        undefined,
        'public',
        undefined,
        'email'
      );

      const [query, params] = mockClient.unsafe.mock.calls[0];
      expect(query).not.toContain('database_name =');
      expect(query).toContain('schema_name = $3');
      expect(query).not.toContain('table_name =');
      expect(query).toContain('column_name = $4');
      expect(params).toEqual([`[${validEmbedding.join(',')}]`, 10, 'public', 'email']);
    });

    it('should combine filters with similarity threshold', async () => {
      mockClient.unsafe.mockResolvedValue([]);

      await searchValuesByEmbeddingWithFilters(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        { limit: 10, similarityThreshold: 0.7 },
        'test_db'
      );

      const [query, params] = mockClient.unsafe.mock.calls[0];
      expect(query).toContain('database_name = $3');
      expect(query).toContain('1 - (embedding <=> $1) >= $4');
      expect(params).toEqual([`[${validEmbedding.join(',')}]`, 10, 'test_db', 0.7]);
    });
  });

  describe('searchValuesAcrossTargets', () => {
    const validEmbedding = new Array(512).fill(0.1);

    it('should search multiple targets in parallel', async () => {
      const mockResults1 = [{ id: '1', value: 'result1' } as StoredValueResult];
      const mockResults2 = [{ id: '2', value: 'result2' } as StoredValueResult];

      mockClient.unsafe.mockResolvedValueOnce(mockResults1).mockResolvedValueOnce(mockResults2);

      const targets: SearchTarget[] = [
        {
          database_name: 'db1',
          schema_name: 'schema1',
          table_name: 'table1',
          column_name: 'col1',
        },
        {
          database_name: 'db2',
          schema_name: 'schema2',
          table_name: 'table2',
          column_name: 'col2',
        },
      ];

      const result = await searchValuesAcrossTargets(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        targets,
        5
      );

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockResults1[0]);
      expect(result).toContainEqual(mockResults2[0]);
      expect(mockClient.unsafe).toHaveBeenCalledTimes(2);
    });

    it('should continue with other targets if one fails', async () => {
      const mockResults = [{ id: '1', value: 'result1' } as StoredValueResult];

      mockClient.unsafe
        .mockRejectedValueOnce(new Error('Target 1 failed'))
        .mockResolvedValueOnce(mockResults);

      const targets: SearchTarget[] = [
        {
          database_name: 'db1',
          schema_name: 'schema1',
          table_name: 'table1',
          column_name: 'col1',
        },
        {
          database_name: 'db2',
          schema_name: 'schema2',
          table_name: 'table2',
          column_name: 'col2',
        },
      ];

      const result = await searchValuesAcrossTargets(
        'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
        validEmbedding,
        targets,
        5
      );

      expect(result).toHaveLength(1);
      expect(result).toEqual(mockResults);
    });

    it('should validate targets array', async () => {
      await expect(
        searchValuesAcrossTargets(
          'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
          validEmbedding,
          [], // empty targets
          5
        )
      ).rejects.toThrow(StoredValuesError);
    });
  });

  describe('healthCheck', () => {
    it('should return true when table exists', async () => {
      mockClient.unsafe.mockResolvedValue([{ table_exists: true }]);

      const result = await healthCheck('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');

      expect(result).toBe(true);
      expect(mockClient.unsafe).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.tables'),
        ['ds_cc3ef3bc_44ec_4a43_8dc4_681cae5c996a']
      );
    });

    it('should return false when table does not exist', async () => {
      mockClient.unsafe.mockResolvedValue([{ table_exists: false }]);

      const result = await healthCheck('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a');

      expect(result).toBe(false);
    });

    it('should throw StoredValuesError for invalid UUID', async () => {
      await expect(healthCheck('invalid-uuid')).rejects.toThrow(StoredValuesError);
    });

    it('should handle database errors', async () => {
      mockClient.unsafe.mockRejectedValue(new Error('Database error'));

      await expect(healthCheck('cc3ef3bc-44ec-4a43-8dc4-681cae5c996a')).rejects.toThrow(
        StoredValuesError
      );
    });
  });

  describe('extractSearchableColumnsFromYaml', () => {
    it('should extract searchable columns from valid YAML', () => {
      const yamlContent = JSON.stringify({
        database: 'test_db',
        tables: [
          {
            name: 'users',
            schema: 'public',
            columns: [
              { name: 'id', type: 'integer' },
              { name: 'email', type: 'varchar(255)' },
              { name: 'description', type: 'text' },
              { name: 'created_at', type: 'timestamp' },
            ],
          },
          {
            table: 'products',
            columns: [
              { name: 'name', type: 'string' },
              { name: 'price', type: 'decimal' },
            ],
          },
        ],
      });

      const result = extractSearchableColumnsFromYaml(yamlContent);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        database_name: 'test_db',
        schema_name: 'public',
        table_name: 'users',
        column_name: 'email',
      });
      expect(result).toContainEqual({
        database_name: 'test_db',
        schema_name: 'public',
        table_name: 'users',
        column_name: 'description',
      });
      expect(result).toContainEqual({
        database_name: 'test_db',
        schema_name: 'public',
        table_name: 'products',
        column_name: 'name',
      });
    });

    it('should handle missing fields gracefully', () => {
      const yamlContent = JSON.stringify({
        tables: [
          {
            columns: [{ type: 'text' }, { name: 'field', type: 'integer' }],
          },
        ],
      });

      const result = extractSearchableColumnsFromYaml(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        database_name: 'unknown',
        schema_name: 'public',
        table_name: 'unknown_table',
        column_name: 'unknown_column',
      });
    });

    it('should throw StoredValuesError for invalid YAML', () => {
      expect(() => extractSearchableColumnsFromYaml('invalid yaml')).toThrow(StoredValuesError);
    });

    it('should return empty array for YAML without tables', () => {
      const yamlContent = JSON.stringify({
        database: 'test_db',
      });

      const result = extractSearchableColumnsFromYaml(yamlContent);

      expect(result).toEqual([]);
    });
  });
});
