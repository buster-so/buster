import sql from 'mssql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQLServerCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { SQLServerAdapter } from './sqlserver';

// Mock mssql module
vi.mock('mssql');
const mockedSql = vi.mocked(sql);

describe('SQLServerAdapter', () => {
  let adapter: SQLServerAdapter;
  let mockPool: any;
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SQLServerAdapter();

    // Create mock request for each test
    mockRequest = {
      query: vi.fn(),
      input: vi.fn().mockReturnThis(),
    };

    // Create mock pool for each test
    mockPool = {
      request: vi.fn().mockReturnValue(mockRequest),
      close: vi.fn().mockResolvedValue(undefined),
      connect: vi.fn().mockResolvedValue(undefined),
    };

    // Mock the ConnectionPool constructor
    mockedSql.ConnectionPool = vi.fn(() => mockPool) as any;

    // Mock SQL Server data types
    mockedSql.NVarChar = vi.fn();
    mockedSql.Int = vi.fn();
    mockedSql.BigInt = vi.fn();
    mockedSql.Bit = vi.fn();
    mockedSql.Float = vi.fn();
    mockedSql.Decimal = vi.fn();
    mockedSql.Date = vi.fn();
    mockedSql.DateTime = vi.fn();
    mockedSql.Time = vi.fn();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        port: 1433,
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith({
        server: 'localhost',
        port: 1433,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      });
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should use default port when not specified', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          port: undefined,
        })
      );
    });

    it('should configure encryption options', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        encrypt: false,
        trust_server_certificate: false,
      };

      await adapter.initialize(credentials);

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            encrypt: false,
            trustServerCertificate: false,
          },
        })
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.PostgreSQL,
        server: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      } as any;

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected sqlserver, got postgres'
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Failed to initialize SQL Server client: Connection failed'
      );
    });
  });

  describe('query execution', () => {
    const credentials: SQLServerCredentials = {
      type: DataSourceType.SQLServer,
      server: 'localhost',
      default_database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
    });

    it('should execute simple query without parameters', async () => {
      const mockResult = {
        recordset: [{ id: 1, name: 'Test' }],
        recordsets: [[{ id: 1, name: 'Test' }]],
        rowsAffected: [1],
        output: {},
      };

      mockRequest.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users');

      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users');

      expect(result).toEqual({
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockResult = {
        recordset: [{ id: 1 }],
        recordsets: [[{ id: 1 }]],
        rowsAffected: [1],
        output: {},
      };

      mockRequest.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(mockRequest.input).toHaveBeenCalledWith('param0', 1);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = @param0');
      expect(result.rows).toEqual([{ id: 1 }]);
    });

    it('should handle maxRows limit', async () => {
      // For streaming mode, we need to mock the event emitter behavior
      const rows = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }));
      let recordsetCallback: any;
      let rowCallback: any;
      let doneCallback: any;

      mockRequest.on = vi.fn((event, callback) => {
        if (event === 'recordset') recordsetCallback = callback;
        if (event === 'row') rowCallback = callback;
        if (event === 'done') doneCallback = callback;
        if (event === 'error') {
        } // Ignore error callback
      });

      mockRequest.pause = vi.fn();
      mockRequest.cancel = vi.fn();

      mockRequest.query.mockImplementation(() => {
        // Simulate async behavior
        setTimeout(() => {
          recordsetCallback?.({ id: { name: 'id', type: () => ({ name: 'int' }) } });
          for (const row of rows) {
            rowCallback?.(row);
          }
          doneCallback?.();
        }, 0);
      });

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(mockRequest.stream).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(true);
    });

    it('should detect when there are exactly maxRows', async () => {
      // For streaming mode, we need to mock the event emitter behavior
      const rows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      let recordsetCallback: any;
      let rowCallback: any;
      let doneCallback: any;

      mockRequest.on = vi.fn((event, callback) => {
        if (event === 'recordset') recordsetCallback = callback;
        if (event === 'row') rowCallback = callback;
        if (event === 'done') doneCallback = callback;
        if (event === 'error') {
        } // Ignore error callback
      });

      mockRequest.pause = vi.fn();
      mockRequest.cancel = vi.fn();

      mockRequest.query.mockImplementation(() => {
        // Simulate async behavior
        setTimeout(() => {
          recordsetCallback?.({ id: { name: 'id', type: () => ({ name: 'int' }) } });
          for (const row of rows) {
            rowCallback?.(row);
          }
          doneCallback?.();
        }, 0);
      });

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(false);
    });

    it('should handle query timeout', async () => {
      const timeoutAdapter = new SQLServerAdapter();
      const longTimeoutConfig = {
        ...credentials,
        request_timeout: 5000,
      };

      await timeoutAdapter.initialize(longTimeoutConfig);

      expect(mockedSql.ConnectionPool).toHaveBeenCalledWith(
        expect.objectContaining({
          requestTimeout: 5000,
        })
      );
    });

    it('should handle query errors', async () => {
      mockRequest.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'SQL Server query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new SQLServerAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'sqlserver adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      const mockResult = {
        recordset: [],
        recordsets: [[]],
        rowsAffected: [0],
        output: {},
      };

      mockRequest.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toEqual([]);
    });

    it('should handle TOP queries', async () => {
      const mockResult = {
        recordset: [{ id: 1, name: 'Test' }],
        recordsets: [[{ id: 1, name: 'Test' }]],
        rowsAffected: [1],
        output: {},
      };

      mockRequest.query.mockResolvedValueOnce(mockResult);

      await adapter.query('SELECT TOP 10 * FROM users');

      expect(mockRequest.query).toHaveBeenCalledWith('SELECT TOP 10 * FROM users');
    });

    it('should handle ORDER BY with maxRows', async () => {
      // For streaming mode, we need to mock the event emitter behavior
      const rows = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      let recordsetCallback: any;
      let rowCallback: any;
      let doneCallback: any;

      mockRequest.on = vi.fn((event, callback) => {
        if (event === 'recordset') recordsetCallback = callback;
        if (event === 'row') rowCallback = callback;
        if (event === 'done') doneCallback = callback;
        if (event === 'error') {
        } // Ignore error callback
      });

      mockRequest.pause = vi.fn();
      mockRequest.cancel = vi.fn();

      mockRequest.query.mockImplementation(() => {
        // Simulate async behavior
        setTimeout(() => {
          recordsetCallback?.({ id: { name: 'id', type: () => ({ name: 'int' }) } });
          for (const row of rows) {
            rowCallback?.(row);
          }
          doneCallback?.();
        }, 0);
      });

      const result = await adapter.query('SELECT * FROM users ORDER BY id', [], 10);

      expect(mockRequest.stream).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users ORDER BY id');
      expect(result.hasMoreRows).toBe(false);
    });
  });

  describe('parameter type mapping', () => {
    const credentials: SQLServerCredentials = {
      type: DataSourceType.SQLServer,
      server: 'localhost',
      default_database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
      mockRequest.query.mockResolvedValue({
        recordset: [],
        recordsets: [[]],
        rowsAffected: [0],
        output: {},
      });
    });

    it('should handle string parameters', async () => {
      await adapter.query('SELECT ?', ['test']);
      expect(mockRequest.input).toHaveBeenCalledWith('param0', 'test');
    });

    it('should handle number parameters', async () => {
      await adapter.query('SELECT ?', [123]);
      expect(mockRequest.input).toHaveBeenCalledWith('param0', 123);
    });

    it('should handle boolean parameters', async () => {
      await adapter.query('SELECT ?', [true]);
      expect(mockRequest.input).toHaveBeenCalledWith('param0', true);
    });

    it('should handle Date parameters', async () => {
      const date = new Date();
      await adapter.query('SELECT ?', [date]);
      expect(mockRequest.input).toHaveBeenCalledWith('param0', date);
    });

    it('should handle null parameters', async () => {
      await adapter.query('SELECT ?', [null]);
      expect(mockRequest.input).toHaveBeenCalledWith('param0', null);
    });
  });

  describe('connection management', () => {
    it('should test connection successfully', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockRequest.query.mockResolvedValueOnce({
        recordset: [{ test: 1 }],
      });

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT 1 as test');
    });

    it('should return false when test connection fails', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockRequest.query.mockRejectedValueOnce(new Error('Connection test failed'));

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);
      await adapter.close();

      expect(mockPool.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockPool.close.mockRejectedValueOnce(new Error('Close failed'));

      // Should not throw
      await adapter.close();
    });
  });

  describe('introspection', () => {
    it('should return introspector', async () => {
      const credentials: SQLServerCredentials = {
        type: DataSourceType.SQLServer,
        server: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
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
        'sqlserver adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.SQLServer);
    });
  });
});
