import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabricksAdapter } from '../../../src/adapters/databricks';
import { DataSourceType } from '../../../src/types/credentials';
import type { DatabricksCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('databricks');

describe('DatabricksAdapter Integration', () => {
  let adapter: DatabricksAdapter;

  beforeEach(() => {
    adapter = new DatabricksAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should connect to Databricks',
    async () => {
      if (
        !testConfig.databricks.server_hostname ||
        !testConfig.databricks.http_path ||
        !testConfig.databricks.access_token
      ) {
        throw new Error(
          'TEST_DATABRICKS_SERVER_HOSTNAME, TEST_DATABRICKS_HTTP_PATH, and TEST_DATABRICKS_ACCESS_TOKEN are required for this test'
        );
      }

      const credentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: testConfig.databricks.server_hostname,
        http_path: testConfig.databricks.http_path,
        access_token: testConfig.databricks.access_token,
        catalog: testConfig.databricks.catalog,
        schema: testConfig.databricks.schema,
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
      if (
        !testConfig.databricks.server_hostname ||
        !testConfig.databricks.http_path ||
        !testConfig.databricks.access_token
      ) {
        throw new Error(
          'TEST_DATABRICKS_SERVER_HOSTNAME, TEST_DATABRICKS_HTTP_PATH, and TEST_DATABRICKS_ACCESS_TOKEN are required for this test'
        );
      }

      const credentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: testConfig.databricks.server_hostname,
        http_path: testConfig.databricks.http_path,
        access_token: testConfig.databricks.access_token,
        catalog: testConfig.databricks.catalog,
        schema: testConfig.databricks.schema,
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
    'should execute query with parameters (note: limited support)',
    async () => {
      if (
        !testConfig.databricks.server_hostname ||
        !testConfig.databricks.http_path ||
        !testConfig.databricks.access_token
      ) {
        throw new Error(
          'TEST_DATABRICKS_SERVER_HOSTNAME, TEST_DATABRICKS_HTTP_PATH, and TEST_DATABRICKS_ACCESS_TOKEN are required for this test'
        );
      }

      const credentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: testConfig.databricks.server_hostname,
        http_path: testConfig.databricks.http_path,
        access_token: testConfig.databricks.access_token,
        catalog: testConfig.databricks.catalog,
        schema: testConfig.databricks.schema,
      };

      await adapter.initialize(credentials);
      // Note: Databricks adapter has limited parameterized query support
      // This test mainly verifies the adapter handles parameters gracefully
      const result = await adapter.query("SELECT 42 as param_value, 'test' as second_param", [
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
      if (
        !testConfig.databricks.server_hostname ||
        !testConfig.databricks.http_path ||
        !testConfig.databricks.access_token
      ) {
        throw new Error(
          'TEST_DATABRICKS_SERVER_HOSTNAME, TEST_DATABRICKS_HTTP_PATH, and TEST_DATABRICKS_ACCESS_TOKEN are required for this test'
        );
      }

      const credentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: testConfig.databricks.server_hostname,
        http_path: testConfig.databricks.http_path,
        access_token: testConfig.databricks.access_token,
        catalog: testConfig.databricks.catalog,
        schema: testConfig.databricks.schema,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Databricks);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: 'invalid.cloud.databricks.com',
        http_path: '/sql/1.0/warehouses/invalid',
        access_token: 'invalid-token',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
