import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MySQLCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { MySQLAdapter } from './mysql';

// Check if MySQL test credentials are available
const hasMySQLCredentials = !!(
  process.env.TEST_MYSQL_DATABASE &&
  process.env.TEST_MYSQL_USERNAME &&
  process.env.TEST_MYSQL_PASSWORD
);

// Skip tests if credentials are not available
const testIt = hasMySQLCredentials ? it : it.skip;

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

describe('MySQLAdapter Integration', () => {
  let adapter: MySQLAdapter;

  beforeEach(() => {
    adapter = new MySQLAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testIt(
    'should connect to MySQL database',
    async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: Number(process.env.TEST_MYSQL_PORT) || 3306,
        default_database: process.env.TEST_MYSQL_DATABASE!,
        username: process.env.TEST_MYSQL_USERNAME!,
        password: process.env.TEST_MYSQL_PASSWORD!,
        ssl: process.env.TEST_MYSQL_SSL === 'true',
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
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: Number(process.env.TEST_MYSQL_PORT) || 3306,
        default_database: process.env.TEST_MYSQL_DATABASE!,
        username: process.env.TEST_MYSQL_USERNAME!,
        password: process.env.TEST_MYSQL_PASSWORD!,
        ssl: process.env.TEST_MYSQL_SSL === 'true',
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
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: Number(process.env.TEST_MYSQL_PORT) || 3306,
        default_database: process.env.TEST_MYSQL_DATABASE!,
        username: process.env.TEST_MYSQL_USERNAME!,
        password: process.env.TEST_MYSQL_PASSWORD!,
        ssl: process.env.TEST_MYSQL_SSL === 'true',
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
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: process.env.TEST_MYSQL_HOST || 'localhost',
        port: Number(process.env.TEST_MYSQL_PORT) || 3306,
        default_database: process.env.TEST_MYSQL_DATABASE!,
        username: process.env.TEST_MYSQL_USERNAME!,
        password: process.env.TEST_MYSQL_PASSWORD!,
        ssl: process.env.TEST_MYSQL_SSL === 'true',
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testIt('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.MySQL);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'invalid-host',
        port: 3306,
        default_database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
