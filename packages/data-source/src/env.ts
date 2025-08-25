import { DATA_SOURCE_KEYS, SHARED_KEYS, getSecret } from '@buster/secrets';

// Optional environment variables for data source testing
// These are only required when actually running tests for specific database types

// Helper to safely get optional secrets
async function getOptionalSecret(key: string): Promise<string | undefined> {
  try {
    return await getSecret(key);
  } catch {
    return undefined;
  }
}

// Environment variable type
export type DataSourceEnv = {
  // PostgreSQL
  TEST_POSTGRES_HOST: string | undefined;
  TEST_POSTGRES_DATABASE: string | undefined;
  TEST_POSTGRES_USERNAME: string | undefined;
  TEST_POSTGRES_PASSWORD: string | undefined;
  TEST_POSTGRES_PORT: string | undefined;
  TEST_POSTGRES_SSL: string | undefined;

  // MySQL
  TEST_MYSQL_HOST: string | undefined;
  TEST_MYSQL_DATABASE: string | undefined;
  TEST_MYSQL_USERNAME: string | undefined;
  TEST_MYSQL_PASSWORD: string | undefined;

  // Snowflake
  TEST_SNOWFLAKE_ACCOUNT_ID: string | undefined;
  TEST_SNOWFLAKE_WAREHOUSE_ID: string | undefined;
  TEST_SNOWFLAKE_USERNAME: string | undefined;
  TEST_SNOWFLAKE_PASSWORD: string | undefined;
  TEST_SNOWFLAKE_DATABASE: string | undefined;

  // BigQuery
  TEST_BIGQUERY_PROJECT_ID: string | undefined;
  TEST_BIGQUERY_SERVICE_ACCOUNT_KEY: string | undefined;

  // SQL Server
  TEST_SQLSERVER_SERVER: string | undefined;
  TEST_SQLSERVER_DATABASE: string | undefined;
  TEST_SQLSERVER_USERNAME: string | undefined;
  TEST_SQLSERVER_PASSWORD: string | undefined;

  // Redshift
  TEST_REDSHIFT_HOST: string | undefined;
  TEST_REDSHIFT_DATABASE: string | undefined;
  TEST_REDSHIFT_USERNAME: string | undefined;
  TEST_REDSHIFT_PASSWORD: string | undefined;

  // Databricks
  TEST_DATABRICKS_SERVER_HOSTNAME: string | undefined;
  TEST_DATABRICKS_HTTP_PATH: string | undefined;
  TEST_DATABRICKS_ACCESS_TOKEN: string | undefined;

  NODE_ENV: string;
};

// Async function to load environment variables
export async function loadEnv(): Promise<DataSourceEnv> {
  return {
    // PostgreSQL
    TEST_POSTGRES_HOST: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_HOST),
    TEST_POSTGRES_DATABASE: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_DATABASE),
    TEST_POSTGRES_USERNAME: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_USERNAME),
    TEST_POSTGRES_PASSWORD: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_PASSWORD),
    TEST_POSTGRES_PORT: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_PORT),
    TEST_POSTGRES_SSL: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_POSTGRES_SSL),

    // MySQL
    TEST_MYSQL_HOST: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_MYSQL_HOST),
    TEST_MYSQL_DATABASE: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_MYSQL_DATABASE),
    TEST_MYSQL_USERNAME: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_MYSQL_USERNAME),
    TEST_MYSQL_PASSWORD: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_MYSQL_PASSWORD),

    // Snowflake
    TEST_SNOWFLAKE_ACCOUNT_ID: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SNOWFLAKE_ACCOUNT_ID),
    TEST_SNOWFLAKE_WAREHOUSE_ID: await getOptionalSecret(
      DATA_SOURCE_KEYS.TEST_SNOWFLAKE_WAREHOUSE_ID
    ),
    TEST_SNOWFLAKE_USERNAME: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SNOWFLAKE_USERNAME),
    TEST_SNOWFLAKE_PASSWORD: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SNOWFLAKE_PASSWORD),
    TEST_SNOWFLAKE_DATABASE: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SNOWFLAKE_DATABASE),

    // BigQuery
    TEST_BIGQUERY_PROJECT_ID: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_BIGQUERY_PROJECT_ID),
    TEST_BIGQUERY_SERVICE_ACCOUNT_KEY: await getOptionalSecret(
      DATA_SOURCE_KEYS.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY
    ),

    // SQL Server
    TEST_SQLSERVER_SERVER: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SQLSERVER_SERVER),
    TEST_SQLSERVER_DATABASE: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SQLSERVER_DATABASE),
    TEST_SQLSERVER_USERNAME: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SQLSERVER_USERNAME),
    TEST_SQLSERVER_PASSWORD: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_SQLSERVER_PASSWORD),

    // Redshift
    TEST_REDSHIFT_HOST: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_REDSHIFT_HOST),
    TEST_REDSHIFT_DATABASE: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_REDSHIFT_DATABASE),
    TEST_REDSHIFT_USERNAME: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_REDSHIFT_USERNAME),
    TEST_REDSHIFT_PASSWORD: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_REDSHIFT_PASSWORD),

    // Databricks
    TEST_DATABRICKS_SERVER_HOSTNAME: await getOptionalSecret(
      DATA_SOURCE_KEYS.TEST_DATABRICKS_SERVER_HOSTNAME
    ),
    TEST_DATABRICKS_HTTP_PATH: await getOptionalSecret(DATA_SOURCE_KEYS.TEST_DATABRICKS_HTTP_PATH),
    TEST_DATABRICKS_ACCESS_TOKEN: await getOptionalSecret(
      DATA_SOURCE_KEYS.TEST_DATABRICKS_ACCESS_TOKEN
    ),

    NODE_ENV: (await getOptionalSecret(SHARED_KEYS.NODE_ENV)) || 'development',
  };
}

