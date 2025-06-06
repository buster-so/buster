import { z } from 'zod/v4-mini';

export enum DataSourceStatus {
  ACTIVE = 'active',
  SYNCING = 'syncing',
  FAILED = 'failed',
  PAUSED = 'paused'
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
  athena = 'athena',
  other = 'other'
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
  DataSourceTypes.snowflake
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
  [DataSourceTypes.athena]: 'Athena',
  [DataSourceTypes.other]: 'Other'
};

export enum DataSourceTenetTypes {
  single = 'single',
  multi = 'multi'
}

export enum DataSourceEnvironment {
  production = 'production',
  development = 'development'
}

export const PostgresCredentialsSchema = z.object({
  name: z.string().check(z.minLength(3, 'Name must be at least 3 characters')),
  type: z.union([z.literal('postgres'), z.literal('supabase')]),
  host: z.string().check(z.minLength(1, 'Host must not be empty')),
  port: z
    .number()
    .check(
      z.gte(1, 'Port must be greater than 0'),
      z.lte(65535, 'Port must be less than or equal to 65535')
    ),
  username: z.string().check(z.minLength(1, 'Username must not be empty')),
  password: z.string().check(z.minLength(1, 'Password must not be empty')),
  default_database: z.string().check(z.minLength(1, 'Database must not be empty')), // postgres
  default_schema: z.string().check(z.minLength(1, 'Schema must not be empty')) // public
});

export type PostgresCredentials = z.infer<typeof PostgresCredentialsSchema>;

export const MySQLCredentialsSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name must not be empty')),
  type: z.union([z.literal('mysql'), z.literal('mariadb')]),
  host: z.string().check(z.minLength(1, 'Host must not be empty')),
  port: z
    .number()
    .check(
      z.gte(1, 'Port must be greater than 0'),
      z.lte(65535, 'Port must be less than or equal to 65535')
    ),
  username: z.string().check(z.minLength(1, 'Username must not be empty')),
  password: z.string().check(z.minLength(1, 'Password must not be empty')),
  default_database: z.string().check(z.minLength(1, 'Database must not be empty'))
});

export type MySQLCredentials = z.infer<typeof MySQLCredentialsSchema>;

export const BigQueryCredentialsSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name must not be empty')),
  type: z.literal('bigquery'),
  service_role_key: z.string().check(z.minLength(1, 'Service role key must not be empty')),
  default_project_id: z.string().check(z.minLength(1, 'Project ID must not be empty')),
  default_dataset_id: z.string().check(z.minLength(1, 'Dataset ID must not be empty'))
});

export type BigQueryCredentials = z.infer<typeof BigQueryCredentialsSchema>;

export const RedshiftCredentialsSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name must not be empty')),
  type: z.literal('redshift'),
  host: z.string().check(z.minLength(1, 'Host must not be empty')),
  port: z
    .number()
    .check(
      z.gte(1, 'Port must be greater than 0'),
      z.lte(65535, 'Port must be less than or equal to 65535')
    ),
  username: z.string().check(z.minLength(1, 'Username must not be empty')),
  password: z.string().check(z.minLength(1, 'Password must not be empty')),
  default_database: z.string().check(z.minLength(1, 'Database must not be empty')),
  default_schema: z.string().check(z.minLength(1, 'Schema must not be empty'))
});

export type RedshiftCredentials = z.infer<typeof RedshiftCredentialsSchema>;

export const SnowflakeCredentialsSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name must not be empty')),
  type: z.literal('snowflake'),
  account_id: z.string().check(z.minLength(1, 'Account ID must not be empty')),
  warehouse_id: z.string().check(z.minLength(1, 'Warehouse ID must not be empty')),
  username: z.string().check(z.minLength(1, 'Username must not be empty')),
  password: z.string().check(z.minLength(1, 'Password must not be empty')),
  role: z.nullable(z.string()),
  default_database: z.string().check(z.minLength(1, 'Database must not be empty')),
  default_schema: z.string().check(
    z.minLength(1, 'Schema must not be empty'),
    z.toUpperCase(),
    z.refine((val) => val === val.toUpperCase(), 'Must be all uppercase')
  )
});

export type SnowflakeCredentials = z.infer<typeof SnowflakeCredentialsSchema>;

export const DatabricksCredentialsSchema = z.object({
  name: z.string(),
  type: z.literal('databricks'),
  host: z.string(),
  api_key: z.string().check(z.refine((val) => val.length > 0, 'API key is required')),
  warehouse_id: z.string().check(z.refine((val) => val.length > 0, 'Warehouse ID is required')),
  default_catalog: z.string(),
  default_schema: z.string()
});

export type DatabricksCredentials = z.infer<typeof DatabricksCredentialsSchema>;

export const SQLServerCredentialsSchema = z.object({
  name: z.string().check(z.minLength(1, 'Name must not be empty')),
  type: z.literal('sqlserver'),
  host: z.string().check(z.minLength(1, 'Host must not be empty')),
  port: z
    .number()
    .check(
      z.gte(1, 'Port must be greater than 0'),
      z.lte(65535, 'Port must be less than or equal to 65535')
    ),
  username: z.string().check(z.minLength(1, 'Username must not be empty')),
  password: z.string().check(z.minLength(1, 'Password must not be empty')),
  default_database: z.string().check(z.minLength(1, 'Database must not be empty')),
  default_schema: z.string().check(z.minLength(1, 'Schema must not be empty'))
});

export type SQLServerCredentials = z.infer<typeof SQLServerCredentialsSchema>;

export const DataSetSchema = z.object({
  id: z.string().check(z.refine((val) => val.length > 0, 'Dataset ID is required')),
  name: z.string().check(z.refine((val) => val.length > 0, 'Dataset name is required'))
});

export const CreatedBySchema = z.object({
  email: z.string().check(z.refine((val) => val.length > 0, 'Email is required')),
  id: z.string().check(z.refine((val) => val.length > 0, 'User ID is required')),
  name: z.string().check(z.refine((val) => val.length > 0, 'User name is required'))
});

export const DataSourceSchema = z.object({
  created_at: z.string(),
  created_by: CreatedBySchema,
  credentials: z.union([
    z.omit(PostgresCredentialsSchema, { name: true }),
    z.omit(MySQLCredentialsSchema, { name: true }),
    z.omit(BigQueryCredentialsSchema, { name: true }),
    z.omit(RedshiftCredentialsSchema, { name: true }),
    z.omit(SnowflakeCredentialsSchema, { name: true }),
    z.omit(DatabricksCredentialsSchema, { name: true }),
    z.omit(SQLServerCredentialsSchema, { name: true })
  ]),
  data_sets: z.array(DataSetSchema),
  id: z.string().check(z.refine((val) => val.length > 0, 'Data source ID is required')),
  name: z.string().check(z.refine((val) => val.length > 0, 'Data source name is required')),
  type: z.enum(DataSourceTypes),
  updated_at: z.string()
});

export type DataSource = z.infer<typeof DataSourceSchema>;

export interface DataSourceListItem {
  name: string;
  id: string;
  type: DataSourceTypes;
  updated_at: string;
}
