import { describe, expect, it } from 'vitest';
import {
  DataSourceType,
  isBigQueryCredentials,
  isDatabricksCredentials,
  isMySQLCredentials,
  isPostgreSQLCredentials,
  isRedshiftCredentials,
  isSQLServerCredentials,
  isSnowflakeCredentials,
} from '../../../src/types/credentials';
import type {
  BigQueryCredentials,
  DatabricksCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SQLServerCredentials,
  SnowflakeCredentials,
} from '../../../src/types/credentials';

describe('Credential Type Guards', () => {
  const snowflakeCredentials: SnowflakeCredentials = {
    type: DataSourceType.Snowflake,
    account_id: 'test-account',
    warehouse_id: 'test-warehouse',
    username: 'test-user',
    password: 'test-pass',
    default_database: 'test-db',
  };

  const bigqueryCredentials: BigQueryCredentials = {
    type: DataSourceType.BigQuery,
    project_id: 'test-project',
    service_account_key: '{"type": "service_account"}',
  };

  const postgresqlCredentials: PostgreSQLCredentials = {
    type: DataSourceType.PostgreSQL,
    host: 'localhost',
    port: 5432,
    database: 'test',
    username: 'user',
    password: 'pass',
  };

  const mysqlCredentials: MySQLCredentials = {
    type: DataSourceType.MySQL,
    host: 'localhost',
    port: 3306,
    database: 'test',
    username: 'user',
    password: 'pass',
  };

  const sqlserverCredentials: SQLServerCredentials = {
    type: DataSourceType.SQLServer,
    server: 'localhost',
    port: 1433,
    database: 'test',
    username: 'user',
    password: 'pass',
  };

  const redshiftCredentials: RedshiftCredentials = {
    type: DataSourceType.Redshift,
    host: 'test-cluster.redshift.amazonaws.com',
    port: 5439,
    database: 'test',
    username: 'user',
    password: 'pass',
  };

  const databricksCredentials: DatabricksCredentials = {
    type: DataSourceType.Databricks,
    server_hostname: 'test.cloud.databricks.com',
    http_path: '/sql/1.0/warehouses/test',
    access_token: 'test-token',
  };

  describe('isSnowflakeCredentials', () => {
    it('should return true for Snowflake credentials', () => {
      expect(isSnowflakeCredentials(snowflakeCredentials)).toBe(true);
    });

    it('should return false for non-Snowflake credentials', () => {
      expect(isSnowflakeCredentials(bigqueryCredentials)).toBe(false);
      expect(isSnowflakeCredentials(postgresqlCredentials)).toBe(false);
      expect(isSnowflakeCredentials(mysqlCredentials)).toBe(false);
      expect(isSnowflakeCredentials(sqlserverCredentials)).toBe(false);
      expect(isSnowflakeCredentials(redshiftCredentials)).toBe(false);
      expect(isSnowflakeCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isBigQueryCredentials', () => {
    it('should return true for BigQuery credentials', () => {
      expect(isBigQueryCredentials(bigqueryCredentials)).toBe(true);
    });

    it('should return false for non-BigQuery credentials', () => {
      expect(isBigQueryCredentials(snowflakeCredentials)).toBe(false);
      expect(isBigQueryCredentials(postgresqlCredentials)).toBe(false);
      expect(isBigQueryCredentials(mysqlCredentials)).toBe(false);
      expect(isBigQueryCredentials(sqlserverCredentials)).toBe(false);
      expect(isBigQueryCredentials(redshiftCredentials)).toBe(false);
      expect(isBigQueryCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isPostgreSQLCredentials', () => {
    it('should return true for PostgreSQL credentials', () => {
      expect(isPostgreSQLCredentials(postgresqlCredentials)).toBe(true);
    });

    it('should return false for non-PostgreSQL credentials', () => {
      expect(isPostgreSQLCredentials(snowflakeCredentials)).toBe(false);
      expect(isPostgreSQLCredentials(bigqueryCredentials)).toBe(false);
      expect(isPostgreSQLCredentials(mysqlCredentials)).toBe(false);
      expect(isPostgreSQLCredentials(sqlserverCredentials)).toBe(false);
      expect(isPostgreSQLCredentials(redshiftCredentials)).toBe(false);
      expect(isPostgreSQLCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isMySQLCredentials', () => {
    it('should return true for MySQL credentials', () => {
      expect(isMySQLCredentials(mysqlCredentials)).toBe(true);
    });

    it('should return false for non-MySQL credentials', () => {
      expect(isMySQLCredentials(snowflakeCredentials)).toBe(false);
      expect(isMySQLCredentials(bigqueryCredentials)).toBe(false);
      expect(isMySQLCredentials(postgresqlCredentials)).toBe(false);
      expect(isMySQLCredentials(sqlserverCredentials)).toBe(false);
      expect(isMySQLCredentials(redshiftCredentials)).toBe(false);
      expect(isMySQLCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isSQLServerCredentials', () => {
    it('should return true for SQL Server credentials', () => {
      expect(isSQLServerCredentials(sqlserverCredentials)).toBe(true);
    });

    it('should return false for non-SQL Server credentials', () => {
      expect(isSQLServerCredentials(snowflakeCredentials)).toBe(false);
      expect(isSQLServerCredentials(bigqueryCredentials)).toBe(false);
      expect(isSQLServerCredentials(postgresqlCredentials)).toBe(false);
      expect(isSQLServerCredentials(mysqlCredentials)).toBe(false);
      expect(isSQLServerCredentials(redshiftCredentials)).toBe(false);
      expect(isSQLServerCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isRedshiftCredentials', () => {
    it('should return true for Redshift credentials', () => {
      expect(isRedshiftCredentials(redshiftCredentials)).toBe(true);
    });

    it('should return false for non-Redshift credentials', () => {
      expect(isRedshiftCredentials(snowflakeCredentials)).toBe(false);
      expect(isRedshiftCredentials(bigqueryCredentials)).toBe(false);
      expect(isRedshiftCredentials(postgresqlCredentials)).toBe(false);
      expect(isRedshiftCredentials(mysqlCredentials)).toBe(false);
      expect(isRedshiftCredentials(sqlserverCredentials)).toBe(false);
      expect(isRedshiftCredentials(databricksCredentials)).toBe(false);
    });
  });

  describe('isDatabricksCredentials', () => {
    it('should return true for Databricks credentials', () => {
      expect(isDatabricksCredentials(databricksCredentials)).toBe(true);
    });

    it('should return false for non-Databricks credentials', () => {
      expect(isDatabricksCredentials(snowflakeCredentials)).toBe(false);
      expect(isDatabricksCredentials(bigqueryCredentials)).toBe(false);
      expect(isDatabricksCredentials(postgresqlCredentials)).toBe(false);
      expect(isDatabricksCredentials(mysqlCredentials)).toBe(false);
      expect(isDatabricksCredentials(sqlserverCredentials)).toBe(false);
      expect(isDatabricksCredentials(redshiftCredentials)).toBe(false);
    });
  });
});