// Backwards compatibility: export a promise of the env object
export const env = loadEnv();

// Helper function to validate specific database connection requirements
export async function validateDatabaseEnv(
  dbType: 'postgres' | 'mysql' | 'snowflake' | 'bigquery' | 'sqlserver' | 'redshift' | 'databricks'
): Promise<void> {
  const envVars = await loadEnv();

  switch (dbType) {
    case 'postgres':
      if (
        !envVars.TEST_POSTGRES_HOST ||
        !envVars.TEST_POSTGRES_DATABASE ||
        !envVars.TEST_POSTGRES_USERNAME ||
        !envVars.TEST_POSTGRES_PASSWORD
      ) {
        throw new Error('PostgreSQL test environment variables are not fully configured');
      }
      break;
    case 'mysql':
      if (
        !envVars.TEST_MYSQL_HOST ||
        !envVars.TEST_MYSQL_DATABASE ||
        !envVars.TEST_MYSQL_USERNAME ||
        !envVars.TEST_MYSQL_PASSWORD
      ) {
        throw new Error('MySQL test environment variables are not fully configured');
      }
      break;
    case 'snowflake':
      if (
        !envVars.TEST_SNOWFLAKE_ACCOUNT_ID ||
        !envVars.TEST_SNOWFLAKE_USERNAME ||
        !envVars.TEST_SNOWFLAKE_PASSWORD
      ) {
        throw new Error('Snowflake test environment variables are not fully configured');
      }
      break;
    case 'bigquery':
      if (!envVars.TEST_BIGQUERY_PROJECT_ID || !envVars.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY) {
        throw new Error('BigQuery test environment variables are not fully configured');
      }
      break;
    case 'sqlserver':
      if (
        !envVars.TEST_SQLSERVER_SERVER ||
        !envVars.TEST_SQLSERVER_DATABASE ||
        !envVars.TEST_SQLSERVER_USERNAME ||
        !envVars.TEST_SQLSERVER_PASSWORD
      ) {
        throw new Error('SQL Server test environment variables are not fully configured');
      }
      break;
    case 'redshift':
      if (
        !envVars.TEST_REDSHIFT_HOST ||
        !envVars.TEST_REDSHIFT_DATABASE ||
        !envVars.TEST_REDSHIFT_USERNAME ||
        !envVars.TEST_REDSHIFT_PASSWORD
      ) {
        throw new Error('Redshift test environment variables are not fully configured');
      }
      break;
    case 'databricks':
      if (
        !envVars.TEST_DATABRICKS_SERVER_HOSTNAME ||
        !envVars.TEST_DATABRICKS_HTTP_PATH ||
        !envVars.TEST_DATABRICKS_ACCESS_TOKEN
      ) {
        throw new Error('Databricks test environment variables are not fully configured');
      }
      break;
  }
}
