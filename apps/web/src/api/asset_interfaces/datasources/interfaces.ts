// Re-export credential types and schemas from server-shared for consistency
export type {
  BigQueryCredentials,
  DatabricksCredentials,
  MotherDuckCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SnowflakeCredentials,
  SQLServerCredentials,
} from '@buster/server-shared';

export {
  BigQueryCredentialsSchema,
  DatabricksCredentialsSchema,
  MotherDuckCredentialsSchema,
  MySQLCredentialsSchema,
  PostgreSQLCredentialsSchema,
  RedshiftCredentialsSchema,
  SnowflakeCredentialsSchema,
  SQLServerCredentialsSchema,
} from '@buster/server-shared';

export enum DataSourceStatus {
  ACTIVE = 'active',
  SYNCING = 'syncing',
  FAILED = 'failed',
  PAUSED = 'paused',
}

export enum DataSourceTypes {
  postgres = 'postgres',
  supabase = 'supabase',
  mysql = 'mysql',
  bigquery = 'bigquery',
  snowflake = 'snowflake',
  redshift = 'redshift',
  mariadb = 'mariadb',
  sqlserver = 'sqlserver',
  databricks = 'databricks',
  motherduck = 'motherduck',
  athena = 'athena',
  other = 'other',
}

export const SUPPORTED_DATASOURCES = [
  DataSourceTypes.postgres,
  DataSourceTypes.supabase,
  DataSourceTypes.mysql,
  DataSourceTypes.mariadb,
  DataSourceTypes.sqlserver,
  DataSourceTypes.redshift,
  DataSourceTypes.bigquery,
  DataSourceTypes.databricks,
  DataSourceTypes.snowflake,
  DataSourceTypes.motherduck,
];

export const DatabaseNames: Record<DataSourceTypes, string> = {
  [DataSourceTypes.postgres]: 'Postgres',
  [DataSourceTypes.mysql]: 'MySQL',
  [DataSourceTypes.snowflake]: 'Snowflake',
  [DataSourceTypes.bigquery]: 'BigQuery',
  [DataSourceTypes.supabase]: 'Supabase',
  [DataSourceTypes.redshift]: 'Redshift',
  [DataSourceTypes.databricks]: 'DataBricks',
  [DataSourceTypes.sqlserver]: 'SQL Server',
  [DataSourceTypes.mariadb]: 'MariaDB',
  [DataSourceTypes.motherduck]: 'MotherDuck',
  [DataSourceTypes.athena]: 'Athena',
  [DataSourceTypes.other]: 'Other',
};

export enum DataSourceTenetTypes {
  single = 'single',
  multi = 'multi',
}

export enum DataSourceEnvironment {
  production = 'production',
  development = 'development',
}
