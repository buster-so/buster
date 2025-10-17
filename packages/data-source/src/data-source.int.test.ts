import { afterEach, describe, expect, it } from 'vitest';
import type { DataSourceConfig } from './data-source';
import { DataSource, QueryRouter } from './data-source';
import type { MySQLCredentials, PostgreSQLCredentials } from './types/credentials';
import { DataSourceType } from './types/credentials';

// Test timeout - 5 seconds
const TEST_TIMEOUT = 5000;

// Check if credentials are available
const hasPostgreSQLCredentials = !!(
  process.env.TEST_POSTGRES_DATABASE &&
  process.env.TEST_POSTGRES_USERNAME &&
  process.env.TEST_POSTGRES_PASSWORD
);
const hasMySQLCredentials = !!(
  process.env.TEST_MYSQL_DATABASE &&
  process.env.TEST_MYSQL_USERNAME &&
  process.env.TEST_MYSQL_PASSWORD
);

// Helper function to create PostgreSQL credentials
function createPostgreSQLCredentials(): PostgreSQLCredentials {
  return {
    type: DataSourceType.PostgreSQL,
    host: process.env.TEST_POSTGRES_HOST || 'localhost',
    port: Number(process.env.TEST_POSTGRES_PORT) || 5432,
    database: process.env.TEST_POSTGRES_DATABASE!,
    username: process.env.TEST_POSTGRES_USERNAME!,
    password: process.env.TEST_POSTGRES_PASSWORD!,
    schema: process.env.TEST_POSTGRES_SCHEMA || 'public',
    ssl: process.env.TEST_POSTGRES_SSL === 'true',
  };
}

// Helper function to create MySQL credentials
function createMySQLCredentials(): MySQLCredentials {
  return {
    type: DataSourceType.MySQL,
    host: process.env.TEST_MYSQL_HOST || 'localhost',
    port: Number(process.env.TEST_MYSQL_PORT) || 3306,
    database: process.env.TEST_MYSQL_DATABASE!,
    username: process.env.TEST_MYSQL_USERNAME!,
    password: process.env.TEST_MYSQL_PASSWORD!,
    ssl: process.env.TEST_MYSQL_SSL === 'true',
  };
}

