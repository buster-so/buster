declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // PostgreSQL
      TEST_POSTGRES_HOST?: string;
      TEST_POSTGRES_DATABASE?: string;
      TEST_POSTGRES_USERNAME?: string;
      TEST_POSTGRES_PASSWORD?: string;

      // MySQL
      TEST_MYSQL_HOST?: string;
      TEST_MYSQL_DATABASE?: string;
      TEST_MYSQL_USERNAME?: string;
      TEST_MYSQL_PASSWORD?: string;

      // Snowflake
      TEST_SNOWFLAKE_ACCOUNT_ID?: string;
      TEST_SNOWFLAKE_WAREHOUSE_ID?: string;
      TEST_SNOWFLAKE_USERNAME?: string;
      TEST_SNOWFLAKE_PASSWORD?: string;
      TEST_SNOWFLAKE_DATABASE?: string;

      // BigQuery
      TEST_BIGQUERY_PROJECT_ID?: string;
      TEST_BIGQUERY_SERVICE_ACCOUNT_KEY?: string;

      // SQL Server
      TEST_SQLSERVER_SERVER?: string;
      TEST_SQLSERVER_DATABASE?: string;
      TEST_SQLSERVER_USERNAME?: string;
      TEST_SQLSERVER_PASSWORD?: string;

      // Redshift
      TEST_REDSHIFT_HOST?: string;
      TEST_REDSHIFT_DATABASE?: string;
      TEST_REDSHIFT_USERNAME?: string;
      TEST_REDSHIFT_PASSWORD?: string;

      // Databricks
      TEST_DATABRICKS_SERVER_HOSTNAME?: string;
      TEST_DATABRICKS_HTTP_PATH?: string;
      TEST_DATABRICKS_ACCESS_TOKEN?: string;

      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
