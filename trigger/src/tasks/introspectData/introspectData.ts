import { logger, task } from '@trigger.dev/sdk/v3';
import { DataSource } from '../../../../packages/data-source/src/data-source';
import type { DataSourceConfig } from '../../../../packages/data-source/src/data-source';
import type { IntrospectDataInput, IntrospectDataOutput } from './interfaces';

/**
 * Task for introspecting data sources by connecting to them and analyzing their structure.
 *
 * This task:
 * 1. Takes data source credentials as input
 * 2. Tests the connection to the data source
 * 3. Runs full introspection to analyze databases, schemas, tables, columns, and views
 * 4. Returns a success status
 *
 * Supports all major data source types: Snowflake, PostgreSQL, MySQL, BigQuery,
 * SQL Server, Redshift, and Databricks.
 *
 * @example
 * ```typescript
 * const result = await introspectData.trigger({
 *   dataSourceName: 'my-snowflake-db',
 *   credentials: {
 *     type: DataSourceType.Snowflake,
 *     account_id: 'ABC12345.us-central1.gcp',
 *     warehouse_id: 'COMPUTE_WH',
 *     username: 'user',
 *     password: 'pass',
 *     default_database: 'MY_DB'
 *   },
 *   options: {
 *     databases: ['MY_DB'],
 *     schemas: ['PUBLIC']
 *   }
 * });
 * ```
 */
export const introspectData = task({
  id: 'introspect-data',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: IntrospectDataInput, { ctx }): Promise<IntrospectDataOutput> => {
    logger.log('Processing data introspection request', {
      dataSourceName: payload.dataSourceName,
      credentialsType: payload.credentials.type,
      ctx,
    });

    try {
      // Create DataSource configuration
      const config: DataSourceConfig = {
        name: payload.dataSourceName,
        type: payload.credentials.type,
        credentials: payload.credentials,
      };

      // Initialize DataSource
      const dataSource = new DataSource({ dataSources: [config] });

      try {
        // Test the connection first
        logger.log('Testing data source connection...', { dataSourceName: payload.dataSourceName });
        const connectionResult = await dataSource.testDataSource(payload.dataSourceName);

        if (!connectionResult) {
          throw new Error('Data source connection test failed');
        }

        // Run full introspection
        logger.log('Running full introspection...', { dataSourceName: payload.dataSourceName });
        const introspection = await dataSource.getFullIntrospection(
          payload.dataSourceName,
          payload.options
        );

        logger.log('Introspection completed successfully', {
          dataSourceName: payload.dataSourceName,
          databaseCount: introspection.databases.length,
          schemaCount: introspection.schemas.length,
          tableCount: introspection.tables.length,
          columnCount: introspection.columns.length,
          viewCount: introspection.views.length,
        });

        return {
          success: true,
          dataSourceName: payload.dataSourceName,
        };
      } finally {
        // Always close the data source connection
        await dataSource.close();
      }
    } catch (error) {
      logger.error('Data introspection failed', {
        dataSourceName: payload.dataSourceName,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        dataSourceName: payload.dataSourceName,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
