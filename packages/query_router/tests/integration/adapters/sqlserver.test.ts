import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLServerAdapter } from '../../../src/adapters/sqlserver';
import { DataSourceType } from '../../../src/types/credentials';
import type { SQLServerCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('sqlserver');

describe('SQLServerAdapter Integration', () => {
  let adapter: SQLServerAdapter;

  beforeEach(() => {
    adapter = new SQLServerAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should connect to SQL Server database',
    async () => {
      if (
        !testConfig.sqlserver.server ||
        !testConfig.sqlserver.database ||
        !testConfig.sqlserver.username ||
        !testConfig.sqlserver.password
      ) {
        throw new Error(
          'TEST_SQLSERVER_SERVER, TEST_SQLSERVER_DATABASE, TEST_SQLSERVER_USERNAME, and TEST_SQLSERVER_PASSWORD are required for this test'
        );
      }

      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: testConfig.sqlserver.server,
        port: testConfig.sqlserver.port,
        database: testConfig.sqlserver.database,
        username: testConfig.sqlserver.username,
        password: testConfig.sqlserver.password,
        encrypt: testConfig.sqlserver.encrypt,
        trust_server_certificate: testConfig.sqlserver.trust_server_certificate,
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
        !testConfig.sqlserver.server ||
        !testConfig.sqlserver.database ||
        !testConfig.sqlserver.username ||
        !testConfig.sqlserver.password
      ) {
        throw new Error(
          'TEST_SQLSERVER_SERVER, TEST_SQLSERVER_DATABASE, TEST_SQLSERVER_USERNAME, and TEST_SQLSERVER_PASSWORD are required for this test'
        );
      }

      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: testConfig.sqlserver.server,
        port: testConfig.sqlserver.port,
        database: testConfig.sqlserver.database,
        username: testConfig.sqlserver.username,
        password: testConfig.sqlserver.password,
        encrypt: testConfig.sqlserver.encrypt,
        trust_server_certificate: testConfig.sqlserver.trust_server_certificate,
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
      if (
        !testConfig.sqlserver.server ||
        !testConfig.sqlserver.database ||
        !testConfig.sqlserver.username ||
        !testConfig.sqlserver.password
      ) {
        throw new Error(
          'TEST_SQLSERVER_SERVER, TEST_SQLSERVER_DATABASE, TEST_SQLSERVER_USERNAME, and TEST_SQLSERVER_PASSWORD are required for this test'
        );
      }

      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: testConfig.sqlserver.server,
        port: testConfig.sqlserver.port,
        database: testConfig.sqlserver.database,
        username: testConfig.sqlserver.username,
        password: testConfig.sqlserver.password,
        encrypt: testConfig.sqlserver.encrypt,
        trust_server_certificate: testConfig.sqlserver.trust_server_certificate,
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT @param1 as param_value, @param2 as second_param', [
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
        !testConfig.sqlserver.server ||
        !testConfig.sqlserver.database ||
        !testConfig.sqlserver.username ||
        !testConfig.sqlserver.password
      ) {
        throw new Error(
          'TEST_SQLSERVER_SERVER, TEST_SQLSERVER_DATABASE, TEST_SQLSERVER_USERNAME, and TEST_SQLSERVER_PASSWORD are required for this test'
        );
      }

      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: testConfig.sqlserver.server,
        port: testConfig.sqlserver.port,
        database: testConfig.sqlserver.database,
        username: testConfig.sqlserver.username,
        password: testConfig.sqlserver.password,
        encrypt: testConfig.sqlserver.encrypt,
        trust_server_certificate: testConfig.sqlserver.trust_server_certificate,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.SQLServer);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'invalid-server',
        port: 1433,
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
