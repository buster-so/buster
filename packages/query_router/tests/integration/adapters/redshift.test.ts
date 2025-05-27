import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RedshiftAdapter } from '../../../src/adapters/redshift';
import { DataSourceType } from '../../../src/types/credentials';
import type { RedshiftCredentials } from '../../../src/types/credentials';
import { TEST_TIMEOUT, skipIfNoCredentials, testConfig } from '../../setup';

const testWithCredentials = skipIfNoCredentials('redshift');

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

  testWithCredentials(
    'should connect to Redshift database',
    async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: testConfig.redshift.host!,
        port: testConfig.redshift.port,
        database: testConfig.redshift.database!,
        username: testConfig.redshift.username!,
        password: testConfig.redshift.password!,
        schema: testConfig.redshift.schema,
        cluster_identifier: testConfig.redshift.cluster_identifier,
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: testConfig.redshift.host!,
        port: testConfig.redshift.port,
        database: testConfig.redshift.database!,
        username: testConfig.redshift.username!,
        password: testConfig.redshift.password!,
        schema: testConfig.redshift.schema,
        cluster_identifier: testConfig.redshift.cluster_identifier,
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: testConfig.redshift.host!,
        port: testConfig.redshift.port,
        database: testConfig.redshift.database!,
        username: testConfig.redshift.username!,
        password: testConfig.redshift.password!,
        schema: testConfig.redshift.schema,
        cluster_identifier: testConfig.redshift.cluster_identifier,
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: testConfig.redshift.host!,
        port: testConfig.redshift.port,
        database: testConfig.redshift.database!,
        username: testConfig.redshift.username!,
        password: testConfig.redshift.password!,
        schema: testConfig.redshift.schema,
        cluster_identifier: testConfig.redshift.cluster_identifier,
      };

      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT * FROM non_existent_table')).rejects.toThrow();
    },
    TEST_TIMEOUT
  );

  testWithCredentials('should return correct data source type', async () => {
    expect(adapter.getDataSourceType()).toBe(DataSourceType.Redshift);
  });

  it(
    'should fail to connect with invalid credentials',
    async () => {
      const invalidCredentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'invalid-cluster.redshift.amazonaws.com',
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
