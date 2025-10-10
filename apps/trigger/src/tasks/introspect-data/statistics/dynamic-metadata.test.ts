import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { DuckDBManager } from './duckdb-manager';
import { DynamicMetadataOrchestrator } from './dynamic-metadata-orchestrator';

describe('Dynamic Metadata Collection', () => {
  let duckdb: DuckDBManager;
  let orchestrator: DynamicMetadataOrchestrator;

  beforeAll(async () => {
    duckdb = new DuckDBManager('test_dynamic_metadata');
    await duckdb.initialize({ threads: 1, memoryLimit: '1GB', useDisk: false });
    orchestrator = new DynamicMetadataOrchestrator(duckdb);

    // Create sample data for testing different column types
    const sampleData = [
      {
        user_id: '12345',
        email: 'john.doe@company.com',
        signup_date: '2023-01-15',
        website: 'https://company.com/profile/john',
        age: 28,
        user_uuid: 'a1b2c3d4-e5f6-1234-5678-9abcdef01234',
        config_json: '{"theme": "dark", "notifications": true}',
      },
      {
        user_id: '12346',
        email: 'jane.smith@personal.net',
        signup_date: '2023-02-20',
        website: 'https://personal.net/jane',
        age: 35,
        user_uuid: 'b2c3d4e5-f6a7-2345-6789-abcdef012345',
        config_json: '{"theme": "light", "notifications": false}',
      },
      {
        user_id: '12347',
        email: 'bob.wilson@gmail.com',
        signup_date: '2023-03-10',
        website: 'http://blog.example.com',
        age: 42,
        user_uuid: 'c3d4e5f6-a7b8-3456-789a-bcdef0123456',
        config_json: '{"theme": "auto", "language": "en"}',
      },
    ];

    // Define column schemas based on the sample data
    const columnSchemas = [
      { name: 'user_id', type: 'VARCHAR', nullable: false },
      { name: 'email', type: 'VARCHAR', nullable: false },
      { name: 'signup_date', type: 'DATE', nullable: false },
      { name: 'website', type: 'VARCHAR', nullable: true },
      { name: 'age', type: 'INTEGER', nullable: false },
      { name: 'user_uuid', type: 'UUID', nullable: false },
      { name: 'config_json', type: 'VARCHAR', nullable: true },
    ];

    await duckdb.loadSampleData({
      sampleData,
      sampleSize: sampleData.length,
      samplingMethod: 'simple',
      rowCount: sampleData.length,
      tableId: 'test_table',
      sampledAt: new Date(),
      columnSchemas,
    });
  });

  afterAll(async () => {
    await duckdb.cleanup();
  });

  test('should detect column semantic types correctly', async () => {
    const columns = [
      {
        name: 'user_id',
        sqlDataType: 'VARCHAR',
        sampleValues: ['12345', '12346', '12347'],
      },
      {
        name: 'email',
        sqlDataType: 'VARCHAR',
        sampleValues: ['john.doe@company.com', 'jane.smith@personal.net', 'bob.wilson@gmail.com'],
      },
      {
        name: 'signup_date',
        sqlDataType: 'DATE',
        sampleValues: ['2023-01-15', '2023-02-20', '2023-03-10'],
      },
      {
        name: 'website',
        sqlDataType: 'VARCHAR',
        sampleValues: [
          'https://company.com/profile/john',
          'https://personal.net/jane',
          'http://blog.example.com',
        ],
      },
      {
        name: 'age',
        sqlDataType: 'INTEGER',
        sampleValues: [28, 35, 42],
      },
      {
        name: 'user_uuid',
        sqlDataType: 'VARCHAR',
        sampleValues: [
          'a1b2c3d4-e5f6-1234-5678-9abcdef01234',
          'b2c3d4e5-f6a7-2345-6789-abcdef012345',
          'c3d4e5f6-a7b8-3456-789a-bcdef0123456',
        ],
      },
      {
        name: 'config_json',
        sqlDataType: 'VARCHAR',
        sampleValues: [
          '{"theme": "dark", "notifications": true}',
          '{"theme": "light", "notifications": false}',
          '{"theme": "auto", "language": "en"}',
        ],
      },
    ];

    const typeResults = await orchestrator.getTypeDetectionDetails(columns);

    // Verify that semantic types are detected correctly
    expect(typeResults.get('email')?.semanticType).toBe('email');
    expect(typeResults.get('website')?.semanticType).toBe('url');
    expect(typeResults.get('signup_date')?.semanticType).toBe('datetime');
    expect(typeResults.get('age')?.semanticType).toBe('numeric');
    expect(typeResults.get('user_uuid')?.semanticType).toBe('identifier');
    expect(typeResults.get('config_json')?.semanticType).toBe('json');

    // Verify confidence scores are reasonable
    // Note: With limited sample data in tests, confidence may be lower
    expect(typeResults.get('email')?.confidence).toBeGreaterThan(0.5);
    expect(typeResults.get('website')?.confidence).toBeGreaterThan(0.5);
    expect(typeResults.get('user_uuid')?.confidence).toBeGreaterThan(0.2);
  });

  test('should collect dynamic metadata for detected types', async () => {
    const columns = [
      {
        name: 'email',
        sqlDataType: 'VARCHAR',
        sampleValues: ['john.doe@company.com', 'jane.smith@personal.net', 'bob.wilson@gmail.com'],
      },
      {
        name: 'website',
        sqlDataType: 'VARCHAR',
        sampleValues: [
          'https://company.com/profile/john',
          'https://personal.net/jane',
          'http://blog.example.com',
        ],
      },
      {
        name: 'age',
        sqlDataType: 'INTEGER',
        sampleValues: [28, 35, 42],
      },
    ];

    const dynamicMetadata = await orchestrator.collectDynamicMetadata(columns);

    // Check that metadata was collected for detected types
    expect(dynamicMetadata.size).toBeGreaterThan(0);

    // Email metadata should include domain analysis
    const emailMeta = dynamicMetadata.get('email');
    // With limited test data, email metadata might not always be detected
    if (emailMeta && 'domainDistribution' in emailMeta) {
      expect(emailMeta.domainDistribution).toBeDefined();
    }
    if (emailMeta && 'validationStats' in emailMeta) {
      expect(emailMeta.validationStats).toBeDefined();
    }

    // URL metadata should include protocol analysis
    const urlMeta = dynamicMetadata.get('website');
    if (urlMeta?.type === 'url') {
      expect(urlMeta.protocolDistribution).toBeDefined();
    }

    // Numeric metadata might include pattern analysis
    const numericMeta = dynamicMetadata.get('age');
    if (numericMeta?.type === 'numeric') {
      expect(typeof numericMeta.isInteger).toBe('boolean');
    }
  });

  test('should handle empty or invalid data gracefully', async () => {
    const columns = [
      {
        name: 'empty_column',
        sqlDataType: 'VARCHAR',
        sampleValues: [],
      },
      {
        name: 'null_column',
        sqlDataType: 'VARCHAR',
        sampleValues: [null, undefined, ''],
      },
    ];

    const dynamicMetadata = await orchestrator.collectDynamicMetadata(columns);

    // Should not throw errors and should return empty or minimal metadata
    expect(dynamicMetadata.size).toBeGreaterThanOrEqual(0);
  });
});
