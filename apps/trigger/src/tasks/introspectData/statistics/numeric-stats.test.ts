import type { TableSample } from '@buster/data-source';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBManager } from './duckdb-manager';
import { NumericStatsAnalyzer } from './numeric-stats';
import { createTestTableSample } from './test-helpers';

describe('NumericStatsAnalyzer', () => {
  let db: DuckDBManager;
  let analyzer: NumericStatsAnalyzer;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();
    analyzer = new NumericStatsAnalyzer(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('isNumericColumn', () => {
    it('should identify numeric column types', async () => {
      expect(await analyzer.isNumericColumn('test', 'INTEGER')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'BIGINT')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'DOUBLE')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'FLOAT')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'DECIMAL(10,2)')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'NUMERIC')).toBe(true);
      expect(await analyzer.isNumericColumn('test', 'REAL')).toBe(true);
    });

    it('should reject non-numeric column types', async () => {
      expect(await analyzer.isNumericColumn('test', 'VARCHAR')).toBe(false);
      expect(await analyzer.isNumericColumn('test', 'TEXT')).toBe(false);
      expect(await analyzer.isNumericColumn('test', 'BOOLEAN')).toBe(false);
      expect(await analyzer.isNumericColumn('test', 'DATE')).toBe(false);
    });
  });

  describe('computeDescriptiveStats', () => {
    it('should compute mean, median, and standard deviation', async () => {
      const sample = createTestTableSample([
        { value: 10 },
        { value: 20 },
        { value: 30 },
        { value: 40 },
        { value: 50 },
      ]);

      await db.loadSampleData(sample);
      const stats = await analyzer.computeDescriptiveStats('value');

      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.stdDev).toBeCloseTo(15.811, 2);
    });

    it('should handle nulls in descriptive stats', async () => {
      const sample = createTestTableSample([
        { value: 10 },
        { value: null },
        { value: 20 },
        { value: null },
        { value: 30 },
      ]);

      await db.loadSampleData(sample);
      const stats = await analyzer.computeDescriptiveStats('value');

      expect(stats.mean).toBe(20); // (10+20+30)/3
      expect(stats.median).toBe(20);
      expect(stats.stdDev).toBeCloseTo(10, 1);
    });

    it('should handle single value', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({ value: 42 }))
      );

      await db.loadSampleData(sample);
      const stats = await analyzer.computeDescriptiveStats('value');

      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
      expect(stats.stdDev).toBe(0);
    });
  });

  describe('computePercentiles', () => {
    it('should compute percentiles correctly', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({ value: i + 1 })) // 1 to 100
      );

      await db.loadSampleData(sample);
      const percentiles = await analyzer.computePercentiles('value');

      expect(percentiles.p25).toBeCloseTo(25.75, 1);
      expect(percentiles.p50).toBeCloseTo(50.5, 1);
      expect(percentiles.p75).toBeCloseTo(75.25, 1);
      expect(percentiles.p95).toBeCloseTo(95.05, 1);
      expect(percentiles.p99).toBeCloseTo(99.01, 1);
    });

    it('should handle small datasets', async () => {
      const sample = createTestTableSample([
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
      ]);

      await db.loadSampleData(sample);
      const percentiles = await analyzer.computePercentiles('value');

      expect(percentiles.p25).toBe(2);
      expect(percentiles.p50).toBe(3);
      expect(percentiles.p75).toBe(4);
    });

    it('should handle datasets with duplicates', async () => {
      const sample = createTestTableSample([
        ...Array(25)
          .fill(null)
          .map(() => ({ score: 60 })),
        ...Array(25)
          .fill(null)
          .map(() => ({ score: 70 })),
        ...Array(25)
          .fill(null)
          .map(() => ({ score: 80 })),
        ...Array(25)
          .fill(null)
          .map(() => ({ score: 90 })),
      ]);

      await db.loadSampleData(sample);
      const percentiles = await analyzer.computePercentiles('score');

      expect(percentiles.p25).toBeCloseTo(67.5, 1); // Between 60 and 70
      expect(percentiles.p50).toBeCloseTo(75, 1); // Between 70 and 80
      expect(percentiles.p75).toBeCloseTo(82.5, 1); // Between 80 and 90
    });
  });

  describe('computeSkewness', () => {
    it('should return 0 for symmetric distribution', async () => {
      const sample = createTestTableSample([
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
      ]);

      await db.loadSampleData(sample);
      const skewness = await analyzer.computeSkewness('value');

      expect(skewness).toBeCloseTo(0, 5);
    });

    it('should detect positive skew', async () => {
      const sample = createTestTableSample([
        ...Array(80)
          .fill(null)
          .map(() => ({ value: Math.random() * 10 })), // Most values low
        ...Array(20)
          .fill(null)
          .map(() => ({ value: 90 + Math.random() * 10 })), // Few high values
      ]);

      await db.loadSampleData(sample);
      const skewness = await analyzer.computeSkewness('value');

      expect(skewness).toBeGreaterThan(1); // Strong positive skew
    });

    it('should detect negative skew', async () => {
      const sample = createTestTableSample([
        ...Array(20)
          .fill(null)
          .map(() => ({ value: Math.random() * 10 })), // Few low values
        ...Array(80)
          .fill(null)
          .map(() => ({ value: 90 + Math.random() * 10 })), // Most values high
      ]);

      await db.loadSampleData(sample);
      const skewness = await analyzer.computeSkewness('value');

      expect(skewness).toBeLessThan(-1); // Strong negative skew
    });
  });

  describe('computeOutlierRate', () => {
    it('should detect no outliers in normal distribution', async () => {
      // Generate normally distributed data within 3 std devs
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map(() => ({
            value: 50 + (Math.random() - 0.5) * 20, // Mean 50, roughly ±10
          }))
      );

      await db.loadSampleData(sample);
      const outlierRate = await analyzer.computeOutlierRate('value');

      expect(outlierRate).toBeLessThan(0.01); // Should be very low or zero
    });

    it('should detect clear outliers', async () => {
      const normalValues = Array(95)
        .fill(null)
        .map(() => ({
          value: 50 + (Math.random() - 0.5) * 10, // 45-55 range
        }));

      const outliers = [
        { value: 200 }, // Far above
        { value: -100 }, // Far below
        { value: 150 }, // Far above
        { value: -50 }, // Far below
        { value: 300 }, // Far above
      ];

      const sample = createTestTableSample([...normalValues, ...outliers]);

      await db.loadSampleData(sample);
      const outlierRate = await analyzer.computeOutlierRate('value');

      expect(outlierRate).toBeGreaterThan(0.04); // At least 4%
      expect(outlierRate).toBeLessThan(0.06); // But not more than 6%
    });

    it('should handle datasets with no variation', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map(() => ({ value: 50 }))
      );

      await db.loadSampleData(sample);
      const outlierRate = await analyzer.computeOutlierRate('value');

      expect(outlierRate).toBe(0); // No outliers when all values are same
    });
  });

  describe('computeNumericStats', () => {
    it('should compute all numeric statistics', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            value: 10 + i * 0.9, // 10 to 99 with step 0.9
          }))
      );

      await db.loadSampleData(sample);
      const stats = await analyzer.computeNumericStats('value');

      expect(stats.mean).toBeGreaterThan(50);
      expect(stats.median).toBeGreaterThan(50);
      expect(stats.stdDev).toBeGreaterThan(25);
      expect(stats.skewness).toBeCloseTo(0, 1);
      expect(stats.percentiles).toBeDefined();
      expect(stats.percentiles.p25).toBeLessThan(stats.percentiles.p50);
      expect(stats.percentiles.p50).toBeLessThan(stats.percentiles.p75);
      expect(stats.outlierRate).toBeDefined();
    });

    it('should handle column with all nulls gracefully', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({ value: null }))
      );

      await db.loadSampleData(sample);
      const stats = await analyzer.computeNumericStats('value');

      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.stdDev).toBe(0);
      expect(stats.skewness).toBe(0);
      expect(stats.outlierRate).toBe(0);
    });
  });

  describe('batchComputeNumericStats', () => {
    it('should only compute stats for numeric columns', async () => {
      const sample = createTestTableSample([
        { id: 1, name: 'Alice', age: 25, salary: 50000 },
        { id: 2, name: 'Bob', age: 30, salary: 60000 },
        { id: 3, name: 'Charlie', age: 35, salary: 70000 },
        { id: 4, name: 'David', age: 40, salary: 80000 },
        { id: 5, name: 'Eve', age: 45, salary: 90000 },
      ]);

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'age', type: 'INTEGER' },
        { name: 'salary', type: 'DOUBLE' },
      ];

      const stats = await analyzer.batchComputeNumericStats(columnMetadata);

      // Should only have stats for numeric columns
      expect(stats.size).toBe(3); // id, age, salary
      expect(stats.has('id')).toBe(true);
      expect(stats.has('age')).toBe(true);
      expect(stats.has('salary')).toBe(true);
      expect(stats.has('name')).toBe(false);

      // Check age stats
      const ageStats = stats.get('age');
      expect(ageStats?.mean).toBe(35);
      expect(ageStats?.median).toBe(35);
    });

    it('should handle empty column list', async () => {
      const stats = await analyzer.batchComputeNumericStats([]);
      expect(stats.size).toBe(0);
    });

    it('should process multiple numeric columns in parallel', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            metric1: Math.random() * 100,
            metric2: Math.random() * 1000,
            metric3: Math.random() * 10,
            metric4: i,
          }))
      );

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'metric1', type: 'DOUBLE' },
        { name: 'metric2', type: 'DOUBLE' },
        { name: 'metric3', type: 'DOUBLE' },
        { name: 'metric4', type: 'INTEGER' },
      ];

      const stats = await analyzer.batchComputeNumericStats(columnMetadata);

      expect(stats.size).toBe(4);

      // All should have complete stats
      for (const [column, stat] of stats) {
        expect(stat.mean).toBeDefined();
        expect(stat.median).toBeDefined();
        expect(stat.stdDev).toBeDefined();
        expect(stat.percentiles).toBeDefined();
      }
    });
  });
});
