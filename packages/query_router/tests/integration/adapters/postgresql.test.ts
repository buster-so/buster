import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PostgreSQLAdapter } from '../../../src/adapters/postgresql';
import { DataSourceType } from '../../../src/types/credentials';
import type { PostgreSQLCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('postgresql');

describe('PostgreSQLAdapter Integration', () => {
  let adapter: PostgreSQLAdapter;

  beforeEach(() => {
    adapter = new PostgreSQLAdapter();
  });

  afterEach(async () => {
    if (adapter) {
      await adapter.close();
    }
  });

  testWithCredentials(
    'should connect to PostgreSQL database',
    async () => {
      if (
        !testConfig.postgresql.database ||
        !testConfig.postgresql.username ||
        !testConfig.postgresql.password
      ) {
        throw new Error(
          'TEST_POSTGRES_DATABASE, TEST_POSTGRES_USERNAME, and TEST_POSTGRES_PASSWORD are required for this test'
        );
      }

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: testConfig.postgresql.host,
        port: testConfig.postgresql.port,
        database: testConfig.postgresql.database,
        username: testConfig.postgresql.username,
        password: testConfig.postgresql.password,
        schema: testConfig.postgresql.schema,
        ssl: testConfig.postgresql.ssl,
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
        !testConfig.postgresql.database ||
        !testConfig.postgresql.username ||
        !testConfig.postgresql.password
      ) {
        throw new Error(
          'TEST_POSTGRES_DATABASE, TEST_POSTGRES_USERNAME, and TEST_POSTGRES_PASSWORD are required for this test'
        );
      }

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: testConfig.postgresql.host,
        port: testConfig.postgresql.port,
        database: testConfig.postgresql.database,
        username: testConfig.postgresql.username,
        password: testConfig.postgresql.password,
        schema: testConfig.postgresql.schema,
        ssl: testConfig.postgresql.ssl,
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
        !testConfig.postgresql.database ||
        !testConfig.postgresql.username ||
        !testConfig.postgresql.password
      ) {
        throw new Error(
          'TEST_POSTGRES_DATABASE, TEST_POSTGRES_USERNAME, and TEST_POSTGRES_PASSWORD are required for this test'
        );
      }

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: testConfig.postgresql.host,
        port: testConfig.postgresql.port,
        database: testConfig.postgresql.database,
        username: testConfig.postgresql.username,
        password: testConfig.postgresql.password,
        schema: testConfig.postgresql.schema,
        ssl: testConfig.postgresql.ssl,
      };

      await adapter.initialize(credentials);
      const result = await adapter.query('SELECT $1 as param_value, $2 as second_param', [
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
        !testConfig.postgresql.database ||
        !testConfig.postgresql.username ||
        !testConfig.postgresql.password
      ) {
        throw new Error(
          'TEST_POSTGRES_DATABASE, TEST_POSTGRES_USERNAME, and TEST_POSTGRES_PASSWORD are required for this test'
        );
      }

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: testConfig.postgresql.host,
        port: testConfig.postgresql.port,
        database: testConfig.postgresql.database,
        username: testConfig.postgresql.username,
        password: testConfig.postgresql.password,
        schema: testConfig.postgresql.schema,
        ssl: testConfig.postgresql.ssl,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'invalid-host',
        port: 5432,
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      };

      await expect(adapter.initialize(invalidCredentials)).rejects.toThrow();
    },
    TEST_TIMEOUT
  );
});
