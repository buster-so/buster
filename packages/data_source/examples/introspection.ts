import { DataSource, DataSourceType } from '../src/index';
import type { PostgreSQLCredentials, SnowflakeCredentials } from '../src/index';

/**
 * Example: Using Data Source Introspection
 *
 * This example demonstrates how to use the introspection capabilities
 * of the @buster/data-source package to discover database structure.
 */

async function introspectionExample() {
  // Configure data sources
  const dataSource = new DataSource({
    dataSources: [
      {
        name: 'snowflake-prod',
        type: DataSourceType.Snowflake,
        credentials: {
          type: DataSourceType.Snowflake,
          account_id: 'your-account',
          username: 'your-username',
          password: 'your-password',
          warehouse_id: 'your-warehouse',
          default_database: 'your-database',
        } as SnowflakeCredentials,
      },
      {
        name: 'postgres-dev',
        type: DataSourceType.PostgreSQL,
        credentials: {
          type: DataSourceType.PostgreSQL,
          host: 'localhost',
          port: 5432,
          database: 'dev_db',
          username: 'dev_user',
          password: 'dev_password',
        } as PostgreSQLCredentials,
      },
    ],
    defaultDataSource: 'snowflake-prod',
  });

  try {
    // ========== BASIC INTROSPECTION ==========

    await dataSource.getDatabases('snowflake-prod');

    // Getting Schemas
    await dataSource.getSchemas('snowflake-prod', 'ANALYTICS_DB');

    // Getting Tables
    await dataSource.getTables('snowflake-prod', 'ANALYTICS_DB', 'PUBLIC');

    // Getting Columns
    await dataSource.getColumns('snowflake-prod', 'ANALYTICS_DB', 'PUBLIC', 'USERS');

    // Getting Views
    await dataSource.getViews('snowflake-prod', 'ANALYTICS_DB', 'PUBLIC');

    // ========== ADVANCED INTROSPECTION ==========

    // Getting Table Statistics
    const stats = await dataSource.getTableStatistics(
      'ANALYTICS_DB',
      'PUBLIC',
      'USERS',
      'snowflake-prod'
    );

    if (stats.clusteringInfo) {
      void stats.clusteringInfo.clusteringKeys;
    }

    // ========== COMPREHENSIVE INTROSPECTION ==========

    // Full Data Source Introspection
    await dataSource.getFullIntrospection('postgres-dev');

    // ========== DIRECT INTROSPECTOR ACCESS ==========

    // Using Direct Introspector
    const introspector = await dataSource.introspect('snowflake-prod');

    // You can use the introspector directly for more control
    await introspector.getDatabases();

    // ========== CROSS-DATABASE COMPARISON ==========

    // Comparing Data Sources
    const snowflakeTables = await dataSource.getTables('snowflake-prod');
    const postgresTables = await dataSource.getTables('postgres-dev');

    // Find common table names
    const snowflakeTableNames = new Set(snowflakeTables.map((t) => t.name.toLowerCase()));
    void postgresTables.filter((t) => snowflakeTableNames.has(t.name.toLowerCase()));

    // ========== BUILDING A DATA CATALOG ==========

    // Building Data Catalog
    const catalog = await dataSource.getFullIntrospection('warehouse');
    void catalog.databases.length;
  } catch (error) {
    console.error('Introspection failed:', error);
  } finally {
    // Clean up connections
    await dataSource.close();
  }
}

/**
 * Example: Building a Data Catalog
 */
async function dataCatalogExample() {
  const dataSource = new DataSource({
    dataSources: [
      {
        name: 'warehouse',
        type: DataSourceType.Snowflake,
        credentials: {
          type: DataSourceType.Snowflake,
          account_id: 'your-account',
          username: 'your-username',
          password: 'your-password',
          warehouse_id: 'your-warehouse',
          default_database: 'your-database',
        } as SnowflakeCredentials,
      },
    ],
  });

  try {
    // Building Data Catalog
    const catalog = await dataSource.getFullIntrospection('warehouse');

    // Build a hierarchical structure
    catalog.databases.map((database) => ({
      database: database.name,
      schemas: catalog.schemas
        .filter((schema) => schema.database === database.name)
        .map((schema) => ({
          schema: schema.name,
          tables: catalog.tables
            .filter((table) => table.database === database.name && table.schema === schema.name)
            .map((table) => ({
              name: table.name,
              type: table.type,
              rowCount: table.rowCount,
              sizeBytes: table.sizeBytes,
              columns: catalog.columns
                .filter(
                  (column) =>
                    column.database === database.name &&
                    column.schema === schema.name &&
                    column.table === table.name
                )
                .map((column) => ({
                  name: column.name,
                  dataType: column.dataType,
                  isNullable: column.isNullable,
                  comment: column.comment,
                })),
            })),
          views: catalog.views
            .filter((view) => view.database === database.name && view.schema === schema.name)
            .map((view) => ({
              name: view.name,
              definition: view.definition,
            })),
        })),
    }));
  } catch (error) {
    console.error('Data catalog generation failed:', error);
  } finally {
    await dataSource.close();
  }
}

// Export examples for use
export { introspectionExample, dataCatalogExample };

// Run examples if this file is executed directly
if (require.main === module) {
  introspectionExample()
    .then(() => dataCatalogExample())
    .catch(console.error);
}
