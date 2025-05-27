import { resolve } from 'node:path';
import { config } from 'dotenv';
import { test } from 'vitest';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

/**
 * Test environment configuration
 */
export const testConfig = {
  // Snowflake
  snowflake: {
    account_id: process.env.TEST_SNOWFLAKE_ACCOUNT_ID,
    warehouse_id: process.env.TEST_SNOWFLAKE_WAREHOUSE_ID,
    username: process.env.TEST_SNOWFLAKE_USERNAME,
    password: process.env.TEST_SNOWFLAKE_PASSWORD,
    default_database: process.env.TEST_SNOWFLAKE_DATABASE,
    default_schema: process.env.TEST_SNOWFLAKE_SCHEMA,
    role: process.env.TEST_SNOWFLAKE_ROLE,
  },

  // BigQuery
  bigquery: {
    project_id: process.env.TEST_BIGQUERY_PROJECT_ID,
    service_account_key: process.env.TEST_BIGQUERY_SERVICE_ACCOUNT_KEY,
    key_file_path: process.env.TEST_BIGQUERY_KEY_FILE_PATH,
    default_dataset: process.env.TEST_BIGQUERY_DATASET,
    location: process.env.TEST_BIGQUERY_LOCATION,
  },

  // PostgreSQL
  postgresql: {
    host: process.env.TEST_POSTGRES_HOST || 'localhost',
    port: Number.parseInt(process.env.TEST_POSTGRES_PORT || '5432'),
    database: process.env.TEST_POSTGRES_DATABASE,
    username: process.env.TEST_POSTGRES_USERNAME,
    password: process.env.TEST_POSTGRES_PASSWORD,
    schema: process.env.TEST_POSTGRES_SCHEMA,
    ssl: process.env.TEST_POSTGRES_SSL === 'true',
  },

  // MySQL
  mysql: {
    host: process.env.TEST_MYSQL_HOST || 'localhost',
    port: Number.parseInt(process.env.TEST_MYSQL_PORT || '3306'),
    database: process.env.TEST_MYSQL_DATABASE,
    username: process.env.TEST_MYSQL_USERNAME,
    password: process.env.TEST_MYSQL_PASSWORD,
    ssl: process.env.TEST_MYSQL_SSL === 'true',
  },

  // SQL Server
  sqlserver: {
    server: process.env.TEST_SQLSERVER_SERVER,
    port: Number.parseInt(process.env.TEST_SQLSERVER_PORT || '1433'),
    database: process.env.TEST_SQLSERVER_DATABASE,
    username: process.env.TEST_SQLSERVER_USERNAME,
    password: process.env.TEST_SQLSERVER_PASSWORD,
    encrypt: process.env.TEST_SQLSERVER_ENCRYPT !== 'false',
    trust_server_certificate: process.env.TEST_SQLSERVER_TRUST_CERT === 'true',
  },

  // Redshift
  redshift: {
    host: process.env.TEST_REDSHIFT_HOST,
    port: Number.parseInt(process.env.TEST_REDSHIFT_PORT || '5439'),
    database: process.env.TEST_REDSHIFT_DATABASE,
    username: process.env.TEST_REDSHIFT_USERNAME,
    password: process.env.TEST_REDSHIFT_PASSWORD,
    schema: process.env.TEST_REDSHIFT_SCHEMA,
    cluster_identifier: process.env.TEST_REDSHIFT_CLUSTER_ID,
  },

  // Databricks
  databricks: {
    server_hostname: process.env.TEST_DATABRICKS_SERVER_HOSTNAME,
    http_path: process.env.TEST_DATABRICKS_HTTP_PATH,
    access_token: process.env.TEST_DATABRICKS_ACCESS_TOKEN,
    catalog: process.env.TEST_DATABRICKS_CATALOG,
    schema: process.env.TEST_DATABRICKS_SCHEMA,
  },
} as const;

/**
 * Check if credentials are available for a data source
 */
export function hasCredentials(dataSource: keyof typeof testConfig): boolean {
  switch (dataSource) {
    case 'snowflake': {
      const config = testConfig.snowflake;
      return !!(
        config.account_id &&
        config.warehouse_id &&
        config.username &&
        config.password &&
        config.default_database
      );
    }

    case 'bigquery': {
      const config = testConfig.bigquery;
      return !!(config.project_id && (config.service_account_key || config.key_file_path));
    }

    case 'postgresql': {
      const config = testConfig.postgresql;
      return !!(config.host && config.database && config.username && config.password);
    }

    case 'mysql': {
      const config = testConfig.mysql;
      return !!(config.host && config.database && config.username && config.password);
    }

    case 'sqlserver': {
      const config = testConfig.sqlserver;
      return !!(config.server && config.database && config.username && config.password);
    }

    case 'redshift': {
      const config = testConfig.redshift;
      return !!(config.host && config.database && config.username && config.password);
    }

    case 'databricks': {
      const config = testConfig.databricks;
      return !!(config.server_hostname && config.http_path && config.access_token);
    }

    default:
      return false;
  }
}

/**
 * Skip test if credentials are not available
 */
export function skipIfNoCredentials(dataSource: keyof typeof testConfig) {
  return hasCredentials(dataSource) ? test : test.skip;
}

/**
 * Test timeout for database operations (30 seconds)
 */
export const TEST_TIMEOUT = 30000;
