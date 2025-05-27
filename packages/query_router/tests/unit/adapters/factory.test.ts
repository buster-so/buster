import { describe, expect, it } from 'vitest';
import { createAdapter, getSupportedTypes, isSupported } from '../../../src/adapters/factory';
import { DataSourceType } from '../../../src/types/credentials';
import type {
  BigQueryCredentials,
  Credentials,
  DatabricksCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SQLServerCredentials,
  SnowflakeCredentials,
} from '../../../src/types/credentials';

// Type for testing unsupported data source types
type UnsupportedCredentials = {
  type: 'unsupported';
  host: string;
  database: string;
  username: string;
  password: string;
};

describe('Adapter Factory', () => {
  describe('createAdapter', () => {
    it('should create SnowflakeAdapter for Snowflake credentials', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'test-account',
        warehouse_id: 'test-warehouse',
        username: 'test-user',
        password: 'test-pass',
        default_database: 'test-db',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
    });

    it('should create BigQueryAdapter for BigQuery credentials', async () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: '{"type": "service_account"}',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.BigQuery);
    });

    it('should create PostgreSQLAdapter for PostgreSQL credentials', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
    });

    it('should create MySQLAdapter for MySQL credentials', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.MySQL);
    });

    it('should create SQLServerAdapter for SQL Server credentials', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        port: 1433,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.SQLServer);
    });

    it('should create RedshiftAdapter for Redshift credentials', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'test-cluster.redshift.amazonaws.com',
        port: 5439,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Redshift);
    });

    it('should create DatabricksAdapter for Databricks credentials', async () => {
      const credentials: DatabricksCredentials = {
        type: DataSourceType.Databricks,
        server_hostname: 'test.cloud.databricks.com',
        http_path: '/sql/1.0/warehouses/test',
        access_token: 'test-token',
      };

      const adapter = await createAdapter(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Databricks);
    });

    it('should throw error for unsupported data source type', async () => {
      const credentials: UnsupportedCredentials = {
        type: 'unsupported',
        host: 'localhost',
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      await expect(createAdapter(credentials as unknown as Credentials)).rejects.toThrow(
        'Unsupported data source type: unsupported'
      );
    });
  });

  describe('getSupportedTypes', () => {
    it('should return all supported data source types', () => {
      const supportedTypes = getSupportedTypes();

      expect(supportedTypes).toContain(DataSourceType.Snowflake);
      expect(supportedTypes).toContain(DataSourceType.BigQuery);
      expect(supportedTypes).toContain(DataSourceType.PostgreSQL);
      expect(supportedTypes).toContain(DataSourceType.MySQL);
      expect(supportedTypes).toContain(DataSourceType.SQLServer);
      expect(supportedTypes).toContain(DataSourceType.Redshift);
      expect(supportedTypes).toContain(DataSourceType.Databricks);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported data source types', () => {
      expect(isSupported(DataSourceType.Snowflake)).toBe(true);
      expect(isSupported(DataSourceType.BigQuery)).toBe(true);
      expect(isSupported(DataSourceType.PostgreSQL)).toBe(true);
      expect(isSupported(DataSourceType.MySQL)).toBe(true);
      expect(isSupported(DataSourceType.SQLServer)).toBe(true);
      expect(isSupported(DataSourceType.Redshift)).toBe(true);
      expect(isSupported(DataSourceType.Databricks)).toBe(true);
    });

    it('should return false for unsupported data source types', () => {
      expect(isSupported('unsupported' as unknown as DataSourceType)).toBe(false);
    });
  });
});
