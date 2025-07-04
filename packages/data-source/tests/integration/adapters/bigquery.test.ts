import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BigQueryAdapter } from '../../../src/adapters/bigquery';
import { DataSourceType } from '../../../src/types/credentials';
import type { BigQueryCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('bigquery');

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

  testWithCredentials(
    'should connect to BigQuery',
    async () => {
      if (!testConfig.bigquery.project_id) {
        throw new Error('TEST_BIGQUERY_PROJECT_ID is required for this test');
      }

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: testConfig.bigquery.project_id,
        service_account_key: testConfig.bigquery.service_account_key,
        key_file_path: testConfig.bigquery.key_file_path,
        default_dataset: testConfig.bigquery.default_dataset,
        location: testConfig.bigquery.location,
      };

      await adapter.initialize(credentials);
      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(true);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should execute simple SELECT query',
    async () => {
      if (!testConfig.bigquery.project_id) {
        throw new Error('TEST_BIGQUERY_PROJECT_ID is required for this test');
      }

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: testConfig.bigquery.project_id,
        service_account_key: testConfig.bigquery.service_account_key,
        key_file_path: testConfig.bigquery.key_file_path,
        default_dataset: testConfig.bigquery.default_dataset,
        location: testConfig.bigquery.location,
      };

      await adapter.initialize(credentials);
      const result = await adapter.query("SELECT 1 as test_column, 'hello' as text_column");

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ test_column: 1, text_column: 'hello' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should execute parameterized query',
    async () => {
      if (!testConfig.bigquery.project_id) {
        throw new Error('TEST_BIGQUERY_PROJECT_ID is required for this test');
      }

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: testConfig.bigquery.project_id,
        service_account_key: testConfig.bigquery.service_account_key,
        key_file_path: testConfig.bigquery.key_file_path,
        default_dataset: testConfig.bigquery.default_dataset,
        location: testConfig.bigquery.location,
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

  testWithCredentials(
    'should handle query errors gracefully',
    async () => {
      if (!testConfig.bigquery.project_id) {
        throw new Error('TEST_BIGQUERY_PROJECT_ID is required for this test');
      }

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: testConfig.bigquery.project_id,
        service_account_key: testConfig.bigquery.service_account_key,
        key_file_path: testConfig.bigquery.key_file_path,
        default_dataset: testConfig.bigquery.default_dataset,
        location: testConfig.bigquery.location,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.BigQuery);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'invalid-project-that-does-not-exist-12345',
        service_account_key:
          '{"type": "service_account", "project_id": "invalid", "private_key": "invalid"}',
      };

      const adapter = new BigQueryAdapter();
      await adapter.initialize(invalidCredentials);

      // The connection test should fail with invalid credentials
      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(false);
    },
    TEST_TIMEOUT
  );
});
