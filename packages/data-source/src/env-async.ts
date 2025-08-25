import { getSecret } from '@buster/secrets';

// Async environment variables for data source testing
// These are only required when actually running tests for specific database types

export async function getTestEnv() {
  const [
    // PostgreSQL
    TEST_POSTGRES_HOST,
    TEST_POSTGRES_DATABASE,
    TEST_POSTGRES_USERNAME,
    TEST_POSTGRES_PASSWORD,
    // MySQL
    TEST_MYSQL_HOST,
    TEST_MYSQL_DATABASE,
    TEST_MYSQL_USERNAME,
    TEST_MYSQL_PASSWORD,
    // Snowflake
    TEST_SNOWFLAKE_ACCOUNT_ID,
    TEST_SNOWFLAKE_WAREHOUSE_ID,
    TEST_SNOWFLAKE_USERNAME,
    TEST_SNOWFLAKE_PASSWORD,
    TEST_SNOWFLAKE_DATABASE,
    // BigQuery
    TEST_BIGQUERY_PROJECT_ID,
    TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
    // SQL Server
    TEST_SQLSERVER_SERVER,
    TEST_SQLSERVER_DATABASE,
    TEST_SQLSERVER_USERNAME,
    TEST_SQLSERVER_PASSWORD,
    // Redshift
    TEST_REDSHIFT_HOST,
    TEST_REDSHIFT_DATABASE,
    TEST_REDSHIFT_USERNAME,
    TEST_REDSHIFT_PASSWORD,
    // Databricks
    TEST_DATABRICKS_SERVER_HOSTNAME,
    TEST_DATABRICKS_HTTP_PATH,
    TEST_DATABRICKS_ACCESS_TOKEN,
    // Node env
    NODE_ENV,
  ] = await Promise.all([
    // PostgreSQL
    getSecret('TEST_POSTGRES_HOST').catch(() => undefined),
    getSecret('TEST_POSTGRES_DATABASE').catch(() => undefined),
    getSecret('TEST_POSTGRES_USERNAME').catch(() => undefined),
    getSecret('TEST_POSTGRES_PASSWORD').catch(() => undefined),
    // MySQL
    getSecret('TEST_MYSQL_HOST').catch(() => undefined),
    getSecret('TEST_MYSQL_DATABASE').catch(() => undefined),
    getSecret('TEST_MYSQL_USERNAME').catch(() => undefined),
    getSecret('TEST_MYSQL_PASSWORD').catch(() => undefined),
    // Snowflake
    getSecret('TEST_SNOWFLAKE_ACCOUNT_ID').catch(() => undefined),
    getSecret('TEST_SNOWFLAKE_WAREHOUSE_ID').catch(() => undefined),
    getSecret('TEST_SNOWFLAKE_USERNAME').catch(() => undefined),
    getSecret('TEST_SNOWFLAKE_PASSWORD').catch(() => undefined),
    getSecret('TEST_SNOWFLAKE_DATABASE').catch(() => undefined),
    // BigQuery
    getSecret('TEST_BIGQUERY_PROJECT_ID').catch(() => undefined),
    getSecret('TEST_BIGQUERY_SERVICE_ACCOUNT_KEY').catch(() => undefined),
    // SQL Server
    getSecret('TEST_SQLSERVER_SERVER').catch(() => undefined),
    getSecret('TEST_SQLSERVER_DATABASE').catch(() => undefined),
    getSecret('TEST_SQLSERVER_USERNAME').catch(() => undefined),
    getSecret('TEST_SQLSERVER_PASSWORD').catch(() => undefined),
    // Redshift
    getSecret('TEST_REDSHIFT_HOST').catch(() => undefined),
    getSecret('TEST_REDSHIFT_DATABASE').catch(() => undefined),
    getSecret('TEST_REDSHIFT_USERNAME').catch(() => undefined),
    getSecret('TEST_REDSHIFT_PASSWORD').catch(() => undefined),
    // Databricks
    getSecret('TEST_DATABRICKS_SERVER_HOSTNAME').catch(() => undefined),
    getSecret('TEST_DATABRICKS_HTTP_PATH').catch(() => undefined),
    getSecret('TEST_DATABRICKS_ACCESS_TOKEN').catch(() => undefined),
    // Node env
    getSecret('NODE_ENV').catch(() => 'development'),
  ]);

  return {
    // PostgreSQL
    TEST_POSTGRES_HOST,
    TEST_POSTGRES_DATABASE,
    TEST_POSTGRES_USERNAME,
    TEST_POSTGRES_PASSWORD,
    // MySQL
    TEST_MYSQL_HOST,
    TEST_MYSQL_DATABASE,
    TEST_MYSQL_USERNAME,
    TEST_MYSQL_PASSWORD,
    // Snowflake
    TEST_SNOWFLAKE_ACCOUNT_ID,
    TEST_SNOWFLAKE_WAREHOUSE_ID,
    TEST_SNOWFLAKE_USERNAME,
    TEST_SNOWFLAKE_PASSWORD,
    TEST_SNOWFLAKE_DATABASE,
    // BigQuery
    TEST_BIGQUERY_PROJECT_ID,
    TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
    // SQL Server
    TEST_SQLSERVER_SERVER,
    TEST_SQLSERVER_DATABASE,
    TEST_SQLSERVER_USERNAME,
    TEST_SQLSERVER_PASSWORD,
    // Redshift
    TEST_REDSHIFT_HOST,
    TEST_REDSHIFT_DATABASE,
    TEST_REDSHIFT_USERNAME,
    TEST_REDSHIFT_PASSWORD,
    // Databricks
    TEST_DATABRICKS_SERVER_HOSTNAME,
    TEST_DATABRICKS_HTTP_PATH,
    TEST_DATABRICKS_ACCESS_TOKEN,
    // Node env
    NODE_ENV: NODE_ENV || 'development',
  } as const;
}

