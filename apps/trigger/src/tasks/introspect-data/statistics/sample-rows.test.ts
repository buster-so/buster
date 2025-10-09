import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuckDBManager } from './duckdb-manager';
import { SampleRowsExtractor } from './sample-rows';

describe('SampleRowsExtractor', () => {
  const mockDuckDB = {
    getTableName: vi.fn().mockReturnValue('sample_data'),
    query: vi.fn(),
  } as unknown as DuckDBManager;

  const sampleData = [
    {
      id: 1,
      name: 'John Doe',
      age: 30,
      created_at: new Date('2024-01-01'),
      metadata: { key: 'value' },
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 25,
      created_at: new Date('2024-01-02'),
      metadata: { key: 'value2' },
    },
    {
      id: 3,
      name: 'Bob Johnson',
      age: 35,
      created_at: new Date('2024-01-03'),
      metadata: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSampleRows', () => {
    it('should get random sample rows with proper type conversion', async () => {
      vi.mocked(mockDuckDB.query).mockResolvedValue(sampleData);

      const extractor = new SampleRowsExtractor(mockDuckDB);
      const result = await extractor.getSampleRows(5);

      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'));
      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 5'));

      expect(result).toHaveLength(3);
      expect(result[0]?.created_at).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0]?.metadata).toBe('{"key":"value"}');
      expect(result[2]?.metadata).toBeNull();
    });

    it('should handle query errors gracefully', async () => {
      vi.mocked(mockDuckDB.query).mockRejectedValue(new Error('Query failed'));

      const extractor = new SampleRowsExtractor(mockDuckDB);
      const result = await extractor.getSampleRows();

      expect(result).toEqual([]);
    });
  });

  describe('getSampleRowsOrdered', () => {
    it('should get ordered sample rows', async () => {
      vi.mocked(mockDuckDB.query).mockResolvedValue(sampleData);

      const extractor = new SampleRowsExtractor(mockDuckDB);
      const result = await extractor.getSampleRowsOrdered('age', 'DESC', 3);

      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY "age" DESC'));
      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 3'));

      expect(result).toHaveLength(3);
    });

    it('should use random ordering when no orderBy is provided', async () => {
      vi.mocked(mockDuckDB.query).mockResolvedValue(sampleData);

      const extractor = new SampleRowsExtractor(mockDuckDB);
      await extractor.getSampleRowsOrdered();

      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'));
    });
  });

  describe('getDiverseSampleRows', () => {
    it('should get diverse sample rows using complex query', async () => {
      vi.mocked(mockDuckDB.query).mockResolvedValue(sampleData);

      const extractor = new SampleRowsExtractor(mockDuckDB);
      const result = await extractor.getDiverseSampleRows(5);

      expect(mockDuckDB.query).toHaveBeenCalledWith(expect.stringContaining('ROW_NUMBER() OVER'));
      expect(result).toHaveLength(3);
    });

    it('should fall back to simple sampling when complex query fails', async () => {
      const extractor = new SampleRowsExtractor(mockDuckDB);

      // First call (complex query) fails
      vi.mocked(mockDuckDB.query)
        .mockRejectedValueOnce(new Error('Complex query failed'))
        // Second call (fallback) succeeds
        .mockResolvedValueOnce(sampleData);

      const result = await extractor.getDiverseSampleRows(5);

      expect(mockDuckDB.query).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(3);
    });

    it('should fall back when complex query returns empty result', async () => {
      const extractor = new SampleRowsExtractor(mockDuckDB);

      // First call returns empty
      vi.mocked(mockDuckDB.query)
        .mockResolvedValueOnce([])
        // Second call (fallback) succeeds
        .mockResolvedValueOnce(sampleData);

      const result = await extractor.getDiverseSampleRows(5);

      expect(mockDuckDB.query).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(3);
    });
  });

  describe('type conversion', () => {
    it('should handle various data types correctly', async () => {
      const mixedData = [
        {
          date_field: new Date('2024-01-01'),
          string_field: 'text',
          number_field: 42,
          null_field: null,
          undefined_field: undefined,
          boolean_field: true,
          complex_object: { nested: { value: 123 } },
          array_field: [1, 2, 3],
        },
      ];

      vi.mocked(mockDuckDB.query).mockResolvedValue(mixedData);

      const extractor = new SampleRowsExtractor(mockDuckDB);
      const result = await extractor.getSampleRows();

      expect(result[0]?.date_field).toBe('2024-01-01T00:00:00.000Z');
      expect(result[0]?.string_field).toBe('text');
      expect(result[0]?.number_field).toBe(42);
      expect(result[0]?.null_field).toBeNull();
      expect(result[0]?.undefined_field).toBeUndefined();
      expect(result[0]?.boolean_field).toBe(true);
      expect(result[0]?.complex_object).toBe('{"nested":{"value":123}}');
      expect(result[0]?.array_field).toBe('[1,2,3]');
    });
  });
});
