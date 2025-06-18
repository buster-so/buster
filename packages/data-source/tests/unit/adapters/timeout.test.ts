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

// Mock all external dependencies
vi.mock('@google-cloud/bigquery');
vi.mock('pg');
vi.mock('mysql2/promise');
vi.mock('snowflake-sdk');
vi.mock('mssql');

describe('Adapter Timeout Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('BigQueryAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      // Use real timers for this test since Promise.race needs real setTimeout
      vi.useRealTimers();

      const mockBigQuery = {
        createQueryJob: vi.fn(),
      };

      const mockJob = {
        getQueryResults: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate hanging query
              // Don't set timeout that would resolve it
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
    }, 2000); // 2 second test timeout
  });

  describe('PostgreSQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve({ rows: [], fields: [] }), 60000);
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

      const queryPromise = adapter.query('SELECT 1', [], undefined, 1000); // 1 second timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1500);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('RedshiftAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      // Use real timers for this test since Promise.race needs real setTimeout
      vi.useRealTimers();

      const mockClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate hanging query
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
    }, 2000); // 2 second test timeout
  });

  describe('MySQLAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const mockConnection = {
        execute: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve([[], []]), 60000);
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

      const queryPromise = adapter.query('SELECT 1', [], undefined, 1000); // 1 second timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1500);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('SnowflakeAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
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

      const queryPromise = adapter.query('SELECT 1', [], undefined, 1000); // 1 second timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1500);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('SqlServerAdapter timeout', () => {
    it('should timeout after specified duration', async () => {
      const mockRequest = {
        query: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve({ recordset: [] }), 60000);
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
      const credentials: SqlServerCredentials = {
        type: 'sqlserver',
        host: 'localhost',
        port: 1433,
        database: 'test',
        username: 'test',
        password: 'test',
      };

      await adapter.initialize(credentials);

      const queryPromise = adapter.query('SELECT 1', [], undefined, 1000); // 1 second timeout

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1500);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });

  describe('Default timeout behavior', () => {
    it('should use 30 second default timeout when none specified', async () => {
      const mockConnection = {
        execute: vi.fn(
          () =>
            new Promise((resolve) => {
              // Never resolve to simulate timeout
              setTimeout(() => resolve([[], []]), 60000);
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

      const queryPromise = adapter.query('SELECT 1'); // No timeout specified, should use 30s default

      // Fast-forward past the default timeout (30 seconds)
      vi.advanceTimersByTime(35000);

      await expect(queryPromise).rejects.toThrow(/timeout/i);
    });
  });
});
