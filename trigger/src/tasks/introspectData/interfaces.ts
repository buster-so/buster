import type {
  BigQueryCredentials,
  DatabricksCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SQLServerCredentials,
  SnowflakeCredentials,
} from '../../../../packages/data-source/src/types/credentials';

export interface IntrospectDataInput {
  dataSourceName: string;
  credentials:
    | SnowflakeCredentials
    | PostgreSQLCredentials
    | MySQLCredentials
    | BigQueryCredentials
    | SQLServerCredentials
    | RedshiftCredentials
    | DatabricksCredentials;
  options?: {
    databases?: string[];
    schemas?: string[];
    tables?: string[];
  };
}

export interface IntrospectDataOutput {
  success: boolean;
  dataSourceName: string;
  error?: string;
}
