import type { Credentials } from '@buster/data-source';
import { DataSourceType } from '@buster/data-source';
import { dump as yamlDump } from 'js-yaml';

// Outputs (exact dbt "outputs" object per adapter)
interface PostgresOutput {
  type: 'postgres';
  host: string;
  user: string;
  password: string;
  port: number;
  dbname: string;
  schema: string;
  threads: number;
}

interface SnowflakeOutput {
  type: 'snowflake';
  account: string;
  user: string;
  // one of password or private_key_path will be present
  password?: string;
  private_key_path?: string;
  role: string;
  database: string;
  warehouse: string;
  schema: string;
  threads: number;
  client_session_keep_alive: boolean;
}

interface BigQueryOutput {
  type: 'bigquery';
  method: 'service-account' | 'oauth';
  project: string;
  dataset: string;
  keyfile: string;
  threads: number;
}

interface RedshiftOutput {
  type: 'redshift';
  host: string;
  user: string;
  password: string;
  port: number;
  dbname: string;
  schema: string;
  sslmode: string;
  threads: number;
}

interface SqlServerOutput {
  type: 'sqlserver';
  driver?: string;
  server: string;
  port: number;
  user: string;
  password: string;
  database: string;
  schema?: string;
  encrypt: boolean;
  trust_cert: boolean;
  threads: number;
}

interface MySqlOutput {
  type: 'mysql';
  server: string;
  user: string;
  password: string;
  port: number;
  database: string;
  schema: string; // ignored by some adapters but safe
  threads: number;
}

/** buildOutput: type-safe conversion from credentials to dbt output format */
export function buildOutput(
  creds: Credentials
):
  | PostgresOutput
  | SnowflakeOutput
  | BigQueryOutput
  | RedshiftOutput
  | SqlServerOutput
  | MySqlOutput {
  switch (creds.type) {
    case DataSourceType.PostgreSQL:
      return {
        type: 'postgres',
        host: creds.host,
        user: creds.username,
        password: creds.password,
        port: creds.port ?? 5432,
        dbname: creds.default_database,
        schema: creds.schema ?? 'public',
        threads: 4,
      };

    case DataSourceType.Snowflake:
      return {
        type: 'snowflake',
        account: creds.account_id,
        user: creds.username,
        ...(creds.password ? { password: creds.password } : {}),
        role: creds.role ?? 'PUBLIC',
        database: creds.default_database,
        warehouse: creds.warehouse_id,
        schema: creds.default_schema ?? 'PUBLIC',
        threads: 4,
        client_session_keep_alive: false,
      };

    case DataSourceType.BigQuery:
      return {
        type: 'bigquery',
        method: 'service-account',
        project: creds.project_id,
        dataset: creds.default_dataset ?? 'default',
        // TODO: Actually create a file with required keyfile
        keyfile:
          creds.key_file_path ??
          (typeof creds.service_account_key === 'string'
            ? creds.service_account_key
            : JSON.stringify(creds.service_account_key)),
        threads: 4,
      };

    case DataSourceType.Redshift:
      return {
        type: 'redshift',
        host: creds.host,
        user: creds.username,
        password: creds.password,
        port: creds.port ?? 5439,
        dbname: creds.default_database,
        schema: creds.default_schema ?? 'public',
        sslmode: 'require',
        threads: 4,
      };

    case DataSourceType.SQLServer:
      return {
        type: 'sqlserver',
        server: creds.server,
        port: creds.port ?? 1433,
        user: creds.username,
        password: creds.password,
        database: creds.default_database,
        encrypt: creds.encrypt ?? true,
        trust_cert: creds.trust_server_certificate ?? true,
        threads: 4,
      };

    case DataSourceType.MySQL:
      return {
        type: 'mysql',
        server: creds.host,
        user: creds.username,
        password: creds.password,
        port: creds.port ?? 3306,
        database: creds.default_database,
        schema: 'public',
        threads: 4,
      };

    default: {
      // Exhaustive check - this should never be reached
      const _exhaustiveCheck: never = creds;
      throw new Error(`Unsupported data source type: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

/** buildProfilesYaml: returns YAML string */
export function buildProfilesYaml(args: {
  profileName: string; // must match dbt_project.yml 'profile'
  target: string;
  creds: Credentials;
}): string {
  const { profileName, target, creds } = args;

  const output = buildOutput(creds);
  const root = {
    [profileName]: {
      target,
      outputs: {
        [target]: output,
      },
    },
  };

  return yamlDump(root, { noRefs: true, lineWidth: 120 });
}
