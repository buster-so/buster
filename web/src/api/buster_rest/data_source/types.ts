import type {
  createBigQueryDataSource,
  createDatabricksDataSource,
  createMySQLDataSource,
  createPostgresDataSource,
  createRedshiftDataSource,
  createSQLServerDataSource,
  createSnowflakeDataSource,
  updateBigQueryDataSource,
  updateDatabricksDataSource,
  updateMySQLDataSource,
  updatePostgresDataSource,
  updateRedshiftDataSource,
  updateSQLServerDataSource,
  updateSnowflakeDataSource
} from './requests';

// Type definitions for the create datasource parameters
export type PostgresCreateParams = Parameters<typeof createPostgresDataSource>[0];
export type MySQLCreateParams = Parameters<typeof createMySQLDataSource>[0];
export type BigQueryCreateParams = Parameters<typeof createBigQueryDataSource>[0];
export type RedshiftCreateParams = Parameters<typeof createRedshiftDataSource>[0];
export type SnowflakeCreateParams = Parameters<typeof createSnowflakeDataSource>[0];
export type DatabricksCreateParams = Parameters<typeof createDatabricksDataSource>[0];
export type SQLServerCreateParams = Parameters<typeof createSQLServerDataSource>[0];

// Type definitions for the update datasource parameters
export type PostgresUpdateParams = Parameters<typeof updatePostgresDataSource>[0];
export type MySQLUpdateParams = Parameters<typeof updateMySQLDataSource>[0];
export type BigQueryUpdateParams = Parameters<typeof updateBigQueryDataSource>[0];
export type RedshiftUpdateParams = Parameters<typeof updateRedshiftDataSource>[0];
export type SnowflakeUpdateParams = Parameters<typeof updateSnowflakeDataSource>[0];
export type DatabricksUpdateParams = Parameters<typeof updateDatabricksDataSource>[0];
export type SQLServerUpdateParams = Parameters<typeof updateSQLServerDataSource>[0];
