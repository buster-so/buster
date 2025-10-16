import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SnowflakeCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { SnowflakeAdapter } from './snowflake';

// Check if Snowflake test credentials are available
const hasSnowflakeCredentials = !!(
  process.env.TEST_SNOWFLAKE_DATABASE &&
  process.env.TEST_SNOWFLAKE_USERNAME &&
  process.env.TEST_SNOWFLAKE_PASSWORD &&
  process.env.TEST_SNOWFLAKE_ACCOUNT_ID
);

// Skip tests if credentials are not available
const testIt = hasSnowflakeCredentials ? it : it.skip;

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

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

  testIt(
    'should connect to Snowflake database',
    async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
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
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
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
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
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
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID!,
        warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID || 'COMPUTE_WH',
        default_database: process.env.TEST_SNOWFLAKE_DATABASE!,
        default_schema: process.env.TEST_SNOWFLAKE_SCHEMA || 'PUBLIC',
        username: process.env.TEST_SNOWFLAKE_USERNAME!,
        password: process.env.TEST_SNOWFLAKE_PASSWORD!,
        role: process.env.TEST_SNOWFLAKE_ROLE,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testIt('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
  });

  it('should fail to connect with invalid credentials', async () => {
    const invalidCredentials: SnowflakeCredentials = {
      type: DataSourceType.Snowflake,
      account_id: 'invalid-account',
      warehouse_id: 'INVALID_WH',
      default_database: 'invalid-db',
      username: 'invalid-user',
      password: 'invalid-pass',
    };

    await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
  }, 30000); // Increase timeout for connection failure
});
