import { afterEach, describe, expect, it } from 'vitest';
import type { DataSourceConfig } from '../data-source';
import { DataSource } from '../data-source';
import { hasCredentials, TEST_TIMEOUT, testConfig } from '../setup';
import type {
  BigQueryCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  SnowflakeCredentials,
} from '../types/credentials';
import { DataSourceType } from '../types/credentials';

// Helper functions to create credentials for each data source type
function createPostgreSQLCredentials(): PostgreSQLCredentials {
  return {
    type: DataSourceType.PostgreSQL,
    host: testConfig.postgresql.host,
    port: testConfig.postgresql.port,
    database: testConfig.postgresql.database || '',
    username: testConfig.postgresql.username || '',
    password: testConfig.postgresql.password || '',
    schema: testConfig.postgresql.schema,
    ssl: testConfig.postgresql.ssl,
  };
}

function createMySQLCredentials(): MySQLCredentials {
  return {
    type: DataSourceType.MySQL,
    host: testConfig.mysql.host,
    port: testConfig.mysql.port,
    database: testConfig.mysql.database || '',
    username: testConfig.mysql.username || '',
    password: testConfig.mysql.password || '',
    ssl: testConfig.mysql.ssl,
  };
}

function createBigQueryCredentials(): BigQueryCredentials {
  return {
    type: DataSourceType.BigQuery,
    project_id: testConfig.bigquery.project_id || '',
    service_account_key: testConfig.bigquery.service_account_key,
    key_file_path: testConfig.bigquery.key_file_path,
    default_dataset: testConfig.bigquery.default_dataset,
    location: testConfig.bigquery.location,
  };
}

function createSnowflakeCredentials(): SnowflakeCredentials {
  return {
    type: DataSourceType.Snowflake,
    account_id: testConfig.snowflake.account_id || '',
    warehouse_id: testConfig.snowflake.warehouse_id || '',
    username: testConfig.snowflake.username || '',
    password: testConfig.snowflake.password || '',
    default_database: testConfig.snowflake.default_database || '',
    default_schema: testConfig.snowflake.default_schema,
    role: testConfig.snowflake.role,
  };
}

