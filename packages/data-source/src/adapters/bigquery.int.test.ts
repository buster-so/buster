import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BigQueryCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { BigQueryAdapter } from './bigquery';

// Check if BigQuery test credentials are available
const hasBigQueryCredentials = !!(
  process.env.TEST_BIGQUERY_DATABASE &&
  process.env.TEST_BIGQUERY_USERNAME &&
  process.env.TEST_BIGQUERY_PASSWORD
);

// Skip tests if credentials are not available
const testIt = hasBigQueryCredentials ? it : it.skip;

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

describe('BigQueryAdapter Integration', () => {
  let adapter: BigQueryAdapter;

  beforeEach(() => {
    adapter = new BigQueryAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testIt(
    'should connect to BigQuery database',
    async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: process.env.TEST_BIGQUERY_PROJECT_ID!,
        service_account_key: process.env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
        key_file_path: process.env.TEST_BIGQUERY_KEY_FILE_PATH,
        default_dataset: process.env.TEST_BIGQUERY_DATASET,
        location: process.env.TEST_BIGQUERY_LOCATION || 'US',
      };

      await adapter.initialize(credentials);
      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(true);
    },
    TEST_TIMEOUT
  );

  testIt(
    'should execute simple SELECT query',
    async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: process.env.TEST_BIGQUERY_PROJECT_ID!,
        service_account_key: process.env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
        key_file_path: process.env.TEST_BIGQUERY_KEY_FILE_PATH,
        default_dataset: process.env.TEST_BIGQUERY_DATASET,
        location: process.env.TEST_BIGQUERY_LOCATION || 'US',
      };

      await adapter.initialize(credentials);
      const result = await adapter.query("SELECT 1 as test_column, 'hello' as text_column");

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ test_column: 1, text_column: 'hello' });
      expect(result.rowCount).toBe(1);
      expect(result.fields).toHaveLength(2);
    },
    TEST_TIMEOUT
  );

  testIt(
    'should execute parameterized query',
    async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: process.env.TEST_BIGQUERY_PROJECT_ID!,
        service_account_key: process.env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
        key_file_path: process.env.TEST_BIGQUERY_KEY_FILE_PATH,
        default_dataset: process.env.TEST_BIGQUERY_DATASET,
        location: process.env.TEST_BIGQUERY_LOCATION || 'US',
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT ? as param_value, ? as second_param', [
        42,
        'test',
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ param_value: 42, second_param: 'test' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testIt(
    'should handle query errors gracefully',
    async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: process.env.TEST_BIGQUERY_PROJECT_ID!,
        service_account_key: process.env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
        key_file_path: process.env.TEST_BIGQUERY_KEY_FILE_PATH,
        default_dataset: process.env.TEST_BIGQUERY_DATASET,
        location: process.env.TEST_BIGQUERY_LOCATION || 'US',
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testIt('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.BigQuery);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'invalid-project',
        service_account_key: JSON.stringify({ invalid: 'key' }),
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
