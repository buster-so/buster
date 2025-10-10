import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ClassificationAnalyzer } from './classification';
import { DuckDBManager } from './duckdb-manager';
import { createTestTableSample } from './test-helpers';

describe('ClassificationAnalyzer', () => {
  let db: DuckDBManager;
  let analyzer: ClassificationAnalyzer;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();
    analyzer = new ClassificationAnalyzer(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('classifyColumn - Enum Detection', () => {
    it('should identify column as enum with few distinct values', async () => {
      const sample = createTestTableSample([
        ...Array(30)
          .fill(null)
          .map(() => ({ status: 'active' })),
        ...Array(30)
          .fill(null)
          .map(() => ({ status: 'inactive' })),
        ...Array(30)
          .fill(null)
          .map(() => ({ status: 'pending' })),
        ...Array(10)
          .fill(null)
          .map(() => ({ status: 'archived' })),
      ]);

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('status');

      expect(classification.isLikelyEnum).toBe(true);
      expect(classification.enumValues).toHaveLength(4);
      expect(classification.enumValues).toContain('active');
      expect(classification.enumValues).toContain('inactive');
      expect(classification.enumValues).toContain('pending');
      expect(classification.enumValues).toContain('archived');
    });

    it('should not identify high cardinality column as enum', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            unique_value: `value_${i}`,
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('unique_value');

      expect(classification.isLikelyEnum).toBe(false);
      expect(classification.enumValues).toBeUndefined();
    });

    it('should identify boolean-like columns as enum', async () => {
      const sample = createTestTableSample([
        ...Array(50)
          .fill(null)
          .map(() => ({ flag: true })),
        ...Array(50)
          .fill(null)
          .map(() => ({ flag: false })),
      ]);

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('flag');

      expect(classification.isLikelyEnum).toBe(true);
      expect(classification.enumValues).toHaveLength(2);
    });

    it('should return enum values sorted by frequency', async () => {
      const sample = createTestTableSample([
        ...Array(50)
          .fill(null)
          .map(() => ({ priority: 'high' })),
        ...Array(30)
          .fill(null)
          .map(() => ({ priority: 'medium' })),
        ...Array(15)
          .fill(null)
          .map(() => ({ priority: 'low' })),
        ...Array(5)
          .fill(null)
          .map(() => ({ priority: 'critical' })),
      ]);

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('priority');

      expect(classification.isLikelyEnum).toBe(true);
      // Should be sorted by frequency: high, medium, low, critical
      expect(classification.enumValues?.[0]).toBe('high');
      expect(classification.enumValues?.[1]).toBe('medium');
    });
  });

  describe('classifyColumn - Identifier Detection', () => {
    it('should identify UUID-like patterns', async () => {
      const sample = createTestTableSample(
        Array(50)
          .fill(null)
          .map((_, i) => ({
            id: `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`,
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('id');

      expect(classification.isLikelyIdentifier).toBe(true);
      expect(classification.identifierType).toBe('uuid_like');
    });

    it('should identify sequential numeric IDs', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            id: i + 1,
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('id');

      expect(classification.isLikelyIdentifier).toBe(true);
      expect(classification.identifierType).toBe('sequential');
    });

    it('should identify primary key patterns', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            user_id: `USER_${(i + 1000).toString()}`,
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('user_id');

      expect(classification.isLikelyIdentifier).toBe(true);
      expect(classification.identifierType).toBe('primary_key');
    });

    it('should not identify low cardinality columns as identifiers', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            category_id: (i % 5) + 1, // Only 5 unique values
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('category_id');

      expect(classification.isLikelyIdentifier).toBe(false);
      expect(classification.isLikelyEnum).toBe(true); // Should be enum instead
    });
  });

  describe('batchClassifyColumns', () => {
    it('should classify multiple columns with different patterns', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            id: i + 1,
            status: ['active', 'inactive', 'pending'][i % 3],
            user_code: `USR${(i + 1000).toString()}`,
            score: Math.floor(Math.random() * 100),
            category: `cat_${i % 10}`,
          }))
      );

      await db.loadSampleData(sample);

      const columns = ['id', 'status', 'user_code', 'score', 'category'];
      const classifications = await analyzer.batchClassifyColumns(columns);

      expect(classifications.size).toBe(5);

      // ID should be sequential identifier
      const idClass = classifications.get('id');
      expect(idClass?.isLikelyIdentifier).toBe(true);
      expect(idClass?.identifierType).toBe('sequential');

      // Status should be enum
      const statusClass = classifications.get('status');
      expect(statusClass?.isLikelyEnum).toBe(true);
      expect(statusClass?.enumValues).toHaveLength(3);

      // User code should be primary key
      const userCodeClass = classifications.get('user_code');
      expect(userCodeClass?.isLikelyIdentifier).toBe(true);

      // Category should be enum (10 distinct values)
      const categoryClass = classifications.get('category');
      expect(categoryClass?.isLikelyEnum).toBe(true);
      expect(categoryClass?.enumValues).toHaveLength(10);
    });

    it('should handle empty column list', async () => {
      const classifications = await analyzer.batchClassifyColumns([]);
      expect(classifications.size).toBe(0);
    });

    it('should handle columns with nulls', async () => {
      const sample = createTestTableSample([
        { status: 'active' },
        { status: null },
        { status: 'inactive' },
        { status: null },
        { status: 'active' },
      ]);

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('status');

      expect(classification.isLikelyEnum).toBe(true);
      expect(classification.enumValues).toHaveLength(2); // Only non-null values
      expect(classification.enumValues).toContain('active');
      expect(classification.enumValues).toContain('inactive');
    });

    it('should classify date/time patterns', async () => {
      const sample = createTestTableSample(
        Array(50)
          .fill(null)
          .map((_, i) => ({
            created_at: new Date(2024, 0, i + 1).toISOString(),
            updated_date: new Date(2024, 0, i + 1).toISOString().slice(0, 10),
          }))
      );

      await db.loadSampleData(sample);

      const classifications = await analyzer.batchClassifyColumns(['created_at', 'updated_date']);

      // High cardinality date fields should not be enum or identifier
      const createdAtClass = classifications.get('created_at');
      expect(createdAtClass?.isLikelyEnum).toBe(false);
      expect(createdAtClass?.isLikelyIdentifier).toBe(false);
    });

    it('should handle edge case with single unique value', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map(() => ({
            constant: 'same_value',
          }))
      );

      await db.loadSampleData(sample);
      const classification = await analyzer.classifyColumn('constant');

      // Single value should be classified as enum
      expect(classification.isLikelyEnum).toBe(true);
      expect(classification.enumValues).toHaveLength(1);
      expect(classification.enumValues?.[0]).toBe('same_value');
      expect(classification.isLikelyIdentifier).toBe(false);
    });
  });
});
