import { BusterDataset } from '../../datasets';

export enum DataSourceStatus {
  ACTIVE = 'active',
  SYNCING = 'syncing',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export enum DataSourceTypes {
  postgres = 'postgres',
  mysql = 'mysql',
  bigquery = 'bigquery',
  snowflake = 'snowflake',
  redshift = 'redshift',
  mariadb = 'mariadb',
  sqlserver = 'sqlserver',
  databricks = 'databricks',
  supabase = 'supabase',
  athena = 'athena',
  other = 'other'
}

export const SUPPORTED_DATASOURCES = [
  DataSourceTypes.postgres,
  DataSourceTypes.mysql,
  DataSourceTypes.mariadb,
  DataSourceTypes.sqlserver,
  DataSourceTypes.redshift,
  DataSourceTypes.bigquery,
  DataSourceTypes.databricks,
  DataSourceTypes.supabase,
  DataSourceTypes.snowflake
  //DataSourceTypes.athena
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

export interface DataSource {
  created_at: '2024-07-18T21:19:49.721159Z';
  created_by: {
    email: string;
    id: string;
    name: string;
  };
  credentials: {
    database: string;
    host: string;
    jump_host: null | string;
    password: string;
    port: string | number;
    schemas: null | string[];
    ssh_private_key: null;
    ssh_username: null;
    username: string;
    project_id?: string;
    dataset_ids?: string[];
    credentials_json?: string;
  };
  data_sets: BusterDataset[];
  id: string;
  name: string;
  db_type: DataSourceTypes;
  updated_at: '2024-07-18T21:19:49.721160Z';
}

export interface DataSourceListItem {
  name: string;
  id: string;
  type: DataSourceTypes;
  updated_at: string;
}
