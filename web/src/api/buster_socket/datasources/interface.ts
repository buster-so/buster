import { StringColorFormat } from '@faker-js/faker';

export interface PostgresCreateCredentials {
  datasource_name: string;
  host: string;
  port: string | number;
  username: string;
  password: string;
  database?: null | string;
  jump_host?: null | string; // optional
  ssh_username?: null | string; // optional
  ssh_private_key?: null | string; // optional
  schemas?: string[]; // optional array of schemas if null, will pull all schemas i.e. ["public", "analytics"]
}

export interface MySqlCreateCredentials {
  datasource_name: string;
  host: string;
  port: string | number;
  username: string;
  password: string;
  jump_host: null | string; // optional
  ssh_username: null | string; // optional
  ssh_private_key: null | string; // optional
  schemas: string[];
}

export interface BigQueryCreateCredentials {
  datasource_name: string;
  credentials_json: {
    type: 'service_account';
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
    universe_domain: string;
  };
  project_id: string;
  dataset_ids: string[];
}

export interface RedshiftCreateCredentials {
  datasource_name: string;
  host: string;
  port: string | number;
  username: string;
  password: string;
  database: string;
  schemas: string[];
}

export interface SnowflakeCreateCredentials {
  datasource_name: string;
  account_id: string;
  warehouse_id: string;
  database_id: string;
  user_name: string;
  password: string;
  role: null | string;
  schemas: string[];
}

export interface SqlServerCreateCredentials {
  datasource_name: string;
  port: string | number;
  host: string;
  username: string;
  password: string;
  database: string;
  jump_host: string;
  ssh_username: string;
  ssh_private_key: string;
  schemas: string[];
}

export interface DatabricksCreateCredentials {
  datasource_name: string;
  host: string;
  api_key: string;
  warehouse_id: string;
  catalog_name: string;
  schemas: string[];
}

export type DatasourceCreateCredentials =
  | PostgresCreateCredentials
  | MySqlCreateCredentials
  | BigQueryCreateCredentials
  | RedshiftCreateCredentials
  | SnowflakeCreateCredentials
  | SqlServerCreateCredentials
  | DatabricksCreateCredentials;
