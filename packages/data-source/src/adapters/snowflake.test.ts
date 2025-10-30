import type { SnowflakeCredentials } from '@buster/database/schema-types';
import { DataSourceType } from '@buster/database/schema-types';
import snowflake from 'snowflake-sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnowflakeAdapter } from './snowflake';

// Get mocked snowflake-sdk
vi.mock('snowflake-sdk');
const mockedSnowflake = vi.mocked(snowflake);

describe('SnowflakeAdapter', () => {
  let adapter: SnowflakeAdapter;
  let mockConnection: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    await SnowflakeAdapter.cleanup();

    adapter = new SnowflakeAdapter();

    // Create mock connection for each test
    mockConnection = {
      connect: vi.fn((cb) => cb()),
      execute: vi.fn(),
      destroy: vi.fn((cb) => cb()),
      isUp: vi.fn().mockReturnValue(false), // Return false to prevent warm connection reuse
    };

    mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);
    mockedSnowflake.configure = vi.fn();
  });

  afterEach(async () => {
    // Clean up warm connections after each test
    await SnowflakeAdapter.cleanup();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount.us-east-1',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith({
        account: 'testaccount.us-east-1',
        username: 'testuser',
        password: 'testpass',
        warehouse: 'COMPUTE_WH',
        database: 'TESTDB',
      });
      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should use no default warehouse when not specified', async () => {
      const credentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        default_database: 'TESTDB',
      } as SnowflakeCredentials;

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          warehouse: undefined,
        })
      );
    });

    it('should use no default database when not specified', async () => {
      const credentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
      } as SnowflakeCredentials;

      await adapter.initialize(credentials);

      expect(mockedSnowflake.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          database: undefined,
        })
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      mockConnection.connect.mockImplementation((cb) => cb(new Error('Connection failed')));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Query execution failed: Failed to connect to Snowflake: Connection failed'
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      } as any;

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected snowflake, got postgres'
      );
    });
  });

  describe('query execution', () => {
    const credentials: SnowflakeCredentials = {
      type: DataSourceType.Snowflake,
      account_id: 'testaccount',
      username: 'testuser',
      password: 'testpass',
      warehouse_id: 'COMPUTE_WH',
      default_database: 'TESTDB',
    };

    beforeEach(async () => {
      // Reset all mocks before each test
      vi.clearAllMocks();

      await SnowflakeAdapter.cleanup();

      // Create fresh adapter and connection for each test
      adapter = new SnowflakeAdapter();
      mockConnection = {
        connect: vi.fn((cb) => cb()),
        execute: vi.fn(),
        destroy: vi.fn((cb) => cb()),
        isUp: vi.fn().mockReturnValue(false),
      };
      mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);

      await adapter.initialize(credentials);
    });

    it('should execute simple query without parameters', async () => {
      const mockRows = [{ id: 1, name: 'Test' }];
      const mockStream = {
        on: vi.fn(),
      };

      const mockStatement = {
        getColumns: () => [
          {
            getName: () => 'ID',
            getType: () => 'NUMBER',
            isNullable: () => false,
            getScale: () => 0,
            getPrecision: () => 38,
          },
          {
            getName: () => 'NAME',
            getType: () => 'TEXT',
            isNullable: () => true,
            getScale: () => 0,
            getPrecision: () => 0,
          },
        ],
        streamRows: vi.fn().mockReturnValue(mockStream),
      };

      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(null, mockStatement);
      });

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(mockRows[0]), 0);
        } else if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
        return mockStream;
      });

      const result = await adapter.query('SELECT * FROM users');

      expect(mockConnection.execute).toHaveBeenCalledWith({
        sqlText: 'SELECT * FROM users',
        binds: undefined,
        streamResult: true,
        complete: expect.any(Function),
      });

      // When no maxRows is specified, streamRows should be called without parameters
      expect(mockStatement.streamRows).toHaveBeenCalledWith();

      expect(result).toEqual({
        rows: mockRows,
        rowCount: 1,
        fields: [
          { name: 'id', type: 'decimal', nullable: false, scale: 0, precision: 38 },
          { name: 'name', type: 'text', nullable: true, scale: 0, precision: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockRows = [{ id: 1 }];
      const mockStream = {
        on: vi.fn(),
      };

      const mockStatement = {
        getColumns: () => [
          {
            getName: () => 'ID',
            getType: () => 'NUMBER',
            isNullable: () => false,
            getScale: () => 0,
            getPrecision: () => 38,
          },
        ],
        streamRows: vi.fn().mockReturnValue(mockStream),
      };

      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(null, mockStatement);
      });

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(mockRows[0]), 0);
        } else if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
        return mockStream;
      });

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(result.rows).toEqual(mockRows);
      // When no maxRows is specified, streamRows should be called without parameters
      expect(mockStatement.streamRows).toHaveBeenCalledWith();
    });

    it('should handle maxRows limit', async () => {
      const mockRows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const mockStream = {
        on: vi.fn(),
      };

      const mockStatement = {
        getColumns: () => [
          {
            getName: () => 'ID',
            getType: () => 'NUMBER',
            isNullable: () => false,
            getScale: () => 0,
            getPrecision: () => 38,
          },
        ],
        streamRows: vi.fn().mockReturnValue(mockStream),
      };

      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(null, mockStatement);
      });

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'data') {
          setTimeout(() => {
            for (const row of mockRows) {
              handler(row);
            }
          }, 0);
        } else if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
        return mockStream;
      });

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(mockStatement.streamRows).toHaveBeenCalledWith({ start: 0, end: 10 });
      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(false); // We got exactly the limit, not more
    });

    it('should normalize numeric strings to JavaScript numbers', async () => {
      const mockStream = {
        on: vi.fn(),
      };

      const mockStatement = {
        getColumns: () => [
          {
            getName: () => 'COMMISSION_RATE_PCT',
            getType: () => 'FIXED',
            isNullable: () => true,
            getScale: () => 3,
            getPrecision: () => 10,
          },
          {
            getName: () => 'SALESYTD',
            getType: () => 'FIXED',
            isNullable: () => true,
            getScale: () => 4,
            getPrecision: () => 15,
          },
          {
            getName: () => 'PRODUCT_NAME',
            getType: () => 'TEXT',
            isNullable: () => true,
            getScale: () => 0,
            getPrecision: () => 0,
          },
        ],
        streamRows: vi.fn().mockReturnValue(mockStream),
      };

      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(null, mockStatement);
      });

      const mockRow = {
        COMMISSION_RATE_PCT: '1.500',
        SALESYTD: '4251368.5497',
        PRODUCT_NAME: 'Widget XL',
      };

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'data') {
          setTimeout(() => handler(mockRow), 0);
        } else if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
        return mockStream;
      });

      const result = await adapter.query('SELECT * FROM sales_data');

      expect(result.rows).toHaveLength(1);
      const row = result.rows[0];

      // Verify numeric strings were converted to numbers
      expect(typeof row.commission_rate_pct).toBe('number');
      expect(row.commission_rate_pct).toBe(1.5);

      expect(typeof row.salesytd).toBe('number');
      expect(row.salesytd).toBe(4251368.5497);

      // Verify text remains as string
      expect(typeof row.product_name).toBe('string');
      expect(row.product_name).toBe('Widget XL');
    });

    it('should handle query errors', async () => {
      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(new Error('Query failed'));
      });

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'Snowflake query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new SnowflakeAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'snowflake adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      const mockStream = {
        on: vi.fn(),
      };

      const mockStatement = {
        getColumns: () => [
          {
            getName: () => 'ID',
            getType: () => 'NUMBER',
            isNullable: () => false,
            getScale: () => 0,
            getPrecision: () => 38,
          },
          {
            getName: () => 'NAME',
            getType: () => 'TEXT',
            isNullable: () => true,
            getScale: () => 0,
            getPrecision: () => 0,
          },
        ],
        streamRows: vi.fn().mockReturnValue(mockStream),
      };

      mockConnection.execute.mockImplementation(({ complete, streamResult }) => {
        expect(streamResult).toBe(true);
        complete(null, mockStatement);
      });

      mockStream.on.mockImplementation((event: string, handler: (data?: unknown) => void) => {
        if (event === 'end') {
          setTimeout(() => handler(), 0);
        }
        return mockStream;
      });

      const result = await adapter.query('SELECT * FROM users WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toHaveLength(2);
      expect(result.hasMoreRows).toBe(false);
    });

    it('should handle query timeout', async () => {
      vi.useFakeTimers();

      mockConnection.execute.mockImplementation(() => {
        // Never call complete to simulate timeout
      });

      const queryPromise = adapter.query('SELECT 1', [], undefined, 100);

      // Fast-forward past the timeout
      vi.advanceTimersByTime(150);

      await expect(queryPromise).rejects.toThrow(/timeout/i);

      vi.useRealTimers();
    });
  });

  describe('connection management', () => {
    beforeEach(async () => {
      // Reset all mocks before each test
      vi.clearAllMocks();

      await SnowflakeAdapter.cleanup();

      // Create fresh adapter and connection for each test
      adapter = new SnowflakeAdapter();
      mockConnection = {
        connect: vi.fn((cb) => cb()),
        execute: vi.fn(),
        destroy: vi.fn((cb) => cb()),
        isUp: vi.fn().mockReturnValue(false),
      };
      mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);
    });

    it('should test connection successfully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(
          null,
          {
            getColumns: () => [],
          },
          [{ TEST: 1 }]
        );
      });

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sqlText: 'SELECT 1',
        })
      );
    });

    it('should return false when test connection fails', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      mockConnection.execute.mockImplementation(({ complete }) => {
        complete(new Error('Connection test failed'));
      });

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      const originalDateNow = Date.now;
      const currentTime = Date.now();
      const oldTime = currentTime - 6 * 60 * 1000; // 6 minutes ago (older than CONNECTION_REUSE_TIME of 5 minutes)

      (adapter as any).lastActivity = oldTime;

      Date.now = vi.fn().mockReturnValue(currentTime);

      await adapter.close();

      expect(mockConnection.destroy).toHaveBeenCalled();

      Date.now = originalDateNow;
    });

    it('should handle close errors gracefully', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(1000000000); // Old timestamp to force destroy

      mockConnection.destroy.mockImplementation((cb) => cb(new Error('Close failed')));

      // Should not throw
      await adapter.close();

      Date.now = originalDateNow;
    });
  });

  describe('introspection', () => {
    beforeEach(async () => {
      // Reset all mocks before each test
      vi.clearAllMocks();

      await SnowflakeAdapter.cleanup();

      // Create fresh adapter and connection for each test
      adapter = new SnowflakeAdapter();
      mockConnection = {
        connect: vi.fn((cb) => cb()),
        execute: vi.fn(),
        destroy: vi.fn((cb) => cb()),
        isUp: vi.fn().mockReturnValue(false),
      };
      mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);
    });

    it('should return introspector', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      const introspector = adapter.introspect();

      // Just verify it returns an introspector with the correct interface
      expect(introspector).toBeDefined();
      expect(introspector.getDatabases).toBeDefined();
      expect(introspector.getSchemas).toBeDefined();
      expect(introspector.getTables).toBeDefined();
      expect(introspector.getColumns).toBeDefined();
    });

    it('should throw error when trying to introspect without connection', () => {
      expect(() => adapter.introspect()).toThrow(
        'snowflake adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Snowflake);
    });
  });

  describe('connection statistics', () => {
    beforeEach(async () => {
      // Reset all mocks before each test
      vi.clearAllMocks();

      await SnowflakeAdapter.cleanup();

      // Create fresh adapter and connection for each test
      adapter = new SnowflakeAdapter();
      mockConnection = {
        connect: vi.fn((cb) => cb()),
        execute: vi.fn(),
        destroy: vi.fn((cb) => cb()),
        isUp: vi.fn().mockReturnValue(false),
      };
      mockedSnowflake.createConnection = vi.fn().mockReturnValue(mockConnection);
    });

    it('should return connection stats', async () => {
      const credentials: SnowflakeCredentials = {
        type: DataSourceType.Snowflake,
        account_id: 'testaccount',
        username: 'testuser',
        password: 'testpass',
        warehouse_id: 'COMPUTE_WH',
        default_database: 'TESTDB',
      };

      await adapter.initialize(credentials);

      const stats = adapter.getConnectionStats();

      expect(stats).toHaveProperty('connected', true);
      expect(stats).toHaveProperty('credentialKey');
      expect(stats).toHaveProperty('lastActivity');
      expect(stats).toHaveProperty('isWarmConnection');
    });
  });
});
