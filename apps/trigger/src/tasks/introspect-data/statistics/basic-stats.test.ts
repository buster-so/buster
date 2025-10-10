import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BasicStatsAnalyzer } from './basic-stats';
import { DuckDBManager } from './duckdb-manager';
import { createTestTableSample } from './test-helpers';

describe('BasicStatsAnalyzer', () => {
  let db: DuckDBManager;
  let analyzer: BasicStatsAnalyzer;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();
    analyzer = new BasicStatsAnalyzer(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('computeNullRate', () => {
    it('should compute null rate correctly', async () => {
      const sample = createTestTableSample([
        { id: 1, name: 'Alice', email: null },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: null, email: 'charlie@example.com' },
        { id: 4, name: 'David', email: null },
      ]);

      await db.loadSampleData(sample);

      const nameNullRate = await analyzer.computeNullRate('name');
      const emailNullRate = await analyzer.computeNullRate('email');

      expect(nameNullRate).toBe(0.25); // 1 out of 4
      expect(emailNullRate).toBe(0.5); // 2 out of 4
    });

    it('should return 0 for columns with no nulls', async () => {
      const sample = createTestTableSample([
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ]);

      await db.loadSampleData(sample);

      const result = await analyzer.computeNullRate('value');
      expect(result).toBe(0);
    });
  });

  describe('computeDistinctCount', () => {
    it('should compute distinct count correctly', async () => {
      const sample = createTestTableSample([
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
        { category: 'C', value: 4 },
        { category: 'B', value: 5 },
      ]);

      await db.loadSampleData(sample);

      const categoryDistinct = await analyzer.computeDistinctCount('category');
      const valueDistinct = await analyzer.computeDistinctCount('value');

      expect(categoryDistinct).toBe(3); // A, B, C
      expect(valueDistinct).toBe(5); // 1, 2, 3, 4, 5
    });

    it('should handle nulls in distinct count', async () => {
      const sample = createTestTableSample([
        { value: 'A' },
        { value: null },
        { value: 'A' },
        { value: null },
      ]);

      await db.loadSampleData(sample);

      const result = await analyzer.computeDistinctCount('value');
      expect(result).toBe(1); // Only 'A' is distinct (nulls don't count)
    });
  });

  describe('computeUniquenessRatio', () => {
    it('should compute uniqueness ratio correctly', async () => {
      const sample = createTestTableSample([
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
        { id: 4, category: 'C' },
      ]);

      await db.loadSampleData(sample);

      const idUniqueness = await analyzer.computeUniquenessRatio('id');
      const categoryUniqueness = await analyzer.computeUniquenessRatio('category');

      expect(idUniqueness).toBe(1); // 4 distinct / 4 total = 1
      expect(categoryUniqueness).toBe(0.75); // 3 distinct / 4 total = 0.75
    });
  });

  describe('computeEmptyStringRate', () => {
    it('should compute empty string rate for text columns', async () => {
      const sample = createTestTableSample([
        { name: 'Alice' },
        { name: '' },
        { name: 'Bob' },
        { name: '' },
        { name: null },
      ]);

      await db.loadSampleData(sample);

      const result = await analyzer.computeEmptyStringRate('name', true);
      expect(result).toBe(0.4); // 2 empty strings out of 5 total
    });

    it('should return 0 for numeric columns (type conversion error)', async () => {
      const sample = createTestTableSample([{ id: 1 }, { id: 2 }, { id: 3 }]);

      await db.loadSampleData(sample);

      const result = await analyzer.computeEmptyStringRate('id', false);
      expect(result).toBe(0); // Should handle error and return 0
    });
  });

  describe('batchComputeBasicStats', () => {
    it('should compute all stats efficiently in a single query', async () => {
      const sample = createTestTableSample([
        { id: 1, name: 'Alice', score: 85, active: true },
        { id: 2, name: 'Bob', score: 90, active: false },
        { id: 3, name: '', score: null, active: true },
        { id: 4, name: 'Charlie', score: 85, active: true },
        { id: 5, name: null, score: 95, active: false },
      ]);

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'id', type: 'BIGINT' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'score', type: 'INTEGER' },
        { name: 'active', type: 'BOOLEAN' },
      ];

      const stats = await analyzer.batchComputeBasicStats(columnMetadata);

      // Check ID stats (all unique, no nulls)
      const idStats = stats.get('id');
      expect(idStats).toBeDefined();
      expect(idStats?.nullRate).toBe(0);
      expect(idStats?.distinctCount).toBe(5);
      expect(idStats?.uniquenessRatio).toBe(1);
      expect(idStats?.emptyStringRate).toBe(0); // Numeric column

      // Check name stats (has nulls and empty strings)
      const nameStats = stats.get('name');
      expect(nameStats).toBeDefined();
      expect(nameStats?.nullRate).toBe(0.2); // 1 null out of 5
      expect(nameStats?.distinctCount).toBe(4); // Alice, Bob, '', Charlie
      expect(nameStats?.uniquenessRatio).toBe(0.8);
      expect(nameStats?.emptyStringRate).toBe(0.2); // 1 empty string out of 5

      // Check score stats
      const scoreStats = stats.get('score');
      expect(scoreStats).toBeDefined();
      expect(scoreStats?.nullRate).toBe(0.2); // 1 null out of 5
      expect(scoreStats?.distinctCount).toBe(3); // 85, 90, 95
      expect(scoreStats?.emptyStringRate).toBe(0); // Numeric column
    });

    it('should handle empty column list', async () => {
      const result = await analyzer.batchComputeBasicStats([]);
      expect(result.size).toBe(0);
    });

    it('should only check empty strings for text columns', async () => {
      const sample = createTestTableSample([
        { text_col: 'hello', num_col: 123 },
        { text_col: '', num_col: 456 },
        { text_col: 'world', num_col: 789 },
      ]);

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'text_col', type: 'VARCHAR' },
        { name: 'num_col', type: 'INTEGER' },
      ];

      const stats = await analyzer.batchComputeBasicStats(columnMetadata);

      const textStats = stats.get('text_col');
      const numStats = stats.get('num_col');

      expect(textStats?.emptyStringRate).toBeCloseTo(0.333, 2); // 1 out of 3
      expect(numStats?.emptyStringRate).toBe(0); // Should be 0 for numeric
    });

    it('should correctly identify various text types', async () => {
      const sample = createTestTableSample([
        {
          varchar_col: 'test',
          text_col: 'test',
          string_col: 'test',
          char_col: 'test',
          int_col: 123,
        },
        {
          varchar_col: '',
          text_col: '',
          string_col: '',
          char_col: '',
          int_col: 456,
        },
      ]);

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'varchar_col', type: 'VARCHAR(255)' },
        { name: 'text_col', type: 'TEXT' },
        { name: 'string_col', type: 'STRING' },
        { name: 'char_col', type: 'CHAR(10)' },
        { name: 'int_col', type: 'INTEGER' },
      ];

      const stats = await analyzer.batchComputeBasicStats(columnMetadata);

      // All text types should have 0.5 empty string rate
      expect(stats.get('varchar_col')?.emptyStringRate).toBe(0.5);
      expect(stats.get('text_col')?.emptyStringRate).toBe(0.5);
      expect(stats.get('string_col')?.emptyStringRate).toBe(0.5);
      expect(stats.get('char_col')?.emptyStringRate).toBe(0.5);

      // Integer should have 0
      expect(stats.get('int_col')?.emptyStringRate).toBe(0);
    });

    it('should handle large datasets efficiently', async () => {
      const sample = createTestTableSample(
        Array(1000)
          .fill(null)
          .map((_, i) => ({
            id: i,
            category: `cat_${i % 10}`,
            value: Math.random() * 100,
            name: i % 5 === 0 ? '' : `name_${i}`,
          }))
      );

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'id', type: 'INTEGER' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'value', type: 'DOUBLE' },
        { name: 'name', type: 'VARCHAR' },
      ];

      const stats = await analyzer.batchComputeBasicStats(columnMetadata);

      expect(stats.size).toBe(4);

      const idStats = stats.get('id');
      expect(idStats?.distinctCount).toBe(1000);
      expect(idStats?.uniquenessRatio).toBe(1);

      const categoryStats = stats.get('category');
      expect(categoryStats?.distinctCount).toBe(10);
      expect(categoryStats?.uniquenessRatio).toBe(0.01);

      const nameStats = stats.get('name');
      expect(nameStats?.emptyStringRate).toBe(0.2); // 20% are empty (every 5th)
    });
  });
});
