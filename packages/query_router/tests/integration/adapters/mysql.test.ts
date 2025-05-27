import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MySQLAdapter } from '../../../src/adapters/mysql';
import { DataSourceType } from '../../../src/types/credentials';
import type { MySQLCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('mysql');

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

  testWithCredentials(
    'should connect to MySQL database',
    async () => {
      if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
        throw new Error(
          'TEST_MYSQL_DATABASE, TEST_MYSQL_USERNAME, and TEST_MYSQL_PASSWORD are required for this test'
        );
      }

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: testConfig.mysql.host,
        port: testConfig.mysql.port,
        database: testConfig.mysql.database,
        username: testConfig.mysql.username,
        password: testConfig.mysql.password,
        ssl: testConfig.mysql.ssl,
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
      if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
        throw new Error(
          'TEST_MYSQL_DATABASE, TEST_MYSQL_USERNAME, and TEST_MYSQL_PASSWORD are required for this test'
        );
      }

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: testConfig.mysql.host,
        port: testConfig.mysql.port,
        database: testConfig.mysql.database,
        username: testConfig.mysql.username,
        password: testConfig.mysql.password,
        ssl: testConfig.mysql.ssl,
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

  testWithCredentials(
    'should execute parameterized query',
    async () => {
      if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
        throw new Error(
          'TEST_MYSQL_DATABASE, TEST_MYSQL_USERNAME, and TEST_MYSQL_PASSWORD are required for this test'
        );
      }

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: testConfig.mysql.host,
        port: testConfig.mysql.port,
        database: testConfig.mysql.database,
        username: testConfig.mysql.username,
        password: testConfig.mysql.password,
        ssl: testConfig.mysql.ssl,
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
      if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
        throw new Error(
          'TEST_MYSQL_DATABASE, TEST_MYSQL_USERNAME, and TEST_MYSQL_PASSWORD are required for this test'
        );
      }

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: testConfig.mysql.host,
        port: testConfig.mysql.port,
        database: testConfig.mysql.database,
        username: testConfig.mysql.username,
        password: testConfig.mysql.password,
        ssl: testConfig.mysql.ssl,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.MySQL);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'invalid-host',
        port: 3306,
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
