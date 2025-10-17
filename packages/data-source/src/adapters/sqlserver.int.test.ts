import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SQLServerCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { SQLServerAdapter } from './sqlserver';

// Check if SQLServer test credentials are available
const hasSQLServerCredentials = !!(
  process.env.TEST_SQLSERVER_DATABASE &&
  process.env.TEST_SQLSERVER_USERNAME &&
  process.env.TEST_SQLSERVER_PASSWORD
);

// Skip tests if credentials are not available
const testIt = hasSQLServerCredentials ? it : it.skip;

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

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

  testIt(
    'should connect to SQLServer database',
    async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: process.env.TEST_SQLSERVER_SERVER || 'localhost',
        port: Number(process.env.TEST_SQLSERVER_PORT) || 1433,
        default_database: process.env.TEST_SQLSERVER_DATABASE!,
        username: process.env.TEST_SQLSERVER_USERNAME!,
        password: process.env.TEST_SQLSERVER_PASSWORD!,
        trust_server_certificate: process.env.TEST_SQLSERVER_TRUST_CERT === 'true',
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
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: process.env.TEST_SQLSERVER_SERVER || 'localhost',
        port: Number(process.env.TEST_SQLSERVER_PORT) || 1433,
        default_database: process.env.TEST_SQLSERVER_DATABASE!,
        username: process.env.TEST_SQLSERVER_USERNAME!,
        password: process.env.TEST_SQLSERVER_PASSWORD!,
        trust_server_certificate: process.env.TEST_SQLSERVER_TRUST_CERT === 'true',
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
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: process.env.TEST_SQLSERVER_SERVER || 'localhost',
        port: Number(process.env.TEST_SQLSERVER_PORT) || 1433,
        default_database: process.env.TEST_SQLSERVER_DATABASE!,
        username: process.env.TEST_SQLSERVER_USERNAME!,
        password: process.env.TEST_SQLSERVER_PASSWORD!,
        trust_server_certificate: process.env.TEST_SQLSERVER_TRUST_CERT === 'true',
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT @p1 as param_value, ? as second_param', [
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
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: process.env.TEST_SQLSERVER_SERVER || 'localhost',
        port: Number(process.env.TEST_SQLSERVER_PORT) || 1433,
        default_database: process.env.TEST_SQLSERVER_DATABASE!,
        username: process.env.TEST_SQLSERVER_USERNAME!,
        password: process.env.TEST_SQLSERVER_PASSWORD!,
        trust_server_certificate: process.env.TEST_SQLSERVER_TRUST_CERT === 'true',
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testIt('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.SQLServer);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'invalid-host',
        port: 1433,
        default_database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
