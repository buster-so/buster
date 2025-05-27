import { DataSourceType, QueryRouter } from '../src';
import type { DataSourceConfig } from '../src';

// Example usage of the QueryRouter with multiple data sources
async function basicUsageExample() {
  // Define data source configurations
  const dataSources: DataSourceConfig[] = [
    {
      name: 'snowflake-prod',
      type: DataSourceType.Snowflake,
      credentials: {
        type: DataSourceType.Snowflake,
        account_id: 'your-account.region.cloud',
        warehouse_id: 'COMPUTE_WH',
        username: 'your-username',
        password: 'your-password',
        default_database: 'your-database',
        default_schema: 'public',
      },
    },
    {
      name: 'postgres-analytics',
      type: DataSourceType.PostgreSQL,
      credentials: {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'analytics',
        username: 'postgres',
        password: 'password',
        ssl: false,
      },
    },
    {
      name: 'bigquery-warehouse',
      type: DataSourceType.BigQuery,
      credentials: {
        type: DataSourceType.BigQuery,
        project_id: 'your-gcp-project',
        service_account_key: '/path/to/service-account.json',
        default_dataset: 'analytics',
      },
    },
  ];

  // Create router instance
  const router = new QueryRouter({
    dataSources,
    defaultDataSource: 'postgres-analytics',
  });

  try {
    // Test all connections
    console.info('Testing connections...');
    const connectionResults = await router.testAllDataSources();
    console.info('Connection results:', connectionResults);

    // Execute a query on the default data source
    const result1 = await router.execute({
      sql: 'SELECT 1 as test_column',
    });
    console.info('Default query result:', result1);

    // Execute a query on a specific data source
    const result2 = await router.execute({
      sql: 'SELECT COUNT(*) as row_count FROM information_schema.tables',
      warehouse: 'postgres-analytics',
    });
    console.info('Postgres query result:', result2);

    // Execute a parameterized query
    const result3 = await router.execute({
      sql: 'SELECT * FROM users WHERE id = ? AND status = ?',
      params: [123, 'active'],
      warehouse: 'postgres-analytics',
    });
    console.info('Parameterized query result:', result3);

    // Get data sources by type
    const postgresDataSources = router.getDataSourcesByType(DataSourceType.PostgreSQL);
    console.info(
      'PostgreSQL data sources:',
      postgresDataSources.map((ds) => ds.name)
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up connections
    await router.close();
  }
}

// Example of adding a data source dynamically
async function dynamicDataSourceExample() {
  const router = new QueryRouter({
    dataSources: [],
  });

  try {
    // Add a MySQL data source dynamically
    await router.addDataSource({
      name: 'mysql-reports',
      type: DataSourceType.MySQL,
      credentials: {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        database: 'reports',
        username: 'mysql_user',
        password: 'mysql_password',
        ssl: false,
      },
    });

    console.info('Available data sources:', router.getDataSources());

    // Execute a query on the newly added data source
    const result = await router.execute({
      sql: 'SHOW TABLES',
      warehouse: 'mysql-reports',
    });
    console.info('MySQL tables:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await router.close();
  }
}

// Example of error handling
async function errorHandlingExample() {
  const router = new QueryRouter({
    dataSources: [
      {
        name: 'invalid-postgres',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'invalid-host',
          port: 5432,
          database: 'nonexistent',
          username: 'invalid',
          password: 'invalid',
        },
      },
    ],
  });

  try {
    // This will fail and return an error result
    const result = await router.execute({
      sql: 'SELECT 1',
      warehouse: 'invalid-postgres',
    });

    if (!result.success) {
      console.info('Query failed as expected:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    await router.close();
  }
}

// Export examples for use
export { basicUsageExample, dynamicDataSourceExample, errorHandlingExample };

// Run examples if this file is executed directly
if (import.meta.main) {
  console.info('Running basic usage example...');
  await basicUsageExample();

  console.info('\nRunning dynamic data source example...');
  await dynamicDataSourceExample();

  console.info('\nRunning error handling example...');
  await errorHandlingExample();
}
