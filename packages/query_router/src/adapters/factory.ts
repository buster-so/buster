import { type Credentials, DataSourceType } from '../types/credentials';
import type { DatabaseAdapter } from './base';
import { BigQueryAdapter } from './bigquery';
import { DatabricksAdapter } from './databricks';
import { MySQLAdapter } from './mysql';
import { PostgreSQLAdapter } from './postgresql';
import { RedshiftAdapter } from './redshift';
import { SnowflakeAdapter } from './snowflake';
import { SQLServerAdapter } from './sqlserver';

/**
 * Create an adapter instance based on credentials
 */
export async function createAdapter(credentials: Credentials): Promise<DatabaseAdapter> {
  const adapter = createAdapterInstance(credentials);

  // Initialize the adapter with credentials
  await adapter.initialize(credentials);
  return adapter;
}

/**
 * Create an adapter instance without initializing it (useful for testing)
 */
export function createAdapterInstance(credentials: Credentials): DatabaseAdapter {
  let adapter: DatabaseAdapter;

  switch (credentials.type) {
    case DataSourceType.Snowflake:
      adapter = new SnowflakeAdapter();
      break;

    case DataSourceType.BigQuery:
      adapter = new BigQueryAdapter();
      break;

    case DataSourceType.PostgreSQL:
      adapter = new PostgreSQLAdapter();
      break;

    case DataSourceType.MySQL:
      adapter = new MySQLAdapter();
      break;

    case DataSourceType.SQLServer:
      adapter = new SQLServerAdapter();
      break;

    case DataSourceType.Redshift:
      adapter = new RedshiftAdapter();
      break;

    case DataSourceType.Databricks:
      adapter = new DatabricksAdapter();
      break;

    default: {
      // Use never type for exhaustive checking
      const exhaustiveCheck: never = credentials;
      throw new Error(`Unsupported data source type: ${(exhaustiveCheck as Credentials).type}`);
    }
  }

  return adapter;
}

/**
 * Get supported data source types
 */
export function getSupportedTypes(): DataSourceType[] {
  return Object.values(DataSourceType);
}

/**
 * Check if a data source type is supported
 */
export function isSupported(type: DataSourceType): boolean {
  return Object.values(DataSourceType).includes(type);
}
