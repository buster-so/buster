import type { TableSample } from '@buster/data-source';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BasicStatsAnalyzer } from './basic-stats';
import { ClassificationAnalyzer } from './classification';
import { DistributionAnalyzer } from './distribution';
import { DuckDBManager } from './duckdb-manager';
import { NumericStatsAnalyzer } from './numeric-stats';
import { SampleValuesExtractor } from './sample-values';
import { createTestTableSample } from './test-helpers';

describe('Statistical Analysis Integration', () => {
  let db: DuckDBManager;
  let basicAnalyzer: BasicStatsAnalyzer;
  let distributionAnalyzer: DistributionAnalyzer;
  let numericAnalyzer: NumericStatsAnalyzer;
  let classificationAnalyzer: ClassificationAnalyzer;
  let sampleValuesExtractor: SampleValuesExtractor;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();

    basicAnalyzer = new BasicStatsAnalyzer(db);
    distributionAnalyzer = new DistributionAnalyzer(db);
    numericAnalyzer = new NumericStatsAnalyzer(db);
    classificationAnalyzer = new ClassificationAnalyzer(db);
    sampleValuesExtractor = new SampleValuesExtractor(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('End-to-end statistical analysis', () => {
    it('should analyze a realistic e-commerce dataset', async () => {
      // Create a realistic e-commerce sample dataset
      const sample = createTestTableSample([
        {
          customer_id: 'CUST001',
          order_date: '2024-01-01',
          amount: 99.99,
          status: 'completed',
          category: 'Electronics',
        },
        {
          customer_id: 'CUST002',
          order_date: '2024-01-02',
          amount: 149.99,
          status: 'completed',
          category: 'Clothing',
        },
        {
          customer_id: 'CUST003',
          order_date: '2024-01-03',
          amount: 49.99,
          status: 'pending',
          category: 'Books',
        },
        {
          customer_id: 'CUST001',
          order_date: '2024-01-04',
          amount: 199.99,
          status: 'completed',
          category: 'Electronics',
        },
        {
          customer_id: 'CUST004',
          order_date: '2024-01-05',
          amount: 79.99,
          status: 'cancelled',
          category: 'Clothing',
        },
        {
          customer_id: 'CUST002',
          order_date: '2024-01-06',
          amount: 299.99,
          status: 'completed',
          category: 'Electronics',
        },
        {
          customer_id: 'CUST005',
          order_date: '2024-01-07',
          amount: null,
          status: 'pending',
          category: 'Books',
        },
        {
          customer_id: 'CUST003',
          order_date: '2024-01-08',
          amount: 129.99,
          status: 'completed',
          category: 'Clothing',
        },
        {
          customer_id: null,
          order_date: '2024-01-09',
          amount: 89.99,
          status: 'completed',
          category: null,
        },
        {
          customer_id: 'CUST006',
          order_date: '2024-01-10',
          amount: 159.99,
          status: 'completed',
          category: 'Electronics',
        },
      ]);

      await db.loadSampleData(sample);

      // Get column metadata
      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({
        name: col.name,
        type: col.type,
      }));

      // Run all analyses
      const [basicStats, distributions, numericStats, classifications, sampleValues] =
        await Promise.all([
          basicAnalyzer.batchComputeBasicStats(columnMetadata),
          distributionAnalyzer.batchComputeDistributions(columns.map((c) => c.name)),
          numericAnalyzer.batchComputeNumericStats(columnMetadata),
          classificationAnalyzer.batchClassifyColumns(columns.map((c) => c.name)),
          sampleValuesExtractor.batchGetSampleValues(columnMetadata),
        ]);

      // Verify customer_id statistics
      const customerStats = basicStats.get('customer_id');
      expect(customerStats).toBeDefined();
      expect(customerStats?.nullRate).toBe(0.1); // 1 null out of 10
      expect(customerStats?.distinctCount).toBe(6); // 6 unique customers

      // Verify amount statistics (numeric column)
      const amountStats = basicStats.get('amount');
      expect(amountStats).toBeDefined();
      expect(amountStats?.nullRate).toBe(0.1); // 1 null out of 10

      const amountNumeric = numericStats.get('amount');
      expect(amountNumeric).toBeDefined();
      expect(amountNumeric?.mean).toBeGreaterThan(100);
      expect(amountNumeric?.median).toBeGreaterThan(0);

      // Verify status classification (should be identified as enum)
      const statusClassification = classifications.get('status');
      expect(statusClassification).toBeDefined();
      expect(statusClassification?.isLikelyEnum).toBe(true);
      expect(statusClassification?.enumValues).toContain('completed');
      expect(statusClassification?.enumValues).toContain('pending');
      expect(statusClassification?.enumValues).toContain('cancelled');

      // Verify category distribution
      const categoryDist = distributions.get('category');
      expect(categoryDist).toBeDefined();
      expect(categoryDist?.topValues.length).toBeGreaterThan(0);
      expect(categoryDist?.topValues[0]?.value).toBeTruthy();

      // Verify sample values were extracted
      const customerSamples = sampleValues.get('customer_id');
      expect(customerSamples).toBeDefined();
      expect(customerSamples?.length).toBeGreaterThan(0);
    });

    it('should handle columns with high cardinality', async () => {
      // Create dataset with unique IDs (high cardinality)
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            unique_id: `ID_${i.toString().padStart(6, '0')}`,
            sequential_id: i,
            random_value: Math.random() * 1000,
          }))
      );

      await db.loadSampleData(sample);

      const columns = ['unique_id', 'sequential_id', 'random_value'];
      const classifications = await classificationAnalyzer.batchClassifyColumns(columns);

      // unique_id should be identified as an identifier
      const uniqueIdClass = classifications.get('unique_id');
      expect(uniqueIdClass?.isLikelyIdentifier).toBe(true);
      expect(uniqueIdClass?.identifierType).toBe('uuid_like');

      // sequential_id should be identified as sequential
      const seqIdClass = classifications.get('sequential_id');
      expect(seqIdClass?.isLikelyIdentifier).toBe(true);
      expect(seqIdClass?.identifierType).toBe('sequential');
    });

    it('should handle columns with low cardinality (enums)', async () => {
      const sample = createTestTableSample(
        Array(50)
          .fill(null)
          .map((_, i) => ({
            color: ['red', 'blue', 'green'][i % 3],
            size: ['S', 'M', 'L', 'XL'][i % 4],
            active: i % 2 === 0,
          }))
      );

      await db.loadSampleData(sample);

      const columns = ['color', 'size', 'active'];
      const classifications = await classificationAnalyzer.batchClassifyColumns(columns);

      // All should be identified as enums
      expect(classifications.get('color')?.isLikelyEnum).toBe(true);
      expect(classifications.get('size')?.isLikelyEnum).toBe(true);
      expect(classifications.get('active')?.isLikelyEnum).toBe(true);

      // Check enum values
      expect(classifications.get('color')?.enumValues).toEqual(
        expect.arrayContaining(['red', 'blue', 'green'])
      );
    });

    it('should compute accurate distribution metrics', async () => {
      // Create skewed distribution
      const sample = createTestTableSample([
        ...Array(80)
          .fill(null)
          .map(() => ({ value: 'common' })),
        ...Array(15)
          .fill(null)
          .map(() => ({ value: 'uncommon' })),
        ...Array(5)
          .fill(null)
          .map(() => ({ value: 'rare' })),
      ]);

      await db.loadSampleData(sample);

      const distribution = await distributionAnalyzer.computeTopValues('value');

      // Check top values are ordered by frequency
      expect(distribution[0]?.value).toBe('common');
      expect(distribution[0]?.percentage).toBeCloseTo(80, 0);

      expect(distribution[1]?.value).toBe('uncommon');
      expect(distribution[1]?.percentage).toBeCloseTo(15, 0);

      expect(distribution[2]?.value).toBe('rare');
      expect(distribution[2]?.percentage).toBeCloseTo(5, 0);

      // Check entropy (should be relatively low due to skew)
      const entropy = await distributionAnalyzer.computeEntropy('value');
      expect(entropy).toBeGreaterThan(0);
      expect(entropy).toBeLessThan(2); // Max entropy for 3 values would be ~1.58
    });

    it('should detect outliers in numeric data', async () => {
      // Create dataset with outliers
      const normalValues = Array(95)
        .fill(null)
        .map(() => ({ measurement: 50 + Math.random() * 20 })); // 50-70 range
      const outliers = [150, 200, -50, -100, 300].map((v) => ({ measurement: v })); // Clear outliers

      const sample = createTestTableSample([...normalValues, ...outliers]);

      await db.loadSampleData(sample);

      const outlierRate = await numericAnalyzer.computeOutlierRate('measurement');

      // Should detect approximately 5% outliers
      expect(outlierRate).toBeGreaterThan(0.03);
      expect(outlierRate).toBeLessThan(0.1);
    });

    it('should handle mixed data types correctly', async () => {
      const sample = createTestTableSample([
        {
          id: 1,
          name: 'Alice',
          email: 'alice@example.com',
          age: 30,
          score: 85.5,
          is_active: true,
          metadata: { key: 'value' },
          tags: ['tag1', 'tag2'],
          created_at: '2024-01-01T10:00:00Z',
          description: `A very long description that contains a lot of text to test long text detection...${'x'.repeat(100)}`,
        },
        {
          id: 2,
          name: 'Bob',
          email: null,
          age: 25,
          score: 92.3,
          is_active: false,
          metadata: null,
          tags: null,
          created_at: '2024-01-02T11:00:00Z',
          description: 'Short description',
        },
      ]);

      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({
        name: col.name,
        type: col.type,
      }));

      // Test sample value extraction handles different types
      const samples = await sampleValuesExtractor.batchGetSampleValues(columnMetadata);

      // Regular values
      expect(samples.get('id')).toBeDefined();
      expect(samples.get('name')).toBeDefined();

      // Long text should be truncated
      const descSamples = samples.get('description');
      expect(descSamples).toBeDefined();
      if (descSamples?.[0] && typeof descSamples[0] === 'string') {
        const longSample = descSamples.find((s) => typeof s === 'string' && s.length > 100);
        if (longSample) {
          expect(longSample).toContain('...');
        }
      }
    });

    it('should handle empty strings vs nulls correctly', async () => {
      const sample = createTestTableSample([
        { value: 'normal' },
        { value: '' },
        { value: null },
        { value: 'another' },
        { value: '' },
      ]);

      await db.loadSampleData(sample);

      const columnMetadata = [{ name: 'value', type: 'VARCHAR' }];
      const stats = await basicAnalyzer.batchComputeBasicStats(columnMetadata);

      const valueStats = stats.get('value');
      expect(valueStats?.nullRate).toBe(0.2); // 1 null out of 5
      expect(valueStats?.emptyStringRate).toBe(0.4); // 2 empty strings out of 5
      expect(valueStats?.distinctCount).toBe(3); // 'normal', '', 'another'
    });
  });
});
