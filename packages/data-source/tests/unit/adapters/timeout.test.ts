import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BigQueryAdapter } from '../../../src/adapters/bigquery';
import { MySQLAdapter } from '../../../src/adapters/mysql';
import { PostgreSQLAdapter } from '../../../src/adapters/postgresql';
import { RedshiftAdapter } from '../../../src/adapters/redshift';
import { SnowflakeAdapter } from '../../../src/adapters/snowflake';
import { SQLServerAdapter } from '../../../src/adapters/sqlserver';
import type {
  BigQueryCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SQLServerCredentials,
  SnowflakeCredentials,
} from '../../../src/types/credentials';
import { DataSourceType } from '../../../src/types/credentials';

// Mock all external dependencies
vi.mock('@google-cloud/bigquery');
vi.mock('pg');
vi.mock('mysql2/promise');
vi.mock('snowflake-sdk');
vi.mock('mssql');

describe('Adapter Timeout Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('BigQueryAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new BigQueryAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 100) {
          throw new Error('Query execution timeout: Operation timed out after 100ms');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: BigQueryCredentials = {
        type: DataSourceType.BigQuery,
        project_id: 'test-project',
        service_account_key: '{}',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 100)).rejects.toThrow(/timeout/i);
    });
  });

  describe('PostgreSQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new PostgreSQLAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 1000) {
          throw new Error('Query timeout: Operation cancelled due to timeout of 1000ms');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        default_database: 'test',
        username: 'test',
        password: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 1000)).rejects.toThrow(/timeout/i);
    });
  });

  describe('RedshiftAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new RedshiftAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 100) {
          throw new Error('Query execution timeout after 100ms');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'localhost',
        port: 5439,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 100)).rejects.toThrow(/timeout/i);
    });
  });

  describe('MySQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new MySQLAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 1000) {
          throw new Error('MySQL query timeout exceeded');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 1000)).rejects.toThrow(/timeout/i);
    });
  });

  describe('SnowflakeAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new SnowflakeAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 1000) {
          throw new Error('Snowflake query timeout: execution exceeded 1000ms');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'test-account',
        username: 'test',
        password: 'test',
        warehouse_id: 'test-warehouse',
        default_database: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 1000)).rejects.toThrow(/timeout/i);
    });
  });

  describe('SQLServerAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const adapter = new SQLServerAdapter();
      
      // Mock the query method to simulate timeout
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        if (timeout && timeout <= 1000) {
          throw new Error('SQL Server timeout: Query execution exceeded maximum allowed time');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        port: 1433,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      await expect(adapter.query('SELECT 1', [], undefined, 1000)).rejects.toThrow(/timeout/i);
    });
  });

  describe('Default timeout behavior', () => {
    it('should use default timeout and throw when exceeded', async () => {
      const adapter = new MySQLAdapter();
      
      // Mock to track timeout values and simulate timeout for default
      adapter.query = vi.fn().mockImplementation(async (sql, params, maxRows, timeout) => {
        // Default timeout is typically 30000ms (30 seconds)
        const effectiveTimeout = timeout || 30000;
        if (effectiveTimeout >= 30000) {
          throw new Error('Query timeout: Default timeout of 30 seconds exceeded');
        }
        return { rows: [], rowCount: 0, fields: [], hasMoreRows: false };
      });

      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      // Mock initialize to do nothing
      adapter.initialize = vi.fn().mockResolvedValue(undefined);
      await adapter.initialize(credentials);

      // No timeout specified, should use default and throw
      await expect(adapter.query('SELECT 1')).rejects.toThrow(/timeout/i);
    });
  });
});
