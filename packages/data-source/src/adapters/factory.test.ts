import { describe, expect, it } from 'vitest';
import type {
  BigQueryCredentials,
  Credentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SnowflakeCredentials,
  SQLServerCredentials,
} from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { createAdapterInstance, getSupportedTypes, isSupported } from './factory';

// Type for testing unsupported data source types
type UnsupportedCredentials = {
  type: 'unsupported';
  host: string;
  database: string;
  username: string;
  password: string;
};

describe('Adapter Factory', () => {
  describe('createAdapterInstance', () => {
    it('should create SnowflakeAdapter for Snowflake credentials', () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'test-account',
        warehouse_id: 'test-warehouse',
        username: 'test-user',
        password: 'test-pass',
        default_database: 'test-db',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
    });

    it('should create BigQueryAdapter for BigQuery credentials', () => {
      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: '{"type": "service_account"}',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.BigQuery);
    });

    it('should create PostgreSQLAdapter for PostgreSQL credentials', () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
    });

    it('should create MySQLAdapter for MySQL credentials', () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        default_database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.MySQL);
    });

    it('should create SQLServerAdapter for SQL Server credentials', () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        port: 1433,
        default_database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.SQLServer);
    });

    it('should create RedshiftAdapter for Redshift credentials', () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'test-cluster.redshift.amazonaws.com',
        port: 5439,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const adapter = createAdapterInstance(credentials);
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Redshift);
    });

    it('should throw error for unsupported data source type', () => {
      const credentials: UnsupportedCredentials = {
        type: 'unsupported',
        host: 'localhost',
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      expect(() => createAdapterInstance(credentials as unknown as Credentials)).toThrow(
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
    });

    it('should return false for unsupported data source types', () => {
      expect(isSupported('unsupported' as unknown as DataSourceType)).toBe(false);
    });
  });
});
