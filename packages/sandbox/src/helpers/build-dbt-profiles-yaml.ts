import {
  type BigQueryCredentials,
  type Credentials,
  DataSourceType,
  type SnowflakeCredentials,
} from '@buster/database/schema-types';
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

interface MotherDuckOutput {
  type: 'duckdb';
  path: string;
  threads: number;
  extensions?: string[];
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
  | MySqlOutput
  | MotherDuckOutput {
  if (creds.type === DataSourceType.PostgreSQL) {
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
  }

  if (creds.type === DataSourceType.Snowflake) {
    return {
      type: 'snowflake',
      account: creds.account_id,
      user: creds.username,
      // Include auth-specific fields based on auth_method
      ...(creds.auth_method === 'password' ? { password: creds.password } : {}),
      ...(creds.auth_method === 'key_pair' ? { private_key_path: creds.private_key } : {}),
      role: creds.role ?? 'PUBLIC',
      database: creds.default_database ?? '',
      warehouse: creds.warehouse_id ?? '',
      schema: creds.default_schema ?? 'PUBLIC',
      threads: 4,
      client_session_keep_alive: false,
    };
  }

  if (creds.type === DataSourceType.BigQuery) {
    return {
      type: 'bigquery',
      method: 'service-account',
      project: creds.project_id,
      dataset: creds.default_dataset ?? 'default',
      // Keyfile will be set to a path by buildProfilesYaml when key content is provided
      keyfile:
        creds.key_file_path ??
        (typeof creds.service_account_key === 'string'
          ? creds.service_account_key
          : JSON.stringify(creds.service_account_key)),
      threads: 4,
    };
  }

  if (creds.type === DataSourceType.Redshift) {
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
  }

  if (creds.type === DataSourceType.SQLServer) {
    return {
      type: 'sqlserver',
      server: creds.host,
      port: creds.port ?? 1433,
      user: creds.username,
      password: creds.password,
      database: creds.default_database,
      encrypt: creds.encrypt ?? true,
      trust_cert: creds.trust_server_certificate ?? true,
      threads: 4,
    };
  }

  if (creds.type === DataSourceType.MySQL) {
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
  }

  if (creds.type === DataSourceType.MotherDuck) {
    // MotherDuck connection string format: md:database?motherduck_token=token
    const path = `md:${creds.default_database}?motherduck_token=${creds.token}`;

    return {
      type: 'duckdb',
      path,
      threads: 4,
      extensions: ['httpfs', 'parquet'],
    };
  }

  // Exhaustive check - TypeScript will error if we add a new type and forget to handle it
  const _exhaustiveCheck: never = creds;
  throw new Error(`Unsupported data source type: ${JSON.stringify(_exhaustiveCheck)}`);
}

/**
 * Key file that needs to be written to the sandbox filesystem
 */
export interface KeyFile {
  path: string;
  content: string;
  permissions?: string; // Unix file permissions (e.g., '600' for private keys)
}

/**
 * Result from building profiles YAML with any necessary key files
 */
export interface BuildProfilesYamlResult {
  yaml: string;
  keyFiles: KeyFile[];
}

/**
 * Result from extracting key files - includes both the key file to write and updated output
 */
interface KeyFileExtractionResult<T> {
  keyFile?: KeyFile;
  updatedOutput: T;
}

/**
 * Extract Snowflake private key and update output to reference file path
 */
function extractSnowflakeKeyFile(
  creds: SnowflakeCredentials,
  output: SnowflakeOutput,
  keysBasePath: string
): KeyFileExtractionResult<SnowflakeOutput> {
  // Only extract key file for key-pair authentication
  if (creds.auth_method !== 'key_pair' || !creds.private_key) {
    return { updatedOutput: output };
  }

  const keyPath = `${keysBasePath}/snowflake_private.key`;

  return {
    keyFile: {
      path: keyPath,
      content: creds.private_key,
      permissions: '600',
    },
    updatedOutput: {
      ...output,
      private_key_path: keyPath,
    },
  };
}

/**
 * Extract BigQuery service account key and update output to reference file path
 */
function extractBigQueryKeyFile(
  creds: BigQueryCredentials,
  output: BigQueryOutput,
  keysBasePath: string
): KeyFileExtractionResult<BigQueryOutput> {
  // If key_file_path is already provided, use it
  if (creds.key_file_path) {
    return {
      updatedOutput: {
        ...output,
        keyfile: creds.key_file_path,
      },
    };
  }

  // If no service account key content, return as-is
  if (!creds.service_account_key) {
    return { updatedOutput: output };
  }

  const keyPath = `${keysBasePath}/bigquery_service_account.json`;
  const keyContent =
    typeof creds.service_account_key === 'string'
      ? creds.service_account_key
      : JSON.stringify(creds.service_account_key, null, 2);

  return {
    keyFile: {
      path: keyPath,
      content: keyContent,
      permissions: '600',
    },
    updatedOutput: {
      ...output,
      keyfile: keyPath,
    },
  };
}

/**
 * Extract key files for any data source type and update the output accordingly
 */
function extractKeyFiles(
  creds: Credentials,
  output:
    | PostgresOutput
    | SnowflakeOutput
    | BigQueryOutput
    | RedshiftOutput
    | SqlServerOutput
    | MySqlOutput
    | MotherDuckOutput,
  keysBasePath: string
): KeyFileExtractionResult<typeof output> {
  // Handle Snowflake key-pair authentication
  if (creds.type === DataSourceType.Snowflake) {
    return extractSnowflakeKeyFile(creds, output as SnowflakeOutput, keysBasePath);
  }

  // Handle BigQuery service account key
  if (creds.type === DataSourceType.BigQuery) {
    return extractBigQueryKeyFile(creds, output as BigQueryOutput, keysBasePath);
  }

  // Other data sources don't require key files
  if (
    creds.type === DataSourceType.PostgreSQL ||
    creds.type === DataSourceType.MySQL ||
    creds.type === DataSourceType.SQLServer ||
    creds.type === DataSourceType.Redshift ||
    creds.type === DataSourceType.MotherDuck
  ) {
    return { updatedOutput: output };
  }

  // Exhaustive check - TypeScript will error if we add a new type and forget to handle it
  const _exhaustiveCheck: never = creds;
  return { updatedOutput: output };
}

/** buildProfilesYaml: returns YAML string and array of key files that need to be written */
export function buildProfilesYaml(args: {
  profileName: string; // must match dbt_project.yml 'profile'
  target: string;
  creds: Credentials;
  keysBasePath?: string; // base path for key files (default: '/workspace/.keys')
}): BuildProfilesYamlResult {
  const { profileName, target, creds, keysBasePath = '/workspace/.keys' } = args;

  // Build the base output configuration
  const baseOutput = buildOutput(creds);

  // Extract any necessary key files and get updated output
  const { keyFile, updatedOutput } = extractKeyFiles(creds, baseOutput, keysBasePath);

  // Collect key files
  const keyFiles: KeyFile[] = keyFile ? [keyFile] : [];

  // Build the profiles YAML structure
  const root = {
    [profileName]: {
      target,
      outputs: {
        [target]: updatedOutput,
      },
    },
  };

  return {
    yaml: yamlDump(root, { noRefs: true, lineWidth: 120 }),
    keyFiles,
  };
}
