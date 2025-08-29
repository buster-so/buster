import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBManager } from './duckdb-manager';
import { createTestTableSample } from './test-helpers';

describe('DuckDBManager', () => {
  let manager: DuckDBManager;

  beforeEach(async () => {
    manager = new DuckDBManager();
    await manager.initialize();
  });

  afterEach(async () => {
    if (manager) {
      await manager.cleanup();
    }
  });

  describe('initialize and cleanup', () => {
    it('should successfully initialize and cleanup', async () => {
      const newManager = new DuckDBManager();
      await expect(newManager.initialize()).resolves.toBeUndefined();
      await expect(newManager.cleanup()).resolves.toBeUndefined();
    });

    it('should handle multiple cleanups gracefully', async () => {
      await manager.cleanup();
      await expect(manager.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('loadSampleData', () => {
    it('should load diverse sample data with proper types', async () => {
      const mockSample = createTestTableSample([
        {
          id: 1,
          name: 'Alice',
          price: 99.99,
          quantity: 10,
          active: true,
          created_at: '2024-01-01',
          metadata: { key: 'value' },
        },
        {
          id: 2,
          name: 'Bob',
          price: 149.99,
          quantity: 20,
          active: false,
          created_at: '2024-01-02',
          metadata: { key: 'value2' },
        },
        {
          id: 3,
          name: null,
          price: null,
          quantity: 30,
          active: true,
          created_at: '2024-01-03',
          metadata: null,
        },
      ]);

      await expect(manager.loadSampleData(mockSample)).resolves.toBeUndefined();

      // Verify data was loaded by querying it
      const result = await manager.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM sample_data'
      );
      expect(result[0]?.count).toBe(3);

      // Verify column types
      const columns = await manager.getColumnInfo();
      expect(columns).toContainEqual(expect.objectContaining({ name: 'id' }));
      expect(columns).toContainEqual(expect.objectContaining({ name: 'name' }));
      expect(columns).toContainEqual(expect.objectContaining({ name: 'price' }));
    });

    it('should handle empty sample data', async () => {
      const emptySample = createTestTableSample([]);

      await expect(manager.loadSampleData(emptySample)).resolves.toBeUndefined();
    });

    it('should properly escape single quotes in string values', async () => {
      const sampleWithQuotes = createTestTableSample([
        { id: 1, name: "O'Brien", description: "It's a test" },
        { id: 2, name: "D'Angelo", description: "Can't stop" },
      ]);

      await expect(manager.loadSampleData(sampleWithQuotes)).resolves.toBeUndefined();

      const result = await manager.query<{ name: string; description: string }>(
        'SELECT name, description FROM sample_data ORDER BY id'
      );
      expect(result[0]?.name).toBe("O'Brien");
      expect(result[0]?.description).toBe("It's a test");
      expect(result[1]?.name).toBe("D'Angelo");
    });

    it('should handle mixed type detection correctly', async () => {
      const mixedTypeSample = createTestTableSample([
        { mixed: '123', should_be_varchar: 'abc' },
        { mixed: '456', should_be_varchar: '123' },
        { mixed: '789', should_be_varchar: 'def' },
      ]);

      await manager.loadSampleData(mixedTypeSample);

      const columns = await manager.getColumnInfo();
      const mixedCol = columns.find((c) => c.name === 'mixed');
      const varcharCol = columns.find((c) => c.name === 'should_be_varchar');

      // The improved implementation correctly identifies numeric strings as BIGINT
      expect(mixedCol?.type).toBe('BIGINT');
      expect(varcharCol?.type).toBe('VARCHAR');
    });

    it('should handle large batch inserts', async () => {
      const largeSample = createTestTableSample(
        Array(2500)
          .fill(null)
          .map((_, i) => ({
            id: i,
            value: `value_${i}`,
            number: Math.random() * 1000,
          }))
      );

      await expect(manager.loadSampleData(largeSample)).resolves.toBeUndefined();

      const result = await manager.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM sample_data'
      );
      expect(result[0]?.count).toBe(2500);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      const sample = createTestTableSample([
        { id: 1, name: 'Test', value: 100 },
        { id: 2, name: 'Another', value: 200 },
        { id: 3, name: 'Third', value: 300 },
      ]);
      await manager.loadSampleData(sample);
    });

    it('should execute SELECT queries', async () => {
      const result = await manager.query<{ id: number; name: string; value: number }>(
        'SELECT * FROM sample_data ORDER BY id'
      );
      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe(1);
      expect(result[0]?.name).toBe('Test');
    });

    it('should execute aggregate queries', async () => {
      const result = await manager.query<{ total: number; average: number }>(
        'SELECT SUM(value) as total, AVG(value) as average FROM sample_data'
      );
      expect(result[0]?.total).toBe(600);
      expect(result[0]?.average).toBe(200);
    });

    it('should handle query errors gracefully', async () => {
      await expect(manager.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    });
  });

  describe('BigInt conversion', () => {
    it('should automatically convert BigInt values to numbers', async () => {
      // Create a large dataset that might trigger BigInt returns
      const largeSample = createTestTableSample(
        Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            category: `cat_${i % 100}`,
            value: i * 1000000,
          }))
      );

      await manager.loadSampleData(largeSample);

      // COUNT operations often return BigInt for large numbers
      const result = await manager.query<{
        total_count: number;
        distinct_categories: number;
        total_value: number;
      }>(`
        SELECT 
          COUNT(*) as total_count,
          COUNT(DISTINCT category) as distinct_categories,
          SUM(value) as total_value
        FROM sample_data
      `);

      // All values should be numbers, not BigInt
      expect(typeof result[0]?.total_count).toBe('number');
      expect(typeof result[0]?.distinct_categories).toBe('number');
      expect(typeof result[0]?.total_value).toBe('number');

      expect(result[0]?.total_count).toBe(1000);
      expect(result[0]?.distinct_categories).toBe(100);
    });
  });

  describe('getColumnInfo', () => {
    it('should return correct column information', async () => {
      const sample = createTestTableSample([
        {
          int_col: 42,
          float_col: 3.14,
          string_col: 'hello',
          bool_col: true,
        },
      ]);

      await manager.loadSampleData(sample);
      const columns = await manager.getColumnInfo();

      expect(columns).toHaveLength(4);

      const intCol = columns.find((c) => c.name === 'int_col');
      const floatCol = columns.find((c) => c.name === 'float_col');
      const stringCol = columns.find((c) => c.name === 'string_col');
      const boolCol = columns.find((c) => c.name === 'bool_col');

      expect(intCol?.type).toBe('BIGINT');
      expect(floatCol?.type).toBe('DOUBLE');
      expect(stringCol?.type).toBe('VARCHAR');
      expect(boolCol?.type).toBe('BOOLEAN');
    });
  });

  describe('getTableName', () => {
    it('should return the correct table name', () => {
      expect(manager.getTableName()).toBe('sample_data');
    });
  });

  describe('type inference with sampling', () => {
    it('should infer integer type when all values are integers', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            definitely_int: i,
            definitely_float: i * 1.5,
          }))
      );

      await manager.loadSampleData(sample);
      const columns = await manager.getColumnInfo();

      const intCol = columns.find((c) => c.name === 'definitely_int');
      const floatCol = columns.find((c) => c.name === 'definitely_float');

      expect(intCol?.type).toBe('BIGINT');
      expect(floatCol?.type).toBe('DOUBLE');
    });

    it('should default to VARCHAR for mixed types', async () => {
      const sample = createTestTableSample([
        { mixed: 123 },
        { mixed: 'string' },
        { mixed: 456 },
        { mixed: 'another' },
      ]);

      await manager.loadSampleData(sample);
      const columns = await manager.getColumnInfo();

      const mixedCol = columns.find((c) => c.name === 'mixed');
      expect(mixedCol?.type).toBe('VARCHAR');
    });

    it('should handle nulls in type inference', async () => {
      const sample = createTestTableSample([
        { nullable_col: null },
        { nullable_col: null },
        { nullable_col: 123 },
        { nullable_col: 456 },
      ]);

      await manager.loadSampleData(sample);
      const columns = await manager.getColumnInfo();

      const nullableCol = columns.find((c) => c.name === 'nullable_col');
      // Should still detect as BIGINT despite nulls
      expect(nullableCol?.type).toBe('BIGINT');
    });
  });
});
