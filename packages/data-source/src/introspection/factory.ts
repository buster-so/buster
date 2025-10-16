import type { DatabaseAdapter } from '../adapters/base';
import { DataSourceType } from '../types/credentials';
import { getTableSample as getBigQueryTableSample } from './dialects/bigquery/sampling';
import { getStructuralMetadata as getBigQueryStructuralMetadata } from './dialects/bigquery/structural';
import { getTableSample as getMySQLTableSample } from './dialects/mysql/sampling';
import { getStructuralMetadata as getMySQLStructuralMetadata } from './dialects/mysql/structural';
import { getTableSample as getPostgreSQLTableSample } from './dialects/postgresql/sampling';
import { getStructuralMetadata as getPostgreSQLStructuralMetadata } from './dialects/postgresql/structural';
import { getTableSample as getRedshiftTableSample } from './dialects/redshift/sampling';
import { getStructuralMetadata as getRedshiftStructuralMetadata } from './dialects/redshift/structural';
import { getTableSample as getSnowflakeTableSample } from './dialects/snowflake/sampling';
// Import dialect-specific implementations (to be created)
import { getStructuralMetadata as getSnowflakeStructuralMetadata } from './dialects/snowflake/structural';
import { getTableSample as getSQLServerTableSample } from './dialects/sqlserver/sampling';
import { getStructuralMetadata as getSQLServerStructuralMetadata } from './dialects/sqlserver/structural';
import type {
  IntrospectionDialect,
  IntrospectionFilters,
  StructuralMetadata,
  StructuralMetadataFetcher,
  TableMetadata,
  TableSample,
  TableSampler,
} from './types';

/**
 * Factory function to create a structural metadata fetcher based on dialect
 * @param dialect - The database dialect/type
 * @returns A function that fetches structural metadata for the given dialect
 */
export function createStructuralMetadataFetcher(
  dialect: IntrospectionDialect
): StructuralMetadataFetcher {
  switch (dialect) {
    case DataSourceType.Snowflake:
      return getSnowflakeStructuralMetadata;

    case DataSourceType.PostgreSQL:
      return getPostgreSQLStructuralMetadata;

    case DataSourceType.MySQL:
      return getMySQLStructuralMetadata;

    case DataSourceType.BigQuery:
      return getBigQueryStructuralMetadata;

    case DataSourceType.Redshift:
      return getRedshiftStructuralMetadata;

    case DataSourceType.SQLServer:
      return getSQLServerStructuralMetadata;

    default: {
      // Exhaustive check using never type
      const exhaustiveCheck: never = dialect;
      throw new Error(`Unsupported dialect for structural metadata: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Factory function to create a table sampler based on dialect
 * @param dialect - The database dialect/type
 * @returns A function that samples tables for the given dialect
 */
export function createTableSampler(dialect: IntrospectionDialect): TableSampler {
  switch (dialect) {
    case DataSourceType.Snowflake:
      return getSnowflakeTableSample;

    case DataSourceType.PostgreSQL:
      return getPostgreSQLTableSample;

    case DataSourceType.MySQL:
      return getMySQLTableSample;

    case DataSourceType.BigQuery:
      return getBigQueryTableSample;

    case DataSourceType.Redshift:
      return getRedshiftTableSample;

    case DataSourceType.SQLServer:
      return getSQLServerTableSample;

    default: {
      // Exhaustive check using never type
      const exhaustiveCheck: never = dialect;
      throw new Error(`Unsupported dialect for table sampling: ${exhaustiveCheck}`);
    }
  }
}

/**
 * High-level function to get structural metadata for a data source
 * @param adapter - Database adapter instance
 * @param dialect - Database dialect type
 * @param filters - Optional filters for databases, schemas, tables
 * @returns Structural metadata for the data source
 */
export async function getStructuralMetadata(
  adapter: DatabaseAdapter,
  dialect: IntrospectionDialect,
  filters?: IntrospectionFilters
): Promise<StructuralMetadata> {
  const fetcher = createStructuralMetadataFetcher(dialect);
  return await fetcher(adapter, filters);
}

/**
 * High-level function to sample a table
 * @param adapter - Database adapter instance
 * @param dialect - Database dialect type
 * @param table - Table metadata
 * @param sampleSize - Number of rows to sample
 * @returns Sample data from the table
 */
export async function sampleTable(
  adapter: DatabaseAdapter,
  dialect: IntrospectionDialect,
  table: TableMetadata,
  sampleSize: number
): Promise<TableSample> {
  const sampler = createTableSampler(dialect);
  return await sampler(adapter, table, sampleSize);
}