describe.skip('Multi-DataSource Introspection', () => {
  let dataSource: DataSource;

  afterEach(async () => {
    if (dataSource) {
      await dataSource.close();
    }
  });

  it(
    'should handle multiple data sources with different types',
    async () => {
      const configs: DataSourceConfig[] = [];

      // Add available data sources
      if (hasCredentials('postgresql')) {
        configs.push({
          name: 'multi-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        });
      }

      if (hasCredentials('mysql')) {
        configs.push({
          name: 'multi-mysql',
          type: DataSourceType.MySQL,
          credentials: createMySQLCredentials(),
        });
      }

      if (hasCredentials('bigquery')) {
        configs.push({
          name: 'multi-bigquery',
          type: DataSourceType.BigQuery,
          credentials: createBigQueryCredentials(),
        });
      }

      if (hasCredentials('snowflake')) {
        configs.push({
          name: 'multi-snowflake',
          type: DataSourceType.Snowflake,
          credentials: createSnowflakeCredentials(),
        });
      }

      if (configs.length === 0) {
        return; // Skip if no credentials available
      }

      dataSource = new DataSource({ dataSources: configs });

      // Test each configured data source
      for (const config of configs) {
        const introspection = await dataSource.getFullIntrospection(config.name);
        expect(introspection.dataSourceName).toBe(config.name);
        expect(introspection.dataSourceType).toBeDefined();
        expect(Array.isArray(introspection.databases)).toBe(true);
        expect(Array.isArray(introspection.schemas)).toBe(true);
        expect(Array.isArray(introspection.tables)).toBe(true);
        expect(Array.isArray(introspection.columns)).toBe(true);
        expect(Array.isArray(introspection.views)).toBe(true);
        expect(introspection.introspectedAt).toBeInstanceOf(Date);
      }
    },
    TEST_TIMEOUT
  );

  it(
    'should test connections for all configured data sources',
    async () => {
      const configs: DataSourceConfig[] = [];

      // Add available data sources
      if (hasCredentials('postgresql')) {
        configs.push({
          name: 'conn-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        });
      }

      if (hasCredentials('mysql')) {
        configs.push({
          name: 'conn-mysql',
          type: DataSourceType.MySQL,
          credentials: createMySQLCredentials(),
        });
      }

      if (hasCredentials('bigquery')) {
        configs.push({
          name: 'conn-bigquery',
          type: DataSourceType.BigQuery,
          credentials: createBigQueryCredentials(),
        });
      }

      if (configs.length === 0) {
        return; // Skip if no credentials available
      }

      dataSource = new DataSource({ dataSources: configs });

      const results = await dataSource.testAllDataSources();

      for (const config of configs) {
        expect(results).toHaveProperty(config.name);
        expect(results[config.name]).toBe(true);
      }
    },
    TEST_TIMEOUT
  );

  // Helper function to reduce complexity
  function addFilterTestConfigs(): DataSourceConfig[] {
    const configs: DataSourceConfig[] = [];

    if (hasCredentials('postgresql')) {
      configs.push(
        {
          name: 'filter-postgres-1',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        },
        {
          name: 'filter-postgres-2',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        }
      );
    }

    if (hasCredentials('mysql')) {
      configs.push({
        name: 'filter-mysql',
        type: DataSourceType.MySQL,
        credentials: createMySQLCredentials(),
      });
    }

    return configs;
  }

  it(
    'should handle data source filtering by type',
    async () => {
      const configs = addFilterTestConfigs();

      if (configs.length === 0) {
        return; // Skip if no credentials available
      }

      dataSource = new DataSource({ dataSources: configs });

      // Test filtering by PostgreSQL type
      const postgresSources = dataSource.getDataSourcesByType(DataSourceType.PostgreSQL);
      const mysqlSources = dataSource.getDataSourcesByType(DataSourceType.MySQL);

      if (hasCredentials('postgresql')) {
        expect(postgresSources.length).toBeGreaterThanOrEqual(1);
        for (const source of postgresSources) {
          expect(source.type).toBe(DataSourceType.PostgreSQL);
        }
      }

      if (hasCredentials('mysql')) {
        expect(mysqlSources.length).toBeGreaterThanOrEqual(1);
        for (const source of mysqlSources) {
          expect(source.type).toBe(DataSourceType.MySQL);
        }
      }
    },
    TEST_TIMEOUT
  );

  it(
    'should handle default data source selection',
    async () => {
      const configs: DataSourceConfig[] = [];

      // Add available data sources
      if (hasCredentials('postgresql')) {
        configs.push({
          name: 'default-postgres',
          type: DataSourceType.PostgreSQL,
          credentials: createPostgreSQLCredentials(),
        });
      }

      if (hasCredentials('mysql')) {
        configs.push({
          name: 'secondary-mysql',
          type: DataSourceType.MySQL,
          credentials: createMySQLCredentials(),
        });
      }

      if (configs.length === 0) {
        return; // Skip if no credentials available
      }

      // Set the first data source as default
      dataSource = new DataSource({
        dataSources: configs,
        defaultDataSource: configs[0]?.name,
      });

      // Test introspection without specifying data source (should use default)
      const introspection = await dataSource.getFullIntrospection();
      expect(introspection.dataSourceName).toBe(configs[0]?.name);
    },
    TEST_TIMEOUT
  );

  it('should handle invalid credentials gracefully', async () => {
    const config: DataSourceConfig = {
      name: 'invalid-postgres',
      type: DataSourceType.PostgreSQL,
      credentials: {
        type: DataSourceType.PostgreSQL,
        host: 'invalid-host',
        database: 'invalid-db',
        username: 'invalid-user',
        password: 'invalid-pass',
      },
    };

    dataSource = new DataSource({ dataSources: [config] });

    // Connection test should fail
    const connectionResult = await dataSource.testDataSource('invalid-postgres');
    expect(connectionResult).toBe(false);
  });

  it('should throw error for non-existent data source introspection', async () => {
    dataSource = new DataSource({ dataSources: [] });

    await expect(dataSource.getDatabases('non-existent')).rejects.toThrow(
      "Data source 'non-existent' not found"
    );
  });

  it('should handle data source management operations', async () => {
    // Start with empty data source
    dataSource = new DataSource({ dataSources: [] });

    expect(dataSource.getDataSources()).toEqual([]);

    // Add a data source if credentials are available
    if (hasCredentials('postgresql')) {
      const config: DataSourceConfig = {
        name: 'dynamic-postgres',
        type: DataSourceType.PostgreSQL,
        credentials: createPostgreSQLCredentials(),
      };

      await dataSource.addDataSource(config);
      expect(dataSource.getDataSources()).toContain('dynamic-postgres');

      // Test the added data source
      const connectionResult = await dataSource.testDataSource('dynamic-postgres');
      expect(connectionResult).toBe(true);

      // Remove the data source
      await dataSource.removeDataSource('dynamic-postgres');
      expect(dataSource.getDataSources()).not.toContain('dynamic-postgres');
    }
  });
});
