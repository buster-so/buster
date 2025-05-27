import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnowflakeAdapter } from '../../../src/adapters/snowflake';
import { DataSourceType } from '../../../src/types/credentials';
import type { SnowflakeCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('snowflake');

describe('SnowflakeAdapter Integration', () => {
  let adapter: SnowflakeAdapter;

  beforeEach(() => {
    adapter = new SnowflakeAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should connect to Snowflake',
    async () => {
      if (
        !testConfig.snowflake.account_id ||
        !testConfig.snowflake.warehouse_id ||
        !testConfig.snowflake.username ||
        !testConfig.snowflake.password ||
        !testConfig.snowflake.default_database
      ) {
        throw new Error(
          'TEST_SNOWFLAKE_ACCOUNT_ID, TEST_SNOWFLAKE_WAREHOUSE_ID, TEST_SNOWFLAKE_USERNAME, TEST_SNOWFLAKE_PASSWORD, and TEST_SNOWFLAKE_DATABASE are required for this test'
        );
      }

      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: testConfig.snowflake.account_id,
        warehouse_id: testConfig.snowflake.warehouse_id,
        username: testConfig.snowflake.username,
        password: testConfig.snowflake.password,
        default_database: testConfig.snowflake.default_database,
        default_schema: testConfig.snowflake.default_schema,
        role: testConfig.snowflake.role,
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
        !testConfig.snowflake.account_id ||
        !testConfig.snowflake.warehouse_id ||
        !testConfig.snowflake.username ||
        !testConfig.snowflake.password ||
        !testConfig.snowflake.default_database
      ) {
        throw new Error(
          'TEST_SNOWFLAKE_ACCOUNT_ID, TEST_SNOWFLAKE_WAREHOUSE_ID, TEST_SNOWFLAKE_USERNAME, TEST_SNOWFLAKE_PASSWORD, and TEST_SNOWFLAKE_DATABASE are required for this test'
        );
      }

      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: testConfig.snowflake.account_id,
        warehouse_id: testConfig.snowflake.warehouse_id,
        username: testConfig.snowflake.username,
        password: testConfig.snowflake.password,
        default_database: testConfig.snowflake.default_database,
        default_schema: testConfig.snowflake.default_schema,
        role: testConfig.snowflake.role,
      };

      await adapter.initialize(credentials);
      const result = await adapter.query("SELECT 1 as test_column, 'hello' as text_column");

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ TEST_COLUMN: 1, TEXT_COLUMN: 'hello' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should execute parameterized query',
    async () => {
      if (
        !testConfig.snowflake.account_id ||
        !testConfig.snowflake.warehouse_id ||
        !testConfig.snowflake.username ||
        !testConfig.snowflake.password ||
        !testConfig.snowflake.default_database
      ) {
        throw new Error(
          'TEST_SNOWFLAKE_ACCOUNT_ID, TEST_SNOWFLAKE_WAREHOUSE_ID, TEST_SNOWFLAKE_USERNAME, TEST_SNOWFLAKE_PASSWORD, and TEST_SNOWFLAKE_DATABASE are required for this test'
        );
      }

      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: testConfig.snowflake.account_id,
        warehouse_id: testConfig.snowflake.warehouse_id,
        username: testConfig.snowflake.username,
        password: testConfig.snowflake.password,
        default_database: testConfig.snowflake.default_database,
        default_schema: testConfig.snowflake.default_schema,
        role: testConfig.snowflake.role,
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT ? as param_value, ? as second_param', [
        42,
        'test',
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ PARAM_VALUE: 42, SECOND_PARAM: 'test' });
      expect(result.rowCount).toBe(1);
    },
    TEST_TIMEOUT
  );

  testWithCredentials(
    'should handle query errors gracefully',
    async () => {
      if (
        !testConfig.snowflake.account_id ||
        !testConfig.snowflake.warehouse_id ||
        !testConfig.snowflake.username ||
        !testConfig.snowflake.password ||
        !testConfig.snowflake.default_database
      ) {
        throw new Error(
          'TEST_SNOWFLAKE_ACCOUNT_ID, TEST_SNOWFLAKE_WAREHOUSE_ID, TEST_SNOWFLAKE_USERNAME, TEST_SNOWFLAKE_PASSWORD, and TEST_SNOWFLAKE_DATABASE are required for this test'
        );
      }

      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: testConfig.snowflake.account_id,
        warehouse_id: testConfig.snowflake.warehouse_id,
        username: testConfig.snowflake.username,
        password: testConfig.snowflake.password,
        default_database: testConfig.snowflake.default_database,
        default_schema: testConfig.snowflake.default_schema,
        role: testConfig.snowflake.role,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'invalid-account',
        warehouse_id: 'invalid-warehouse',
        username: 'invalid-user',
        password: 'invalid-pass',
        default_database: 'invalid-db',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
