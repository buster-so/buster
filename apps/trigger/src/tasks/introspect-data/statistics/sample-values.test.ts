import type { TableSample } from '@buster/data-source';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuckDBManager } from './duckdb-manager';
import { SampleValuesExtractor } from './sample-values';
import { createTestTableSample } from './test-helpers';

describe('SampleValuesExtractor', () => {
  let db: DuckDBManager;
  let extractor: SampleValuesExtractor;

  beforeEach(async () => {
    db = new DuckDBManager();
    await db.initialize();
    extractor = new SampleValuesExtractor(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('isLongTextColumn', () => {
    it('should identify long text columns', async () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10);
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({
            description: longText,
            short: 'Short text',
          }))
      );

      await db.loadSampleData(sample);

      const isLongDesc = await (extractor as any).isLongTextColumn('description', 'VARCHAR');
      const isLongShort = await (extractor as any).isLongTextColumn('short', 'VARCHAR');

      expect(isLongDesc).toBe(true);
      expect(isLongShort).toBe(false);
    });

    it('should return false for non-text columns', async () => {
      const sample = createTestTableSample([{ id: 1, value: 100 }]);

      await db.loadSampleData(sample);

      const isLong = await (extractor as any).isLongTextColumn('value', 'INTEGER');
      expect(isLong).toBe(false);
    });
  });

  describe('isJsonColumn', () => {
    it('should identify JSON columns by type', async () => {
      const sample = createTestTableSample([{ data: { key: 'value' } }]);

      await db.loadSampleData(sample);

      const isJson = await (extractor as any).isJsonColumn('data', 'JSON');
      expect(isJson).toBe(true);
    });

    it('should identify JSON-like string content', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            json_string: JSON.stringify({ id: i, name: `item_${i}` }),
            normal_string: `regular text ${i}`,
          }))
      );

      await db.loadSampleData(sample);

      const isJsonString = await (extractor as any).isJsonColumn('json_string', 'VARCHAR');
      const isNormalString = await (extractor as any).isJsonColumn('normal_string', 'VARCHAR');

      expect(isJsonString).toBe(true);
      expect(isNormalString).toBe(false);
    });

    it('should identify array JSON patterns', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            array_data: JSON.stringify([1, 2, 3, i]),
          }))
      );

      await db.loadSampleData(sample);

      const isJson = await (extractor as any).isJsonColumn('array_data', 'VARCHAR');
      expect(isJson).toBe(true);
    });
  });

  describe('getStandardSampleValues', () => {
    it('should return distinct sample values', async () => {
      const sample = createTestTableSample([
        { color: 'red' },
        { color: 'blue' },
        { color: 'red' },
        { color: 'green' },
        { color: 'blue' },
        { color: 'yellow' },
      ]);

      await db.loadSampleData(sample);
      const samples = await extractor.getStandardSampleValues('color');

      expect(samples).toHaveLength(4); // 4 distinct values
      expect(samples).toContain('red');
      expect(samples).toContain('blue');
      expect(samples).toContain('green');
      expect(samples).toContain('yellow');
    });

    it('should respect limit parameter', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            value: `value_${i}`,
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getStandardSampleValues('value', 10);

      expect(samples).toHaveLength(10);
    });

    it('should exclude null values', async () => {
      const sample = createTestTableSample([
        { value: 'a' },
        { value: null },
        { value: 'b' },
        { value: null },
        { value: 'c' },
      ]);

      await db.loadSampleData(sample);
      const samples = await extractor.getStandardSampleValues('value');

      expect(samples).toHaveLength(3);
      expect(samples).not.toContain(null);
    });
  });

  describe('getLongTextSampleValues', () => {
    it('should truncate long text values', async () => {
      const longText = 'A'.repeat(200);
      const sample = createTestTableSample([
        { description: longText },
        { description: 'Short text' },
      ]);

      await db.loadSampleData(sample);
      const samples = await extractor.getLongTextSampleValues('description', 2, 150);

      const truncated = samples.find((s) => s.includes('...'));
      const short = samples.find((s) => s === 'Short text');

      expect(truncated).toBeDefined();
      expect(truncated?.length).toBeLessThanOrEqual(150);
      expect(truncated).toContain('...');
      expect(short).toBe('Short text');
    });

    it('should return fewer samples for long text', async () => {
      const longText = 'Lorem ipsum '.repeat(50);
      const sample = createTestTableSample(
        Array(20)
          .fill(null)
          .map((_, i) => ({
            content: longText + i,
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getLongTextSampleValues('content', 5);

      expect(samples).toHaveLength(5); // Limited to 5 samples
    });
  });

  describe('getJsonSampleValues', () => {
    it('should return parsed JSON objects', async () => {
      const sample = createTestTableSample([
        { data: JSON.stringify({ id: 1, name: 'Alice' }) },
        { data: JSON.stringify({ id: 2, name: 'Bob' }) },
      ]);

      await db.loadSampleData(sample);
      const samples = await extractor.getJsonSampleValues('data');

      expect(samples).toHaveLength(2);
      expect(samples[0]).toEqual({ id: 1, name: 'Alice' });
      expect(samples[1]).toEqual({ id: 2, name: 'Bob' });
    });

    it('should handle invalid JSON gracefully', async () => {
      const sample = createTestTableSample([{ data: 'not json' }, { data: '{"valid": "json"}' }]);

      await db.loadSampleData(sample);
      const samples = await extractor.getJsonSampleValues('data');

      // Should return raw values when parsing fails
      expect(samples).toBeDefined();
      expect(
        samples.find(
          (s) =>
            typeof s === 'object' &&
            s !== null &&
            'valid' in s &&
            (s as Record<string, unknown>).valid === 'json'
        )
      ).toBeDefined();
    });

    it('should limit JSON samples to 3 by default', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            json: JSON.stringify({ index: i }),
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getJsonSampleValues('json');

      expect(samples).toHaveLength(3);
    });
  });

  describe('getSampleValues', () => {
    it('should detect and handle JSON columns', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            config: JSON.stringify({ setting: `value_${i}` }),
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getSampleValues('config', 'VARCHAR');

      // Should return limited JSON samples (3 by default)
      expect(samples).toHaveLength(3);
      expect(samples[0]).toHaveProperty('setting');
    });

    it('should detect and handle long text', async () => {
      const longText = 'This is a very long description. '.repeat(20);
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map(() => ({
            description: longText,
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getSampleValues('description', 'TEXT');

      // Should return truncated samples (10 by default for long text)
      expect(samples.length).toBeLessThanOrEqual(10);
      expect(samples[0]).toContain('...');
    });

    it('should handle standard columns', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            category: `cat_${i % 3}`,
          }))
      );

      await db.loadSampleData(sample);
      const samples = await extractor.getSampleValues('category', 'VARCHAR');

      // Should return distinct values
      expect(samples).toContain('cat_0');
      expect(samples).toContain('cat_1');
      expect(samples).toContain('cat_2');
    });
  });

  describe('batchGetSampleValues', () => {
    it('should extract samples for multiple columns', async () => {
      const sample = createTestTableSample(
        Array(10)
          .fill(null)
          .map((_, i) => ({
            id: i,
            name: `User ${i}`,
            metadata: JSON.stringify({ index: i }),
            description: 'Lorem ipsum '.repeat(50),
          }))
      );

      await db.loadSampleData(sample);

      const columnMetadata = [
        { name: 'id', type: 'INTEGER' },
        { name: 'name', type: 'VARCHAR' },
        { name: 'metadata', type: 'VARCHAR' },
        { name: 'description', type: 'TEXT' },
      ];

      const samples = await extractor.batchGetSampleValues(columnMetadata);

      expect(samples.size).toBe(4);

      // ID samples
      const idSamples = samples.get('id');
      expect(idSamples).toBeDefined();
      expect(idSamples?.length).toBeGreaterThan(0);

      // Name samples
      const nameSamples = samples.get('name');
      expect(nameSamples).toBeDefined();
      expect(nameSamples?.[0]).toContain('User');

      // Metadata should be parsed as JSON
      const metadataSamples = samples.get('metadata');
      expect(metadataSamples).toBeDefined();
      expect(metadataSamples?.length).toBeLessThanOrEqual(3); // JSON limited to 3

      // Description should be truncated
      const descSamples = samples.get('description');
      expect(descSamples).toBeDefined();
      expect(descSamples?.[0]).toContain('...');
    });

    it('should handle empty column list', async () => {
      const samples = await extractor.batchGetSampleValues([]);
      expect(samples.size).toBe(0);
    });

    it('should handle columns with all nulls', async () => {
      const sample = createTestTableSample(
        Array(5)
          .fill(null)
          .map(() => ({
            empty_col: null,
          }))
      );

      await db.loadSampleData(sample);

      const columnMetadata = [{ name: 'empty_col', type: 'VARCHAR' }];
      const samples = await extractor.batchGetSampleValues(columnMetadata);

      const emptySamples = samples.get('empty_col');
      expect(emptySamples).toBeDefined();
      expect(emptySamples).toHaveLength(0);
    });

    it('should process columns in parallel', async () => {
      const sample = createTestTableSample(
        Array(100)
          .fill(null)
          .map((_, i) => ({
            col1: `value1_${i}`,
            col2: `value2_${i}`,
            col3: `value3_${i}`,
            col4: `value4_${i}`,
            col5: `value5_${i}`,
          }))
      );

      await db.loadSampleData(sample);

      const columnMetadata = Array(5)
        .fill(null)
        .map((_, i) => ({
          name: `col${i + 1}`,
          type: 'VARCHAR',
        }));

      const samples = await extractor.batchGetSampleValues(columnMetadata);

      expect(samples.size).toBe(5);
      for (let i = 1; i <= 5; i++) {
        const colSamples = samples.get(`col${i}`);
        expect(colSamples).toBeDefined();
        expect(colSamples?.length).toBeGreaterThan(0);
      }
    });
  });
});
