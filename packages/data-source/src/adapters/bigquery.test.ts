import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BigQueryCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { BigQueryAdapter } from './bigquery';

// Create mock BigQuery instance
let mockBigQueryInstance: any;
let mockBigQueryConstructorArgs: any;

// Mock @google-cloud/bigquery module
vi.mock('@google-cloud/bigquery', () => ({
  BigQuery: class {
    constructor(config: any) {
      mockBigQueryConstructorArgs = config;
      Object.assign(this, mockBigQueryInstance);
    }
  },
}));

describe('BigQueryAdapter', () => {
  let adapter: BigQueryAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBigQueryInstance = {
      dataset: vi.fn().mockReturnValue({
        table: vi.fn().mockReturnValue({
          query: vi.fn(),
        }),
      }),
      getDatasets: vi.fn(),
      createQueryJob: vi.fn(),
    };
    adapter = new BigQueryAdapter();
  });

  describe('initialization', () => {
    it('should initialize with project ID and service account key', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: JSON.stringify({
          type: 'service_account',
          project_id: 'test-project',
          private_key: 'test-key',
          client_email: 'test@test.iam.gserviceaccount.com',
        }),
      };

      await adapter.initialize(credentials);

      const { BigQuery } = await import('@google-cloud/bigquery');
      expect(mockBigQueryConstructorArgs).toEqual({
        projectId: 'test-project',
        credentials: {
          type: 'service_account',
          project_id: 'test-project',
          private_key: 'test-key',
          client_email: 'test@test.iam.gserviceaccount.com',
        },
        location: 'US',
      });
    });

    it('should initialize with project ID and key file path', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        key_file_path: '/path/to/key.json',
      };

      await adapter.initialize(credentials);

      const { BigQuery } = await import('@google-cloud/bigquery');
      expect(mockBigQueryConstructorArgs).toEqual({
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
        location: 'US',
      });
    });

    it('should handle invalid JSON in service account key', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: 'invalid json',
      };

      // BigQuery will treat invalid JSON as a file path, so initialization should succeed
      await expect(adapter.initialize(credentials)).resolves.not.toThrow();
    });

    it('should handle service account key as parsed object', async () => {
      const serviceAccountObject = {
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key123',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        client_email: 'test@test-project.iam.gserviceaccount.com',
      };

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: serviceAccountObject,
      };

      await adapter.initialize(credentials);

      const { BigQuery } = await import('@google-cloud/bigquery');
      expect(mockBigQueryConstructorArgs).toEqual(
        expect.objectContaining({
          projectId: 'test-project',
          credentials: serviceAccountObject,
          location: 'US',
        })
      );
    });

    it('should allow initialization without credentials (uses ADC)', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
      };

      // BigQuery can use Application Default Credentials
      await expect(adapter.initialize(credentials)).resolves.not.toThrow();
    });

    it('should set default dataset when provided', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        default_dataset: 'my-dataset',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);

      const { BigQuery } = await import('@google-cloud/bigquery');
      expect(mockBigQueryConstructorArgs).toEqual(
        expect.objectContaining({
          projectId: 'test-project',
          location: 'US',
        })
      );
    });

    it('should set location when provided', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        location: 'us-central1',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);

      const { BigQuery } = await import('@google-cloud/bigquery');
      expect(mockBigQueryConstructorArgs).toEqual(
        expect.objectContaining({
          projectId: 'test-project',
          location: 'us-central1',
        })
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected bigquery, got postgres'
      );
    });
  });

  describe('query execution', () => {
    const credentials: BigQueryCredentials = {
      type: DataSourceType.BigQuery,
      project_id: 'test-project',
      service_account_key: JSON.stringify({ type: 'service_account' }),
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
    });

    it('should execute simple query without parameters', async () => {
      const mockRows = [{ id: 1, name: 'Test' }];
      const mockMetadata = {
        schema: {
          fields: [
            { name: 'id', type: 'INT64', mode: 'NULLABLE' },
            { name: 'name', type: 'STRING', mode: 'NULLABLE' },
          ],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table');

      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith({
        query: 'SELECT * FROM dataset.table',
        location: undefined,
        jobTimeoutMs: 60000,
        useLegacySql: false,
      });

      expect(result).toEqual({
        rows: mockRows,
        rowCount: 1,
        fields: [
          { name: 'id', type: 'bigint', nullable: true, length: 0, precision: 0 },
          { name: 'name', type: 'text', nullable: true, length: 0, precision: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockRows = [{ id: 1, name: 'Test' }];
      const mockMetadata = {
        schema: {
          fields: [
            { name: 'id', type: 'INT64', mode: 'NULLABLE' },
            { name: 'name', type: 'STRING', mode: 'NULLABLE' },
          ],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table WHERE id = ?', [1]);

      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith({
        query: 'SELECT * FROM dataset.table WHERE id = @param0',
        params: { param0: 1 },
        location: undefined,
        jobTimeoutMs: 60000,
        useLegacySql: false,
      });
      expect(result.rows).toEqual(mockRows);
    });

    it('should handle maxRows limit', async () => {
      const mockRows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const mockMetadata = {
        schema: {
          fields: [{ name: 'id', type: 'INT64', mode: 'NULLABLE' }],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table', [], 10);

      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith(
        expect.objectContaining({
          maxResults: 11, // Requests one extra to check for more rows
        })
      );
      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(false);
    });

    it('should detect when there are more rows', async () => {
      const mockRows = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }));
      const mockMetadata = {
        schema: {
          fields: [{ name: 'id', type: 'INT64', mode: 'NULLABLE' }],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(true);
    });

    it('should use custom timeout when provided', async () => {
      const mockMetadata = { schema: { fields: [] } };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([[], null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      await adapter.query('SELECT 1', [], undefined, 5000);

      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith(
        expect.objectContaining({
          jobTimeoutMs: 5000,
        })
      );
    });

    it('should pass options to createQueryJob', async () => {
      const mockMetadata = { schema: { fields: [] } };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([[], null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      await adapter.query('SELECT 1');

      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith({
        query: 'SELECT 1',
        location: undefined,
        jobTimeoutMs: 60000,
        useLegacySql: false,
      });
    });

    it('should handle query errors', async () => {
      mockBigQueryInstance.createQueryJob.mockRejectedValueOnce(new Error('Query failed'));

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'BigQuery query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new BigQueryAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'bigquery adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      const mockMetadata = {
        schema: {
          fields: [{ name: 'id', type: 'INT64', mode: 'NULLABLE' }],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([[], null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toEqual([
        { name: 'id', type: 'bigint', nullable: true, length: 0, precision: 0 },
      ]);
    });

    it('should handle results without schema metadata', async () => {
      const mockRows = [{ id: 1 }];
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, {}]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT 1 as id');

      expect(result.fields).toEqual([]);
    });

    it('should handle repeated fields', async () => {
      const mockRows = [{ id: 1, tags: ['tag1', 'tag2'] }];
      const mockMetadata = {
        schema: {
          fields: [
            { name: 'id', type: 'INT64', mode: 'NULLABLE' },
            { name: 'tags', type: 'STRING', mode: 'REPEATED' },
          ],
        },
      };
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([mockRows, null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.query('SELECT * FROM dataset.table');

      expect(result.rows).toEqual(mockRows);
    });
  });

  describe('connection management', () => {
    it('should test connection successfully', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);

      const mockMetadata = {};
      const mockJob = {
        getQueryResults: vi.fn().mockResolvedValueOnce([[], null, mockMetadata]),
      };

      mockBigQueryInstance.createQueryJob.mockResolvedValueOnce([mockJob]);

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockBigQueryInstance.createQueryJob).toHaveBeenCalledWith({
        query: 'SELECT 1 as test',
        useLegacySql: false,
      });
    });

    it('should return false when test connection fails', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);

      mockBigQueryInstance.createQueryJob.mockRejectedValueOnce(
        new Error('Connection test failed')
      );

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should handle close (no-op for BigQuery)', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);
      await adapter.close();

      // BigQuery doesn't require explicit closing, just verify it doesn't throw
      await expect(adapter.testConnection()).resolves.toBe(false);
    });
  });

  describe('introspection', () => {
    it('should return introspector', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: JSON.stringify({ type: 'service_account' }),
      };

      await adapter.initialize(credentials);

      const introspector = adapter.introspect();

      // Just verify it returns an introspector with the correct interface
      expect(introspector).toBeDefined();
      expect(introspector.getDatabases).toBeDefined();
      expect(introspector.getSchemas).toBeDefined();
      expect(introspector.getTables).toBeDefined();
      expect(introspector.getColumns).toBeDefined();
    });

    it('should throw error when trying to introspect without connection', () => {
      expect(() => adapter.introspect()).toThrow(
        'bigquery adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.BigQuery);
    });
  });
});
