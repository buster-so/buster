import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  BigQueryCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SnowflakeCredentials,
  SQLServerCredentials,
} from '../types/credentials';
import { BigQueryAdapter } from './bigquery';
import { MySQLAdapter } from './mysql';
import { PostgreSQLAdapter } from './postgresql';
import { RedshiftAdapter } from './redshift';
import { SnowflakeAdapter } from './snowflake';
import { SQLServerAdapter } from './sqlserver';

// Mock all external dependencies
vi.mock('@google-cloud/bigquery');
vi.mock('pg');
vi.mock('mysql2/promise');
vi.mock('snowflake-sdk');
vi.mock('mssql');

describe.skip('Adapter Timeout Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('BigQueryAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const mockBigQuery = {
        createQueryJob: vi.fn(),
      };

      const mockJob = {
        getQueryResults: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate hanging query
              setTimeout(() => resolve([[], {}]), 10000); // Resolve after 10 seconds
            })
        ),
      };

      mockBigQuery.createQueryJob.mockResolvedValue([mockJob]);

      // Mock the BigQuery constructor
      const { BigQuery } = await import('@google-cloud/bigquery');
      vi.mocked(BigQuery).mockImplementation(
        () => mockBigQuery as unknown as InstanceType<typeof BigQuery>
      );

      const adapter = new BigQueryAdapter();
      const credentials: BigQueryCredentials = {
        type: 'bigquery',
        project_id: 'test-project',
        service_account_key: '{}',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    }, 1000); // 1 second test timeout
  });

  describe('PostgreSQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve({ rows: [], fields: [] }), 10000);
            })
        ),
        end: vi.fn().mockResolvedValue(undefined),
      };

      // Mock pg module
      const pg = await import('pg');
      vi.mocked(pg.Client).mockImplementation(
        () => mockClient as unknown as InstanceType<typeof pg.Client>
      );

      const adapter = new PostgreSQLAdapter();
      const credentials: PostgreSQLCredentials = {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('RedshiftAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate hanging query
              setTimeout(() => resolve({ rows: [], fields: [] }), 10000);
            })
        ),
        end: vi.fn().mockResolvedValue(undefined),
      };

      // Mock pg module (Redshift uses pg)
      const pg = await import('pg');
      vi.mocked(pg.Client).mockImplementation(
        () => mockClient as unknown as InstanceType<typeof pg.Client>
      );

      const adapter = new RedshiftAdapter();
      const credentials: RedshiftCredentials = {
        type: 'redshift',
        host: 'localhost',
        port: 5439,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    }, 1000); // 1 second test timeout
  });

  describe('MySQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      const mockConnection = {
        execute: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve([[], []]), 10000);
            })
        ),
        end: vi.fn().mockResolvedValue(undefined),
      };

      // Mock mysql2/promise module
      const mysql = await import('mysql2/promise');
      vi.mocked(mysql.createConnection).mockResolvedValue(
        mockConnection as unknown as Awaited<ReturnType<typeof mysql.createConnection>>
      );

      const adapter = new MySQLAdapter();
      const credentials: MySQLCredentials = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('SnowflakeAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      const mockConnection = {
        connect: vi.fn((callback: (err: unknown) => void) => callback(null)),
        execute: vi.fn(() => {
          // Never call the complete callback to simulate timeout
        }),
        destroy: vi.fn((callback: (err: unknown) => void) => callback(null)),
      };

      // Mock snowflake-sdk module
      const snowflake = await import('snowflake-sdk');
      const snowflakeDefault = snowflake.default as any;
      snowflakeDefault.createConnection = vi.fn().mockReturnValue(mockConnection);
      snowflakeDefault.configure = vi.fn().mockImplementation(() => {});

      const adapter = new SnowflakeAdapter();
      const credentials: SnowflakeCredentials = {
        type: 'snowflake',
        account_id: 'test-account',
        username: 'test',
        password: 'test',
        warehouse_id: 'test-warehouse',
        default_database: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('SqlServerAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      const mockRequest = {
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve({ recordset: [] }), 10000);
            })
        ),
        input: vi.fn(),
      };

      const mockPool = {
        connect: vi.fn().mockResolvedValue(undefined),
        request: vi.fn().mockReturnValue(mockRequest),
        close: vi.fn().mockResolvedValue(undefined),
      };

      // Mock mssql module
      const sql = await import('mssql');
      (sql as any).ConnectionPool = vi.fn().mockImplementation(() => mockPool);

      const adapter = new SqlServerAdapter();
      const credentials: SQLServerCredentials = {
        type: 'sqlserver',
        host: 'localhost',
        port: 1433,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100); // 100ms timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('Default timeout behavior', () => {
    it('should use default timeout when none specified', async () => {
      vi.useFakeTimers();

      const mockConnection = {
        execute: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve([[], []]), 10000);
            })
        ),
        end: vi.fn().mockResolvedValue(undefined),
      };

      // Mock mysql2/promise module
      const mysql = await import('mysql2/promise');
      vi.mocked(mysql.createConnection).mockResolvedValue(
        mockConnection as unknown as Awaited<ReturnType<typeof mysql.createConnection>>
      );

      const adapter = new MySQLAdapter();
      const credentials: MySQLCredentials = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      // In test environment, default timeout should be 5000ms (5 seconds)
      const queryPromise = adapter.query('SELECT 1'); // No timeout specified

      // Fast-forward past the test environment default timeout
      vi.advanceTimersByTime(5500);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });
});