describe('DataSource Integration', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  describe('single data source configuration', () => {
    const testIt = hasPostgreSQLCredentials ? it : it.skip;

    testIt('should initialize with PostgreSQL data source', async () => {
      const config: DataSourceConfig = {
        dataSources: [
          {
            name: 'test-postgres',
            credentials: createPostgreSQLCredentials(),
          },
        ],
      };

      dataSource = new DataSource(config);
      expect(dataSource.getDataSources()).toHaveLength(1);
      expect(dataSource.getDataSources()[0].name).toBe('test-postgres');
    });

    testIt(
      'should execute query on PostgreSQL',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);
        const result = await dataSource.query("SELECT 1 as num, 'hello' as greeting");

        expect(result.data.rows).toHaveLength(1);
        expect(result.data.rows[0]).toEqual({ num: 1, greeting: 'hello' });
        expect(result.warehouse).toBe('test-postgres');
      },
      TEST_TIMEOUT
    );
  });

  describe('multiple data source configuration', () => {
    const testIt = hasPostgreSQLCredentials && hasMySQLCredentials ? it : it.skip;

    testIt('should initialize with multiple data sources', async () => {
      const config: DataSourceConfig = {
        dataSources: [
          {
            name: 'test-postgres',
            credentials: createPostgreSQLCredentials(),
          },
          {
            name: 'test-mysql',
            credentials: createMySQLCredentials(),
          },
        ],
        defaultDataSource: 'test-postgres',
      };

      dataSource = new DataSource(config);
      expect(dataSource.getDataSources()).toHaveLength(2);
      expect(dataSource.getDefaultDataSourceName()).toBe('test-postgres');
    });

    testIt(
      'should route queries to specific data sources',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
            {
              name: 'test-mysql',
              credentials: createMySQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);

        // Query PostgreSQL
        const pgResult = await dataSource.query("SELECT 'postgres' as db", [], {
          warehouse: 'test-postgres',
        });
        expect(pgResult.data.rows[0]).toEqual({ db: 'postgres' });
        expect(pgResult.warehouse).toBe('test-postgres');

        // Query MySQL
        const mysqlResult = await dataSource.query("SELECT 'mysql' as db", [], {
          warehouse: 'test-mysql',
        });
        expect(mysqlResult.data.rows[0]).toEqual({ db: 'mysql' });
        expect(mysqlResult.warehouse).toBe('test-mysql');
      },
      TEST_TIMEOUT
    );
  });

  describe('data source management', () => {
    const testIt = hasPostgreSQLCredentials ? it : it.skip;

    testIt(
      'should add and remove data sources dynamically',
      async () => {
        dataSource = new DataSource({ dataSources: [] });
        expect(dataSource.getDataSources()).toHaveLength(0);

        // Add PostgreSQL data source
        await dataSource.addDataSource({
          name: 'dynamic-postgres',
          credentials: createPostgreSQLCredentials(),
        });

        expect(dataSource.getDataSources()).toHaveLength(1);
        const dataSourceNames = dataSource.getDataSources().map((ds) => ds.name);
        expect(dataSourceNames).toContain('dynamic-postgres');

        // Remove data source
        dataSource.removeDataSource('dynamic-postgres');
        expect(dataSource.getDataSources()).toHaveLength(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('connection testing', () => {
    const testIt = hasPostgreSQLCredentials ? it : it.skip;

    testIt(
      'should test all data source connections',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);
        const results = await dataSource.testAllConnections();

        expect(results).toHaveProperty('test-postgres');
        expect(results['test-postgres']).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe('introspection capabilities', () => {
    const testIt = hasPostgreSQLCredentials ? it : it.skip;

    testIt(
      'should get databases from data source',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);
        const databases = await dataSource.getDatabases('test-postgres');

        expect(Array.isArray(databases)).toBe(true);
        expect(databases.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should get schemas from data source',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);
        const schemas = await dataSource.getSchemas('test-postgres');

        expect(Array.isArray(schemas)).toBe(true);
        expect(schemas.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    testIt(
      'should get introspector for data source',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);
        const introspector = dataSource.getIntrospector('test-postgres');

        expect(introspector).toBeDefined();
        expect(introspector.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
      },
      TEST_TIMEOUT
    );
  });

  describe('error handling', () => {
    const testIt = hasPostgreSQLCredentials ? it : it.skip;

    testIt(
      'should handle query execution errors gracefully',
      async () => {
        const config: DataSourceConfig = {
          dataSources: [
            {
              name: 'test-postgres',
              credentials: createPostgreSQLCredentials(),
            },
          ],
        };

        dataSource = new DataSource(config);

        const result = await dataSource.query('SELECT * FROM non_existent_table');

        expect(result.data.rows).toEqual([]);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('QUERY_EXECUTION_ERROR');
      },
      TEST_TIMEOUT
    );

    it('should throw error when querying non-existent data source', async () => {
      dataSource = new DataSource({ dataSources: [] });

      await expect(dataSource.query('SELECT 1', [], { warehouse: 'non-existent' })).rejects.toThrow(
        'Data source non-existent not found'
      );
    });
  });
});

// Test backward compatibility with QueryRouter alias
describe('QueryRouter Backward Compatibility', () => {
  const testIt = hasPostgreSQLCredentials ? it : it.skip;
  let router: DataSource;

  afterEach(async () => {
    if (router) {
      await router.close();
    }
  });

  testIt('should work with QueryRouter alias', async () => {
    const config: DataSourceConfig = {
      dataSources: [
        {
          name: 'test-postgres',
          credentials: createPostgreSQLCredentials(),
        },
      ],
    };

    router = new QueryRouter(config);
    expect(router).toBeInstanceOf(DataSource);

    const result = await router.query('SELECT 1 as test');
    expect(result.data.rows[0]).toEqual({ test: 1 });
  });
});
