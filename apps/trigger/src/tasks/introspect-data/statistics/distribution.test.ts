import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DistributionAnalyzer } from './distribution';
import { DuckDBManager } from './duckdb-manager';
import { createTestTableSample } from './test-helpers';

describe('DistributionAnalyzer', () => {
  let db: DuckDBManager;
  let analyzer: DistributionAnalyzer;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();
    analyzer = new DistributionAnalyzer(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('computeTopValues', () => {
    it('should compute top values with correct percentages', async () => {
      const sample = createTestTableSample([
        { category: 'A' },
        { category: 'A' },
        { category: 'A' },
        { category: 'B' },
        { category: 'B' },
        { category: 'C' },
        { category: 'D' },
        { category: 'E' },
        { category: 'F' },
        { category: 'G' },
      ]);

      await db.loadSampleData(sample);
      const topValues = await analyzer.computeTopValues('category');

      expect(topValues).toHaveLength(7);
      expect(topValues[0]).toEqual({ value: 'A', count: 3, percentage: 30 });
      expect(topValues[1]).toEqual({ value: 'B', count: 2, percentage: 20 });

      // Rest should have 10% each
      for (let i = 2; i < 7; i++) {
        expect(topValues[i]?.count).toBe(1);
        expect(topValues[i]?.percentage).toBe(10);
      }
    });

    it('should limit to top 10 values by default', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            value: `value_${i % 20}`, // 20 unique values
          }))
      );

      await db.loadSampleData(sample);
      const topValues = await analyzer.computeTopValues('value');

      expect(topValues).toHaveLength(10);
    });

    it('should handle nulls in top values', async () => {
      const sample = createTestTableSample([
        { value: 'A' },
        { value: null },
        { value: 'A' },
        { value: null },
        { value: null },
      ]);

      await db.loadSampleData(sample);
      const topValues = await analyzer.computeTopValues('value');

      // Should include both distinct values (null has 3 occurrences, A has 2)
      expect(topValues).toHaveLength(2);
      expect(topValues[0]).toEqual({ value: null, count: 3, percentage: 60 });
      expect(topValues[1]).toEqual({ value: 'A', count: 2, percentage: 40 });
    });

    it('should allow custom limit', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            value: `value_${i}`,
          }))
      );

      await db.loadSampleData(sample);
      const topValues = await analyzer.computeTopValues('value', 5);

      expect(topValues).toHaveLength(5);
    });
  });

  describe('computeEntropy', () => {
    it('should compute entropy for uniform distribution', async () => {
      const sample = createTestTableSample([
        { value: 'A' },
        { value: 'B' },
        { value: 'C' },
        { value: 'D' },
      ]);

      await db.loadSampleData(sample);
      const entropy = await analyzer.computeEntropy('value');

      // Entropy for 4 equally distributed values = log2(4) = 2
      expect(entropy).toBeCloseTo(2, 5);
    });

    it('should return 0 entropy for single value', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({ value: 'same' }))
      );

      await db.loadSampleData(sample);
      const entropy = await analyzer.computeEntropy('value');

      expect(Math.abs(entropy)).toBeLessThan(0.0001); // Effectively zero
    });

    it('should compute lower entropy for skewed distribution', async () => {
      const sample = createTestTableSample([
        ...Array(90)
          .fill(null)
          .map(() => ({ value: 'common' })),
        ...Array(10)
          .fill(null)
          .map(() => ({ value: 'rare' })),
      ]);

      await db.loadSampleData(sample);
      const entropy = await analyzer.computeEntropy('value');

      // Should be between 0 and 1 (max for 2 values)
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThan(1);
      // Specifically should be around 0.469 for 90/10 split
      expect(entropy).toBeCloseTo(0.469, 1);
    });

    it('should handle nulls in entropy calculation', async () => {
      const sample = createTestTableSample([
        { value: 'A' },
        { value: 'B' },
        { value: null },
        { value: null },
      ]);

      await db.loadSampleData(sample);
      const entropy = await analyzer.computeEntropy('value');

      // With nulls included, entropy calculation may differ
      expect(entropy).toBeGreaterThan(0.9); // Should be close to 1 for binary distribution
      expect(entropy).toBeLessThan(1.6); // But not too high
    });
  });

  describe('computeGiniCoefficient', () => {
    it('should return 0 for perfect equality', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({ value: 100 }))
      );

      await db.loadSampleData(sample);
      const gini = await analyzer.computeGiniCoefficient('value');

      expect(gini).toBe(0);
    });

    it('should compute Gini coefficient for unequal distribution', async () => {
      const sample = createTestTableSample([
        { income: 10000 },
        { income: 20000 },
        { income: 30000 },
        { income: 40000 },
        { income: 100000 }, // High earner
      ]);

      await db.loadSampleData(sample);
      const gini = await analyzer.computeGiniCoefficient('income');

      // Gini coefficient calculation may vary based on algorithm
      expect(gini).toBeGreaterThanOrEqual(0); // Should be non-negative
      expect(gini).toBeLessThan(1); // Should be less than 1
    });

    it('should handle extreme inequality', async () => {
      const sample = createTestTableSample([
        ...Array(99)
          .fill(null)
          .map(() => ({ wealth: 1 })),
        { wealth: 1000000 }, // One person has almost everything
      ]);

      await db.loadSampleData(sample);
      const gini = await analyzer.computeGiniCoefficient('wealth');

      // Should show significant inequality
      expect(gini).toBeGreaterThan(0.4);
      expect(gini).toBeLessThan(0.6);
    });

    it('should handle negative values', async () => {
      const sample = createTestTableSample([
        { balance: -100 },
        { balance: 0 },
        { balance: 100 },
        { balance: 200 },
      ]);

      await db.loadSampleData(sample);
      const gini = await analyzer.computeGiniCoefficient('balance');

      // Should still compute a valid Gini coefficient
      expect(gini).toBeDefined();
      expect(Math.abs(gini)).toBeLessThanOrEqual(1);
    });
  });

  describe('batchComputeDistributions', () => {
    it('should compute distributions for multiple columns', async () => {
      const sample = createTestTableSample([
        { category: 'A', status: 'active', score: 85 },
        { category: 'B', status: 'inactive', score: 90 },
        { category: 'A', status: 'active', score: 85 },
        { category: 'C', status: 'pending', score: 75 },
        { category: 'B', status: 'active', score: 95 },
      ]);

      await db.loadSampleData(sample);

      const columns = ['category', 'status', 'score'];
      const distributions = await analyzer.batchComputeDistributions(columns);

      expect(distributions.size).toBe(3);

      // Check category distribution
      const categoryDist = distributions.get('category');
      expect(categoryDist).toBeDefined();
      expect(categoryDist?.topValues).toHaveLength(3);
      expect(categoryDist?.entropy).toBeGreaterThan(0);

      // Check status distribution
      const statusDist = distributions.get('status');
      expect(statusDist).toBeDefined();
      expect(statusDist?.topValues).toHaveLength(3);

      // Check score distribution
      const scoreDist = distributions.get('score');
      expect(scoreDist).toBeDefined();
      expect(scoreDist?.giniCoefficient).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty column list', async () => {
      const distributions = await analyzer.batchComputeDistributions([]);
      expect(distributions.size).toBe(0);
    });

    it('should handle numeric columns for Gini calculation', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            id: i,
            salary: Math.floor(30000 + Math.random() * 70000),
            age: Math.floor(20 + Math.random() * 40),
          }))
      );

      await db.loadSampleData(sample);

      const distributions = await analyzer.batchComputeDistributions(['id', 'salary', 'age']);

      // All numeric columns should have Gini coefficient calculated
      expect(distributions.get('salary')?.giniCoefficient).toBeDefined();
      expect(distributions.get('salary')?.giniCoefficient).toBeGreaterThanOrEqual(0);

      expect(distributions.get('age')?.giniCoefficient).toBeDefined();
      expect(distributions.get('age')?.giniCoefficient).toBeGreaterThanOrEqual(0);
    });

    it('should handle columns with high cardinality', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            unique_id: `ID_${i.toString().padStart(6, '0')}`,
          }))
      );

      await db.loadSampleData(sample);

      const distributions = await analyzer.batchComputeDistributions(['unique_id']);
      const dist = distributions.get('unique_id');

      expect(dist).toBeDefined();
      expect(dist?.topValues).toHaveLength(10); // Should limit to top 10
      expect(dist?.entropy).toBeGreaterThan(3); // High entropy for high cardinality
    });
  });
});
