import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { RedshiftCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { RedshiftAdapter } from './redshift';

// Check if Redshift test credentials are available
const hasRedshiftCredentials = !!(
  process.env.TEST_REDSHIFT_DATABASE &&
  process.env.TEST_REDSHIFT_USERNAME &&
  process.env.TEST_REDSHIFT_PASSWORD
);

// Skip tests if credentials are not available
const testIt = hasRedshiftCredentials ? it : it.skip;

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

describe('RedshiftAdapter Integration', () => {
  let adapter: RedshiftAdapter;

  beforeEach(() => {
    adapter = new RedshiftAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testIt(
    'should connect to Redshift database',
    async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: process.env.TEST_REDSHIFT_HOST || 'localhost',
        port: Number(process.env.TEST_REDSHIFT_PORT) || 5439,
        database: process.env.TEST_REDSHIFT_DATABASE!,
        username: process.env.TEST_REDSHIFT_USERNAME!,
        password: process.env.TEST_REDSHIFT_PASSWORD!,
        ssl: process.env.TEST_REDSHIFT_SSL !== 'false',
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: process.env.TEST_REDSHIFT_HOST || 'localhost',
        port: Number(process.env.TEST_REDSHIFT_PORT) || 5439,
        database: process.env.TEST_REDSHIFT_DATABASE!,
        username: process.env.TEST_REDSHIFT_USERNAME!,
        password: process.env.TEST_REDSHIFT_PASSWORD!,
        ssl: process.env.TEST_REDSHIFT_SSL !== 'false',
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: process.env.TEST_REDSHIFT_HOST || 'localhost',
        port: Number(process.env.TEST_REDSHIFT_PORT) || 5439,
        database: process.env.TEST_REDSHIFT_DATABASE!,
        username: process.env.TEST_REDSHIFT_USERNAME!,
        password: process.env.TEST_REDSHIFT_PASSWORD!,
        ssl: process.env.TEST_REDSHIFT_SSL !== 'false',
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT $1::integer as param_value, $2 as second_param', [
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: process.env.TEST_REDSHIFT_HOST || 'localhost',
        port: Number(process.env.TEST_REDSHIFT_PORT) || 5439,
        database: process.env.TEST_REDSHIFT_DATABASE!,
        username: process.env.TEST_REDSHIFT_USERNAME!,
        password: process.env.TEST_REDSHIFT_PASSWORD!,
        ssl: process.env.TEST_REDSHIFT_SSL !== 'false',
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testIt('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Redshift);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'invalid-host',
        port: 5439,
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
