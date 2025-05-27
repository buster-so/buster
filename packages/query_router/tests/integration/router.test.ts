import { afterEach, describe, expect, it } from 'vitest';
import { QueryRouter } from '../../src/router';
import type { DataSourceConfig } from '../../src/router';
import { DataSourceType } from '../../src/types/credentials';
import type { MySQLCredentials, PostgreSQLCredentials } from '../../src/types/credentials';
import { TEST_TIMEOUT, hasCredentials, testConfig } from '../setup';

// Helper function to create PostgreSQL credentials with proper validation
function createPostgreSQLCredentials(): PostgreSQLCredentials {
  if (
    !testConfig.postgresql.database ||
    !testConfig.postgresql.username ||
    !testConfig.postgresql.password
  ) {
    throw new Error(
      'TEST_POSTGRES_DATABASE, TEST_POSTGRES_USERNAME, and TEST_POSTGRES_PASSWORD are required for this test'
    );
  }

  return {
    type: DataSourceType.PostgreSQL,
    host: testConfig.postgresql.host,
    port: testConfig.postgresql.port,
    database: testConfig.postgresql.database,
    username: testConfig.postgresql.username,
    password: testConfig.postgresql.password,
    schema: testConfig.postgresql.schema,
    ssl: testConfig.postgresql.ssl,
  };
}

// Helper function to create MySQL credentials with proper validation
function createMySQLCredentials(): MySQLCredentials {
  if (!testConfig.mysql.database || !testConfig.mysql.username || !testConfig.mysql.password) {
    throw new Error(
      'TEST_MYSQL_DATABASE, TEST_MYSQL_USERNAME, and TEST_MYSQL_PASSWORD are required for this test'
    );
  }

  return {
    type: DataSourceType.MySQL,
    host: testConfig.mysql.host,
    port: testConfig.mysql.port,
    database: testConfig.mysql.database,
    username: testConfig.mysql.username,
    password: testConfig.mysql.password,
    ssl: testConfig.mysql.ssl,
  };
}

describe('QueryRouter Integration', () => {
  let router: QueryRouter;

  afterEach(async () => {
    if (router) {
      await router.close();
    }
  });

  describe('single data source configuration', () => {
    it('should initialize with PostgreSQL data source', async () => {
      if (!hasCredentials('postgresql')) {
        return; // Skip if no credentials
      }

      const dataSources: DataSourceConfig[] = [
        {
          name: 'test-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        },
      ];

      router = new QueryRouter({ dataSources });

      const dataSourceNames = router.getDataSources();
      expect(dataSourceNames).toEqual(['test-postgres']);
    });

    it(
      'should execute query on default data source',
      async () => {
        if (!hasCredentials('postgresql')) {
          return; // Skip if no credentials
        }

        const dataSources: DataSourceConfig[] = [
          {
            name: 'test-postgres',
            type: DataSourceType.PostgreSQL,
            credentials: createPostgreSQLCredentials(),
          },
        ];

        router = new QueryRouter({ dataSources });

        const result = await router.execute({
          sql: "SELECT 1 as test_value, 'hello' as message",
        });

        expect(result.success).toBe(true);
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toEqual({ test_value: 1, message: 'hello' });
        expect(result.warehouse).toBe('test-postgres');
      },
      TEST_TIMEOUT
    );
  });

  describe('multiple data source configuration', () => {
    it('should initialize with multiple data sources', async () => {
      const dataSources: DataSourceConfig[] = [];

      if (hasCredentials('postgresql')) {
        dataSources.push({
          name: 'test-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        });
      }

      if (hasCredentials('mysql')) {
        dataSources.push({
          name: 'test-mysql',
          type: DataSourceType.MySQL,
          credentials: createMySQLCredentials(),
        });
      }

      if (dataSources.length === 0) {
        return; // Skip if no credentials available
      }

      const firstDataSource = dataSources[0];
      if (!firstDataSource) {
        throw new Error('Expected at least one data source');
      }

      router = new QueryRouter({
        dataSources,
        defaultDataSource: firstDataSource.name,
      });

      const dataSourceNames = router.getDataSources();
      expect(dataSourceNames).toHaveLength(dataSources.length);
    });

    it(
      'should route query to specific data source',
      async () => {
        if (!hasCredentials('postgresql')) {
          return; // Skip if no credentials
        }

        const dataSources: DataSourceConfig[] = [
          {
            name: 'test-postgres',
            type: DataSourceType.PostgreSQL,
            credentials: createPostgreSQLCredentials(),
          },
        ];

        router = new QueryRouter({ dataSources });

        const result = await router.execute({
          sql: 'SELECT 1 as test_value',
          warehouse: 'test-postgres',
        });

        expect(result.success).toBe(true);
        expect(result.warehouse).toBe('test-postgres');
      },
      TEST_TIMEOUT
    );
  });

  describe('data source management', () => {
    it(
      'should add data source dynamically',
      async () => {
        if (!hasCredentials('postgresql')) {
          return; // Skip if no credentials
        }

        router = new QueryRouter({ dataSources: [] });

        await router.addDataSource({
          name: 'dynamic-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        });

        const dataSourceNames = router.getDataSources();
        expect(dataSourceNames).toContain('dynamic-postgres');
      },
      TEST_TIMEOUT
    );

    it('should remove data source', async () => {
      if (!hasCredentials('postgresql')) {
        return; // Skip if no credentials
      }

      const dataSources: DataSourceConfig[] = [
        {
          name: 'test-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        },
      ];

      router = new QueryRouter({ dataSources });

      expect(router.getDataSources()).toContain('test-postgres');

      await router.removeDataSource('test-postgres');

      expect(router.getDataSources()).not.toContain('test-postgres');
    });

    it(
      'should test all data source connections',
      async () => {
        if (!hasCredentials('postgresql')) {
          return; // Skip if no credentials
        }

        const dataSources: DataSourceConfig[] = [
          {
            name: 'test-postgres',
            type: DataSourceType.PostgreSQL,
            credentials: createPostgreSQLCredentials(),
          },
        ];

        router = new QueryRouter({ dataSources });

        const results = await router.testAllDataSources();

        expect(results).toHaveProperty('test-postgres');
        expect(results['test-postgres']).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('error handling', () => {
    it(
      'should handle query errors gracefully',
      async () => {
        if (!hasCredentials('postgresql')) {
          return; // Skip if no credentials
        }

        const dataSources: DataSourceConfig[] = [
          {
            name: 'test-postgres',
            type: DataSourceType.PostgreSQL,
            credentials: createPostgreSQLCredentials(),
          },
        ];

        router = new QueryRouter({ dataSources });

        const result = await router.execute({
          sql: 'SELECT * FROM non_existent_table',
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('QUERY_EXECUTION_ERROR');
      },
      TEST_TIMEOUT
    );

    it('should throw error for non-existent data source', async () => {
      router = new QueryRouter({ dataSources: [] });

      await expect(
        router.execute({
          sql: 'SELECT 1',
          warehouse: 'non-existent',
        })
      ).rejects.toThrow("Specified data source 'non-existent' not found");
    });
  });
});
