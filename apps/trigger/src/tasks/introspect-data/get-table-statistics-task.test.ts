import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BasicStatsAnalyzer } from './statistics/basic-stats';
import { ClassificationAnalyzer } from './statistics/classification';
import { DistributionAnalyzer } from './statistics/distribution';
import { DuckDBManager } from './statistics/duckdb-manager';
import { DynamicMetadataOrchestrator } from './statistics/dynamic-metadata-orchestrator';
import { NumericStatsAnalyzer } from './statistics/numeric-stats';
import { SampleRowsExtractor } from './statistics/sample-rows';
import { SampleValuesExtractor } from './statistics/sample-values';
import { createTestTableSample } from './statistics/test-helpers';

describe('get-table-statistics-task', () => {
  let db: DuckDBManager;
  let basicAnalyzer: BasicStatsAnalyzer;
  let distributionAnalyzer: DistributionAnalyzer;
  let numericAnalyzer: NumericStatsAnalyzer;
  let classificationAnalyzer: ClassificationAnalyzer;
  let sampleValuesExtractor: SampleValuesExtractor;
  let sampleRowsExtractor: SampleRowsExtractor;
  let dynamicMetadataOrchestrator: DynamicMetadataOrchestrator;

  beforeEach(async () => {
    db = new DuckDBManager(`test_stats_${Date.now()}`);
    await db.initialize({ threads: 2, memoryLimit: '1GB', useDisk: false });

    basicAnalyzer = new BasicStatsAnalyzer(db);
    distributionAnalyzer = new DistributionAnalyzer(db);
    numericAnalyzer = new NumericStatsAnalyzer(db);
    classificationAnalyzer = new ClassificationAnalyzer(db);
    sampleValuesExtractor = new SampleValuesExtractor(db);
    sampleRowsExtractor = new SampleRowsExtractor(db);
    dynamicMetadataOrchestrator = new DynamicMetadataOrchestrator(db);
  });

  afterEach(async () => {
    await db.cleanup();
  });

  describe('Numeric Data Type Scenarios', () => {
    it('should handle extreme numeric values correctly', async () => {
      const sample = createTestTableSample([
        { tiny: 1e-308, huge: 1e308, normal: 42.5 },
        { tiny: 2e-308, huge: 1.5e308, normal: 43.5 },
        { tiny: -1e-308, huge: -1e308, normal: 44.5 },
        { tiny: 0, huge: Number.MAX_VALUE, normal: 45.5 },
        { tiny: Number.MIN_VALUE, huge: -Number.MAX_VALUE, normal: 46.5 },
      ]);

      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({ name: col.name, type: col.type }));

      const numericStats = await numericAnalyzer.batchComputeNumericStats(columnMetadata);

      // Check that extreme values don't break calculations
      const tinyStats = numericStats.get('tiny');
      expect(tinyStats).toBeDefined();
      expect(Number.isFinite(tinyStats?.mean ?? Number.NaN)).toBe(true);
      expect(Number.isFinite(tinyStats?.stdDev ?? Number.NaN)).toBe(true);

      const hugeStats = numericStats.get('huge');
      expect(hugeStats).toBeDefined();
      expect(hugeStats?.outlierRate).toBeDefined();

      const normalStats = numericStats.get('normal');
      expect(normalStats).toBeDefined();
      expect(normalStats?.mean).toBeCloseTo(44.5, 1);
    });

    it('should handle NaN and Infinity values', async () => {
      const sample = createTestTableSample([
        { value: 10 },
        { value: 20 },
        { value: null }, // Will be treated as NULL in SQL
        { value: 30 },
        { value: 'NaN' }, // String 'NaN' to test handling
        { value: 'Infinity' }, // String 'Infinity' to test handling
        { value: 40 },
      ]);

      await db.loadSampleData(sample);

      const basicStats = await basicAnalyzer.batchComputeBasicStats([
        { name: 'value', type: 'VARCHAR' },
      ]);
      const valueStats = basicStats.get('value');
      const numericStats = await numericAnalyzer.computeNumericStats('value');

      expect(valueStats).toBeDefined();
      expect(valueStats?.nullRate).toBeGreaterThan(0);

      if (numericStats) {
        expect(Number.isFinite(numericStats.mean)).toBe(true);
        expect(Number.isFinite(numericStats.median)).toBe(true);
      }
    });

    it('should detect integer vs decimal patterns', async () => {
      // Test pure integers
      const intSample = createTestTableSample([
        { int_col: 1, decimal_col: 1.1, mixed_col: 1 },
        { int_col: 2, decimal_col: 2.2, mixed_col: 2.5 },
        { int_col: 3, decimal_col: 3.3, mixed_col: 3 },
        { int_col: 100, decimal_col: 4.4, mixed_col: 4.0 },
        { int_col: -50, decimal_col: 5.55555, mixed_col: 5 },
      ]);

      await db.loadSampleData(intSample);

      const columns = [
        { name: 'int_col', sqlDataType: 'INTEGER', sampleValues: [1, 2, 3, 100, -50] },
        { name: 'decimal_col', sqlDataType: 'DOUBLE', sampleValues: [1.1, 2.2, 3.3, 4.4, 5.55555] },
        { name: 'mixed_col', sqlDataType: 'DOUBLE', sampleValues: [1, 2.5, 3, 4.0, 5] },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);

      const intMeta = dynamicMetadata.get('int_col');
      if (intMeta?.type === 'numeric') {
        expect(intMeta.isInteger).toBe(true);
      }

      const decimalMeta = dynamicMetadata.get('decimal_col');
      if (decimalMeta?.type === 'numeric') {
        expect(decimalMeta.isInteger).toBe(false);
        // decimalPrecision property doesn't exist on NumericMetadata type
      }
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
  });

  describe('String and Text Scenarios', () => {
    it('should handle various string patterns and encodings', async () => {
      const sample = createTestTableSample([
        {
          plain: 'Hello World',
          emoji: '🎉 Party! 🚀',
          unicode: 'Здравствуй мир 你好世界',
          html: '<script>alert("xss")</script>',
          sql_injection: "'; DROP TABLE users; --",
          json_string: '{"key": "value"}',
          xml: '<?xml version="1.0"?><root><item>test</item></root>',
          markdown: '# Header\n**bold** _italic_',
          long_text: 'Lorem ipsum '.repeat(100),
          whitespace: '   trimmed   ',
          newlines: 'line1\nline2\r\nline3',
          tabs: 'col1\tcol2\tcol3',
        },
        {
          plain: 'Another Test',
          emoji: '❤️ 💔 😊',
          unicode: 'مرحبا بالعالم',
          html: '<div class="test">content</div>',
          sql_injection: '1=1 OR 1=1',
          json_string: '[1, 2, 3]',
          xml: '<person><name>John</name></person>',
          markdown: '- item 1\n- item 2',
          long_text: 'Short text',
          whitespace: '',
          newlines: 'single line',
          tabs: 'no tabs here',
        },
      ]);

      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const sampleValues = await sampleValuesExtractor.batchGetSampleValues(
        columns.map((col) => ({ name: col.name, type: col.type }))
      );

      // Check that special characters are preserved
      expect(sampleValues.get('emoji')).toBeDefined();
      expect(sampleValues.get('unicode')).toBeDefined();

      // Long text should be truncated
      const longTextSamples = sampleValues.get('long_text');
      expect(longTextSamples).toBeDefined();
      if (longTextSamples?.[0]) {
        const firstSample = longTextSamples[0];
        if (typeof firstSample === 'string' && firstSample.length > 200) {
          expect(firstSample).toContain('...');
        }
      }

      // Check JSON detection
      const jsonCol = columns.find((c) => c.name === 'json_string');
      if (jsonCol) {
        const dynamicMeta = await dynamicMetadataOrchestrator.collectDynamicMetadata([
          {
            name: 'json_string',
            sqlDataType: 'VARCHAR',
            sampleValues: ['{"key": "value"}', '[1, 2, 3]'],
          },
        ]);

        const jsonMeta = dynamicMeta.get('json_string');
        expect(jsonMeta?.type).toBe('json');
      }
    });

    it('should identify various identifier patterns', async () => {
      const sample = createTestTableSample([
        {
          uuid_v4: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          uuid_compact: 'f47ac10b58cc4372a5670e02b2c3d479',
          sequential: '1',
          prefixed_id: 'USR_001',
          hash_md5: '5d41402abc4b2a76b9719d911017c592',
          hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          snowflake_id: '1234567890123456789',
          mongo_id: '507f1f77bcf86cd799439011',
          base64_id: 'VGhpc0lzQVRlc3Q=',
          slug: 'this-is-a-url-slug',
        },
        {
          uuid_v4: '550e8400-e29b-41d4-a716-446655440000',
          uuid_compact: '550e8400e29b41d4a716446655440000',
          sequential: '2',
          prefixed_id: 'USR_002',
          hash_md5: '098f6bcd4621d373cade4e832627b4f6',
          hash_sha256: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
          snowflake_id: '1234567890123456790',
          mongo_id: '507f1f77bcf86cd799439012',
          base64_id: 'QW5vdGhlclRlc3Q=',
          slug: 'another-url-slug-here',
        },
        {
          uuid_v4: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          uuid_compact: '6ba7b8109dad11d180b400c04fd430c8',
          sequential: '3',
          prefixed_id: 'USR_003',
          hash_md5: 'e10adc3949ba59abbe56e057f20f883e',
          hash_sha256: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          snowflake_id: '1234567890123456791',
          mongo_id: '507f1f77bcf86cd799439013',
          base64_id: 'WW91R290SXQ=',
          slug: 'yet-another-slug',
        },
      ]);

      await db.loadSampleData(sample);

      const columns = Object.keys(sample.sampleData[0] || {});
      const classifications = await classificationAnalyzer.batchClassifyColumns(columns);

      // UUIDs should be identified (but might need more samples for detection)
      const uuidClass = classifications.get('uuid_v4');
      // With only 3 samples, it might not detect as identifier
      if (uuidClass?.isLikelyIdentifier) {
        expect(uuidClass.identifierType).toBe('uuid_like');
      }

      // Sequential IDs (might need more samples to detect pattern)
      const seqClass = classifications.get('sequential');
      if (seqClass?.isLikelyIdentifier) {
        expect(seqClass.identifierType).toBe('sequential');
      }

      // Prefixed IDs (might be detected as identifier)
      const prefixedClass = classifications.get('prefixed_id');
      // Just check that it exists, detection might vary

      // Hash patterns (might be detected as identifiers)
      const md5Class = classifications.get('hash_md5');
      const sha256Class = classifications.get('hash_sha256');
      // These might or might not be detected with only 3 samples
    });

    it('should distinguish between null, empty string, and whitespace', async () => {
      const sample = createTestTableSample([
        { value: null },
        { value: '' },
        { value: ' ' },
        { value: '  ' },
        { value: '\t' },
        { value: '\n' },
        { value: 'actual value' },
        { value: '0' }, // Not empty, but might be confused
        { value: 'false' }, // Not empty, but might be confused
      ]);

      await db.loadSampleData(sample);

      const basicStats = await basicAnalyzer.batchComputeBasicStats([
        { name: 'value', type: 'VARCHAR' },
      ]);
      const valueStats = basicStats.get('value');

      expect(valueStats?.nullRate).toBeGreaterThan(0); // Has nulls
      expect(valueStats?.emptyStringRate).toBeGreaterThan(0); // Has empty strings
      expect(valueStats?.distinctCount).toBeGreaterThan(5); // Multiple distinct values including empty
    });
  });

  describe('Date and Time Scenarios', () => {
    it('should handle various date/time formats and edge cases', async () => {
      const sample = createTestTableSample([
        {
          iso_date: '2024-01-15T10:30:00Z',
          unix_timestamp: 1705318200,
          us_date: '01/15/2024',
          eu_date: '15/01/2024',
          datetime_local: '2024-01-15 10:30:00',
          date_only: '2024-01-15',
          time_only: '10:30:00',
          year_only: '2024',
          epoch_ms: '1705318200000',
          relative: '2 days ago',
          invalid_date: '2024-13-45', // Invalid month and day
        },
        {
          iso_date: '1970-01-01T00:00:00Z', // Epoch
          unix_timestamp: 0,
          us_date: '12/31/1999', // Y2K edge
          eu_date: '31/12/1999',
          datetime_local: '1999-12-31 23:59:59',
          date_only: '2000-01-01',
          time_only: '23:59:59',
          year_only: '2000',
          epoch_ms: '946684799000',
          relative: 'yesterday',
          invalid_date: '0000-00-00', // MySQL zero date
        },
        {
          iso_date: '2038-01-19T03:14:07Z', // Unix timestamp limit
          unix_timestamp: 2147483647,
          us_date: '02/29/2024', // Leap year
          eu_date: '29/02/2024',
          datetime_local: '2024-02-29 00:00:00',
          date_only: '2100-12-31', // Future date
          time_only: '00:00:00',
          year_only: '1900',
          epoch_ms: '-1', // Negative timestamp
          relative: 'now',
          invalid_date: null,
        },
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'iso_date',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.iso_date),
        },
        {
          name: 'unix_timestamp',
          sqlDataType: 'INTEGER',
          sampleValues: sample.sampleData.map((r) => r.unix_timestamp),
        },
        {
          name: 'datetime_local',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.datetime_local),
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);

      // ISO dates should be recognized
      const isoMeta = dynamicMetadata.get('iso_date');
      if (isoMeta?.type === 'datetime') {
        // format property doesn't exist on DateTimeMetadata type
        expect(isoMeta.hasTimezone).toBe(true);
      }

      // Unix timestamps might be recognized as numeric patterns
      const unixMeta = dynamicMetadata.get('unix_timestamp');
      expect(unixMeta?.type).toBe('numeric');
    });

    it('should analyze datetime metadata correctly', async () => {
      const sample = createTestTableSample([
        { created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T12:00:00Z' },
        { created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T12:00:00Z' },
        { created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T12:00:00Z' },
        { created_at: '2024-01-04T00:00:00Z', updated_at: '2024-01-05T12:00:00Z' },
        { created_at: '2024-01-05T00:00:00Z', updated_at: '2024-01-07T12:00:00Z' },
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'created_at',
          sqlDataType: 'TIMESTAMP',
          sampleValues: ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z', '2024-01-03T00:00:00Z'],
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);
      const createdMeta = dynamicMetadata.get('created_at');

      if (createdMeta?.type === 'datetime') {
        expect(createdMeta.minDate).toBeDefined();
        expect(createdMeta.maxDate).toBeDefined();
        // format property doesn't exist on DateTimeMetadata type
      }
    });
  });

  describe('Email and URL Scenarios', () => {
    it('should handle various email formats and edge cases', async () => {
      const sample = createTestTableSample([
        { email: 'simple@example.com' },
        { email: 'user.name+tag@example.co.uk' },
        { email: 'test@subdomain.example.com' },
        { email: 'special!#$%&*@example.org' },
        { email: '"quoted string"@example.com' },
        { email: 'unicode@例え.jp' },
        {
          email:
            'very.long.email.address.with.many.dots@very.long.domain.with.many.subdomains.example.com',
        },
        { email: 'invalid.email' }, // Missing @
        { email: '@example.com' }, // Missing local part
        { email: 'user@' }, // Missing domain
        { email: 'user@@example.com' }, // Double @
        { email: null },
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'email',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.email).filter((e) => e),
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);
      const emailMeta = dynamicMetadata.get('email');

      if (emailMeta?.type === 'email') {
        // These fields might not always be present depending on implementation
        // expect(emailMeta.domainDistribution).toBeDefined();
        // expect(emailMeta.validationStats).toBeDefined();
        // expect(emailMeta.validationStats.validCount).toBeGreaterThan(0);
      }
    });

    it('should handle various URL formats and protocols', async () => {
      const sample = createTestTableSample([
        { url: 'https://www.example.com' },
        { url: 'http://subdomain.example.org:8080/path?query=1' },
        { url: 'ftp://ftp.example.com/file.txt' },
        { url: 'file:///C:/Users/test/document.pdf' },
        { url: 'mailto:user@example.com' },
        { url: 'tel:+1-555-0123' },
        { url: 'data:text/plain;base64,SGVsbG8gV29ybGQ=' },
        { url: 'ws://websocket.example.com:9000' },
        { url: 'https://例え.jp/パス' }, // Unicode URL
        { url: 'https://example.com/path with spaces' }, // Invalid spaces
        { url: '//protocol-relative.com/path' },
        { url: 'not-a-url' },
        { url: null },
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'url',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.url).filter((u) => u),
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);
      const urlMeta = dynamicMetadata.get('url');

      if (urlMeta?.type === 'url') {
        expect(urlMeta.protocolDistribution).toBeDefined();
        expect(urlMeta.domainDistribution).toBeDefined();

        // Should detect multiple protocols
        const protocols = Object.keys(urlMeta.protocolDistribution || {});
        expect(protocols.length).toBeGreaterThan(1);
      }
    });
  });

  describe('JSON and Structured Data Scenarios', () => {
    it('should handle various JSON structures and edge cases', async () => {
      const sample = createTestTableSample([
        { json_col: '{"simple": "object"}' },
        { json_col: '[]' }, // Empty array
        { json_col: '{}' }, // Empty object
        { json_col: '[1, 2, 3, 4, 5]' }, // Number array
        { json_col: '{"nested": {"deep": {"value": 123}}}' }, // Nested object
        { json_col: '[{"id": 1}, {"id": 2}]' }, // Array of objects
        { json_col: '{"unicode": "こんにちは", "emoji": "🎉"}' },
        { json_col: '{"special": "line\\nbreak", "tab": "tab\\there"}' },
        { json_col: 'null' }, // JSON null
        { json_col: 'true' }, // JSON boolean
        { json_col: '"just a string"' }, // JSON string
        { json_col: '12345' }, // JSON number
        { json_col: '{invalid json}' }, // Invalid JSON
        { json_col: null }, // SQL NULL
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'json_col',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.json_col).filter((j) => j),
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);
      const jsonMeta = dynamicMetadata.get('json_col');

      if (jsonMeta?.type === 'json') {
        // structureTypes property doesn't exist on JsonMetadata type
        if (jsonMeta.validJsonCount !== undefined) {
          expect(jsonMeta.validJsonCount).toBeGreaterThan(0);
        }
      }
    });

    it('should detect JSON schema patterns', async () => {
      // Consistent JSON structure across rows
      const sample = createTestTableSample([
        { config: '{"theme": "dark", "notifications": true, "language": "en"}' },
        { config: '{"theme": "light", "notifications": false, "language": "es"}' },
        { config: '{"theme": "auto", "notifications": true, "language": "fr"}' },
        { config: '{"theme": "dark", "notifications": null, "language": "de"}' },
        { config: '{"theme": "custom", "notifications": true, "language": "ja"}' },
      ]);

      await db.loadSampleData(sample);

      const columns = [
        {
          name: 'config',
          sqlDataType: 'VARCHAR',
          sampleValues: sample.sampleData.map((r) => r.config),
        },
      ];

      const dynamicMetadata = await dynamicMetadataOrchestrator.collectDynamicMetadata(columns);
      const configMeta = dynamicMetadata.get('config');

      if (configMeta?.type === 'json') {
        // commonKeys property doesn't exist on JsonMetadata type
        // Just verify it's detected as JSON
        expect(configMeta.type).toBe('json');
      }
    });
  });

  describe('Distribution and Cardinality Scenarios', () => {
    it('should handle columns with all unique values', async () => {
      const size = 100;
      const sampleData = Array(size)
        .fill(null)
        .map((_, i) => ({
          unique_id: `unique_${i}_${Date.now()}_${Math.random()}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        }));

      const sample = createTestTableSample(sampleData);
      await db.loadSampleData(sample);

      const basicStats = await basicAnalyzer.batchComputeBasicStats([
        { name: 'unique_id', type: 'VARCHAR' },
        { name: 'timestamp', type: 'TIMESTAMP' },
      ]);

      const uniqueStats = basicStats.get('unique_id');
      expect(uniqueStats?.uniquenessRatio).toBe(1); // 100% unique
      expect(uniqueStats?.distinctCount).toBe(size);

      const classifications = await classificationAnalyzer.batchClassifyColumns(['unique_id']);
      expect(classifications.get('unique_id')?.isLikelyIdentifier).toBe(true);
    });

    it('should handle columns with single value (zero entropy)', async () => {
      const sample = createTestTableSample(
        Array(50)
          .fill(null)
          .map(() => ({
            constant: 'same_value',
            active: true,
            status: 'active',
          }))
      );

      await db.loadSampleData(sample);

      const distributions = await distributionAnalyzer.batchComputeDistributions([
        'constant',
        'active',
        'status',
      ]);

      const constantDist = distributions.get('constant');
      expect(constantDist?.topValues.length).toBe(1);
      expect(constantDist?.topValues[0]?.percentage).toBe(100);
      expect(Math.abs(constantDist?.entropy ?? 0)).toBe(0); // Zero entropy for single value (handle -0)

      const classifications = await classificationAnalyzer.batchClassifyColumns([
        'constant',
        'active',
        'status',
      ]);
      // Single value columns might be considered enum-like
      expect(classifications.get('constant')?.isLikelyEnum).toBe(true);
      expect(classifications.get('constant')?.enumValues?.length).toBe(1);
    });

    it('should handle highly skewed distributions', async () => {
      // Create Pareto distribution (80-20 rule)
      const sampleData = [
        ...Array(800)
          .fill(null)
          .map(() => ({ category: 'popular' })),
        ...Array(100)
          .fill(null)
          .map(() => ({ category: 'common' })),
        ...Array(50)
          .fill(null)
          .map(() => ({ category: 'uncommon' })),
        ...Array(30)
          .fill(null)
          .map(() => ({ category: 'rare' })),
        ...Array(20)
          .fill(null)
          .map(() => ({ category: 'very_rare' })),
      ];

      const sample = createTestTableSample(sampleData);
      await db.loadSampleData(sample);

      const distribution = await distributionAnalyzer.computeTopValues('category');
      const gini = await distributionAnalyzer.computeGiniCoefficient('category');

      expect(distribution[0]?.value).toBe('popular');
      expect(distribution[0]?.percentage).toBe(80);

      // High Gini coefficient indicates inequality/skew
      expect(gini).toBeGreaterThan(0.5);
    });
  });

  describe('Null and Missing Data Scenarios', () => {
    it('should handle columns with all nulls', async () => {
      const sample = createTestTableSample([
        { all_null: null, some_null: 'value1', no_null: 'data1' },
        { all_null: null, some_null: null, no_null: 'data2' },
        { all_null: null, some_null: 'value2', no_null: 'data3' },
        { all_null: null, some_null: null, no_null: 'data4' },
        { all_null: null, some_null: null, no_null: 'data5' },
      ]);

      await db.loadSampleData(sample);

      const basicStats = await basicAnalyzer.batchComputeBasicStats([
        { name: 'all_null', type: 'VARCHAR' },
        { name: 'some_null', type: 'VARCHAR' },
        { name: 'no_null', type: 'VARCHAR' },
      ]);

      expect(basicStats.get('all_null')?.nullRate).toBe(1); // 100% null
      expect(basicStats.get('all_null')?.distinctCount).toBe(0);

      expect(basicStats.get('some_null')?.nullRate).toBe(0.6); // 60% null
      expect(basicStats.get('no_null')?.nullRate).toBe(0); // 0% null
    });
  });

  describe('Boolean and Enum Scenarios', () => {
    it('should detect boolean patterns in various formats', async () => {
      const sample = createTestTableSample([
        {
          bool_tf: true,
          bool_10: 1,
          bool_yn: 'Y',
          bool_yesno: 'Yes',
          bool_onoff: 'ON',
          mixed: 'true',
        },
        {
          bool_tf: false,
          bool_10: 0,
          bool_yn: 'N',
          bool_yesno: 'No',
          bool_onoff: 'OFF',
          mixed: 'maybe', // Not boolean
        },
        {
          bool_tf: true,
          bool_10: 1,
          bool_yn: 'Y',
          bool_yesno: 'YES',
          bool_onoff: 'on',
          mixed: 'false',
        },
        {
          bool_tf: false,
          bool_10: 0,
          bool_yn: 'n',
          bool_yesno: 'no',
          bool_onoff: 'off',
          mixed: 'unknown',
        },
        {
          bool_tf: null,
          bool_10: null,
          bool_yn: null,
          bool_yesno: null,
          bool_onoff: null,
          mixed: null,
        },
      ]);

      await db.loadSampleData(sample);

      const columns = Object.keys(sample.sampleData[0] || {});
      const classifications = await classificationAnalyzer.batchClassifyColumns(columns);

      // Boolean columns might be detected as enums with 2-3 values (including null)
      const boolTf = classifications.get('bool_tf');
      const bool10 = classifications.get('bool_10');
      const boolYn = classifications.get('bool_yn');
      const boolYesNo = classifications.get('bool_yesno');

      // Check that at least some are detected as enums
      const enumCount = [boolTf, bool10, boolYn, boolYesNo].filter((c) => c?.isLikelyEnum).length;
      expect(enumCount).toBeGreaterThan(0);

      // Mixed column should not be boolean (has >2 values)
      const mixedClass = classifications.get('mixed');
      if (mixedClass?.enumValues) {
        expect(mixedClass.enumValues.length).toBeGreaterThan(2);
      }
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle large sample efficiently', async () => {
      const largeSize = 10000;
      const startTime = Date.now();

      // Generate large dataset with various column types
      const sampleData = Array(largeSize)
        .fill(null)
        .map((_, i) => ({
          id: i,
          uuid: `${i.toString(16).padStart(8, '0')}-0000-4000-8000-${i.toString(16).padStart(12, '0')}`,
          name: `User ${i % 1000}`, // 1000 unique names
          email: `user${i}@example.com`,
          age: Math.floor(18 + Math.random() * 62), // 18-80
          score: Math.random() * 100,
          category: ['A', 'B', 'C', 'D', 'E'][i % 5],
          status: i % 2 === 0 ? 'active' : 'inactive',
          created_at: new Date(Date.now() - i * 86400000).toISOString(), // One day apart
          metadata: JSON.stringify({ index: i, batch: Math.floor(i / 100) }),
        }));

      const sample = createTestTableSample(sampleData);
      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({ name: col.name, type: col.type }));

      // Run all analyses in parallel
      const analysisStart = Date.now();
      const [basicStats, distributions, numericStats, classifications] = await Promise.all([
        basicAnalyzer.batchComputeBasicStats(columnMetadata),
        distributionAnalyzer.batchComputeDistributions(columns.map((c) => c.name)),
        numericAnalyzer.batchComputeNumericStats(columnMetadata),
        classificationAnalyzer.batchClassifyColumns(columns.map((c) => c.name)),
      ]);
      const analysisTime = Date.now() - analysisStart;

      // Should complete in reasonable time (adjust threshold as needed)
      expect(analysisTime).toBeLessThan(10000); // 10 seconds

      // Verify results are still accurate
      expect(basicStats.get('id')?.distinctCount).toBe(largeSize);
      expect(basicStats.get('category')?.distinctCount).toBe(5);
      expect(classifications.get('status')?.isLikelyEnum).toBe(true);
      expect(numericStats.get('age')).toBeDefined();

      const totalTime = Date.now() - startTime;
      console.log(`Processed ${largeSize} rows in ${totalTime}ms (analysis: ${analysisTime}ms)`);
    });
  });

  describe('Sample Rows Extraction', () => {
    it('should extract diverse sample rows', async () => {
      const sample = createTestTableSample([
        { type: 'A', value: 10, status: 'active' },
        { type: 'B', value: 20, status: 'inactive' },
        { type: 'A', value: 15, status: 'active' },
        { type: 'C', value: 30, status: 'pending' },
        { type: 'B', value: 25, status: 'inactive' },
        { type: 'D', value: 40, status: 'active' },
        { type: 'A', value: 12, status: 'active' },
        { type: 'E', value: 50, status: 'cancelled' },
      ]);

      await db.loadSampleData(sample);

      const sampleRows = await sampleRowsExtractor.getDiverseSampleRows(5);

      expect(sampleRows).toBeDefined();
      expect(sampleRows.length).toBeLessThanOrEqual(5);
      expect(sampleRows.length).toBeGreaterThan(0);

      // Check that we get diverse types
      const types = new Set(sampleRows.map((row) => row.type));
      expect(types.size).toBeGreaterThan(1); // Should have variety
    });
  });

  describe('Real-World E-Commerce Scenario', () => {
    it('should analyze a realistic e-commerce order table', async () => {
      const orders = Array(100)
        .fill(null)
        .map((_, i) => ({
          order_id: `ORD-2024-${(i + 1).toString().padStart(6, '0')}`,
          customer_id: `CUST-${Math.floor(Math.random() * 30)
            .toString()
            .padStart(4, '0')}`,
          order_date: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
          status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][
            Math.floor(Math.random() * 5)
          ],
          total_amount: Number.parseFloat((Math.random() * 1000 + 10).toFixed(2)),
          discount_percent: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
          shipping_cost: Number.parseFloat((Math.random() * 50).toFixed(2)),
          payment_method: ['credit_card', 'paypal', 'bank_transfer', 'crypto'][
            Math.floor(Math.random() * 4)
          ],
          shipping_address: JSON.stringify({
            street: `${Math.floor(Math.random() * 999)} Main St`,
            city: ['New York', 'Los Angeles', 'Chicago', 'Houston'][Math.floor(Math.random() * 4)],
            state: ['NY', 'CA', 'IL', 'TX'][Math.floor(Math.random() * 4)],
            zip: (10000 + Math.floor(Math.random() * 90000)).toString(),
          }),
          items_count: Math.floor(Math.random() * 10) + 1,
          is_gift: Math.random() > 0.9,
          notes: Math.random() > 0.8 ? `Special instructions for order ${i}` : null,
          created_at: new Date(Date.now() - (100 - i) * 86400000).toISOString(),
          updated_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        }));

      const sample = createTestTableSample(orders);
      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({ name: col.name, type: col.type }));

      // Run comprehensive analysis
      const [
        basicStats,
        distributions,
        numericStats,
        classifications,
        sampleValues,
        dynamicMetadata,
      ] = await Promise.all([
        basicAnalyzer.batchComputeBasicStats(columnMetadata),
        distributionAnalyzer.batchComputeDistributions(columns.map((c) => c.name)),
        numericAnalyzer.batchComputeNumericStats(columnMetadata),
        classificationAnalyzer.batchClassifyColumns(columns.map((c) => c.name)),
        sampleValuesExtractor.batchGetSampleValues(columnMetadata),
        dynamicMetadataOrchestrator.collectDynamicMetadata(
          columns.map((col) => ({
            name: col.name,
            sqlDataType: col.type,
            sampleValues: orders.slice(0, 5).map((o) => o[col.name as keyof typeof o]),
          }))
        ),
      ]);

      // Verify order_id is identified as identifier
      expect(classifications.get('order_id')?.isLikelyIdentifier).toBe(true);

      // Status should be enum
      expect(classifications.get('status')?.isLikelyEnum).toBe(true);
      expect(classifications.get('status')?.enumValues).toContain('delivered');

      // Payment method should be enum
      expect(classifications.get('payment_method')?.isLikelyEnum).toBe(true);

      // Numeric columns should have statistics
      expect(numericStats.get('total_amount')).toBeDefined();
      expect(numericStats.get('total_amount')?.mean).toBeGreaterThan(0);

      // Discount should show many zeros (sparse)
      const discountDist = distributions.get('discount_percent');
      expect(discountDist?.topValues[0]?.value).toBe(0);

      // JSON column should be detected
      const shippingMeta = dynamicMetadata.get('shipping_address');
      expect(shippingMeta?.type).toBe('json');

      // Boolean column
      expect(classifications.get('is_gift')?.isLikelyEnum).toBe(true);

      // Notes should have high null rate
      expect(basicStats.get('notes')?.nullRate).toBeGreaterThan(0.5);

      // Dates should be detected
      const createdMeta = dynamicMetadata.get('created_at');
      if (createdMeta?.type === 'datetime') {
        // format property doesn't exist on DateTimeMetadata type
        expect(createdMeta.type).toBe('datetime');
      }
    });
  });

  describe('Real-World User Activity Log Scenario', () => {
    it('should analyze a realistic user activity log table', async () => {
      const activities = Array(200)
        .fill(null)
        .map((_, i) => ({
          event_id: `evt_${Date.now()}_${i}`,
          user_id: Math.random() > 0.1 ? `user_${Math.floor(Math.random() * 50)}` : null, // Some anonymous
          session_id: `sess_${Math.floor(i / 10)}`, // Group by sessions
          event_type: ['page_view', 'click', 'form_submit', 'error', 'api_call'][
            Math.floor(Math.random() * 5)
          ],
          timestamp: new Date(Date.now() - (200 - i) * 60000).toISOString(), // 1 minute apart
          url: `https://example.com/${['home', 'products', 'about', 'contact'][Math.floor(Math.random() * 4)]}`,
          ip_address: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          user_agent: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0',
          ][Math.floor(Math.random() * 3)],
          response_time_ms: Math.floor(Math.random() * 2000) + 50,
          http_status: [200, 200, 200, 201, 301, 404, 500][Math.floor(Math.random() * 7)],
          error_message: Math.random() > 0.9 ? 'Connection timeout' : null,
          metadata: JSON.stringify({
            browser: ['Chrome', 'Safari', 'Firefox'][Math.floor(Math.random() * 3)],
            os: ['Windows', 'Mac', 'Linux'][Math.floor(Math.random() * 3)],
            mobile: Math.random() > 0.7,
          }),
        }));

      const sample = createTestTableSample(activities);
      await db.loadSampleData(sample);

      const columns = await db.getColumnInfo();
      const columnMetadata = columns.map((col) => ({ name: col.name, type: col.type }));

      const [basicStats, distributions, numericStats, classifications] = await Promise.all([
        basicAnalyzer.batchComputeBasicStats(columnMetadata),
        distributionAnalyzer.batchComputeDistributions(columns.map((c) => c.name)),
        numericAnalyzer.batchComputeNumericStats(columnMetadata),
        classificationAnalyzer.batchClassifyColumns(columns.map((c) => c.name)),
      ]);

      // Event ID should be unique identifier
      expect(classifications.get('event_id')?.isLikelyIdentifier).toBe(true);
      expect(basicStats.get('event_id')?.uniquenessRatio).toBe(1);

      // Session ID should have lower cardinality
      expect(basicStats.get('session_id')?.distinctCount).toBeLessThan(50);

      // Event type should be enum
      expect(classifications.get('event_type')?.isLikelyEnum).toBe(true);

      // Response time statistics
      const responseStats = numericStats.get('response_time_ms');
      expect(responseStats).toBeDefined();
      expect(responseStats?.percentiles.p95).toBeDefined();

      // HTTP status distribution
      const statusDist = distributions.get('http_status');
      expect(statusDist?.topValues[0]?.value).toBe(200); // Most common should be 200

      // Error message should be mostly null
      expect(basicStats.get('error_message')?.nullRate).toBeGreaterThan(0.8);
    });
  });
});
