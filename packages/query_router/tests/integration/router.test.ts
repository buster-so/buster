import { afterEach, describe, expect, it } from 'vitest';
import { QueryRouter } from '../../src/router';
import type { DataSourceConfig } from '../../src/router';
import { DataSourceType } from '../../src/types/credentials';
import type { MySQLCredentials, PostgreSQLCredentials } from '../../src/types/credentials';
import { TEST_TIMEOUT, hasCredentials, testConfig } from '../setup';

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
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: testConfig.postgresql.host,
            port: testConfig.postgresql.port,
            database: testConfig.postgresql.database!,
            username: testConfig.postgresql.username!,
            password: testConfig.postgresql.password!,
            schema: testConfig.postgresql.schema,
            ssl: testConfig.postgresql.ssl,
          } as PostgreSQLCredentials,
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
            credentials: {
              type: DataSourceType.PostgreSQL,
              host: testConfig.postgresql.host,
              port: testConfig.postgresql.port,
              database: testConfig.postgresql.database!,
              username: testConfig.postgresql.username!,
              password: testConfig.postgresql.password!,
              schema: testConfig.postgresql.schema,
              ssl: testConfig.postgresql.ssl,
            } as PostgreSQLCredentials,
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
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: testConfig.postgresql.host,
            port: testConfig.postgresql.port,
            database: testConfig.postgresql.database!,
            username: testConfig.postgresql.username!,
            password: testConfig.postgresql.password!,
            schema: testConfig.postgresql.schema,
            ssl: testConfig.postgresql.ssl,
          } as PostgreSQLCredentials,
        });
      }

      if (hasCredentials('mysql')) {
        dataSources.push({
          name: 'test-mysql',
          type: DataSourceType.MySQL,
          credentials: {
            type: DataSourceType.MySQL,
            host: testConfig.mysql.host,
            port: testConfig.mysql.port,
            database: testConfig.mysql.database!,
            username: testConfig.mysql.username!,
            password: testConfig.mysql.password!,
            ssl: testConfig.mysql.ssl,
          } as MySQLCredentials,
        });
      }

      if (dataSources.length === 0) {
        return; // Skip if no credentials available
      }

      router = new QueryRouter({
        dataSources,
        defaultDataSource: dataSources[0]!.name,
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
            credentials: {
              type: DataSourceType.PostgreSQL,
              host: testConfig.postgresql.host,
              port: testConfig.postgresql.port,
              database: testConfig.postgresql.database!,
              username: testConfig.postgresql.username!,
              password: testConfig.postgresql.password!,
              schema: testConfig.postgresql.schema,
              ssl: testConfig.postgresql.ssl,
            } as PostgreSQLCredentials,
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
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: testConfig.postgresql.host,
            port: testConfig.postgresql.port,
            database: testConfig.postgresql.database!,
            username: testConfig.postgresql.username!,
            password: testConfig.postgresql.password!,
            schema: testConfig.postgresql.schema,
            ssl: testConfig.postgresql.ssl,
          } as PostgreSQLCredentials,
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
          credentials: {
            type: DataSourceType.PostgreSQL,
            host: testConfig.postgresql.host,
            port: testConfig.postgresql.port,
            database: testConfig.postgresql.database!,
            username: testConfig.postgresql.username!,
            password: testConfig.postgresql.password!,
            schema: testConfig.postgresql.schema,
            ssl: testConfig.postgresql.ssl,
          } as PostgreSQLCredentials,
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
            credentials: {
              type: DataSourceType.PostgreSQL,
              host: testConfig.postgresql.host,
              port: testConfig.postgresql.port,
              database: testConfig.postgresql.database!,
              username: testConfig.postgresql.username!,
              password: testConfig.postgresql.password!,
              schema: testConfig.postgresql.schema,
              ssl: testConfig.postgresql.ssl,
            } as PostgreSQLCredentials,
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
            credentials: {
              type: DataSourceType.PostgreSQL,
              host: testConfig.postgresql.host,
              port: testConfig.postgresql.port,
              database: testConfig.postgresql.database!,
              username: testConfig.postgresql.username!,
              password: testConfig.postgresql.password!,
              schema: testConfig.postgresql.schema,
              ssl: testConfig.postgresql.ssl,
            } as PostgreSQLCredentials,
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