// Helper function to validate specific database connection requirements
export async function validateDatabaseEnvAsync(
  dbType: 'postgres' | 'mysql' | 'snowflake' | 'bigquery' | 'sqlserver' | 'redshift' | 'databricks'
) {
  const env = await getTestEnv();
  
  switch (dbType) {
    case 'postgres':
      if (
        !env.TEST_POSTGRES_HOST ||
        !env.TEST_POSTGRES_DATABASE ||
        !env.TEST_POSTGRES_USERNAME ||
        !env.TEST_POSTGRES_PASSWORD
      ) {
        throw new Error('PostgreSQL test environment variables are not fully configured');
      }
      break;
    case 'mysql':
      if (
        !env.TEST_MYSQL_HOST ||
        !env.TEST_MYSQL_DATABASE ||
        !env.TEST_MYSQL_USERNAME ||
        !env.TEST_MYSQL_PASSWORD
      ) {
        throw new Error('MySQL test environment variables are not fully configured');
      }
      break;
    case 'snowflake':
      if (
        !env.TEST_SNOWFLAKE_ACCOUNT_ID ||
        !env.TEST_SNOWFLAKE_USERNAME ||
        !env.TEST_SNOWFLAKE_PASSWORD
      ) {
        throw new Error('Snowflake test environment variables are not fully configured');
      }
      break;
    case 'bigquery':
      if (!env.TEST_BIGQUERY_PROJECT_ID || !env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY) {
        throw new Error('BigQuery test environment variables are not fully configured');
      }
      break;
    case 'sqlserver':
      if (
        !env.TEST_SQLSERVER_SERVER ||
        !env.TEST_SQLSERVER_DATABASE ||
        !env.TEST_SQLSERVER_USERNAME ||
        !env.TEST_SQLSERVER_PASSWORD
      ) {
        throw new Error('SQL Server test environment variables are not fully configured');
      }
      break;
    case 'redshift':
      if (
        !env.TEST_REDSHIFT_HOST ||
        !env.TEST_REDSHIFT_DATABASE ||
        !env.TEST_REDSHIFT_USERNAME ||
        !env.TEST_REDSHIFT_PASSWORD
      ) {
        throw new Error('Redshift test environment variables are not fully configured');
      }
      break;
    case 'databricks':
      if (
        !env.TEST_DATABRICKS_SERVER_HOSTNAME ||
        !env.TEST_DATABRICKS_HTTP_PATH ||
        !env.TEST_DATABRICKS_ACCESS_TOKEN
      ) {
        throw new Error('Databricks test environment variables are not fully configured');
      }
      break;
  }
}