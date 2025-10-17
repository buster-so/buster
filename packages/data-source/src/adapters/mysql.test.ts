import mysql from 'mysql2/promise';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MySQLCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { MySQLAdapter } from './mysql';

// Mock mysql2/promise module
vi.mock('mysql2/promise');
const mockedMysql = vi.mocked(mysql);

describe('MySQLAdapter', () => {
  let adapter: MySQLAdapter;
  let mockConnection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MySQLAdapter();

    // Create mock connection for each test
    mockConnection = {
      connect: vi.fn().mockResolvedValue(undefined),
      execute: vi.fn(),
      query: vi.fn(),
      end: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue(undefined),
    };

    mockedMysql.createConnection = vi.fn().mockResolvedValue(mockConnection);
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        port: 3306,
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(mockedMysql.createConnection).toHaveBeenCalledWith({
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
      });
    });

    it('should use default port when not specified', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(mockedMysql.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3306,
        })
      );
    });

    it('should configure SSL when specified', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        ssl: { rejectUnauthorized: true },
      };

      await adapter.initialize(credentials);

      expect(mockedMysql.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: true },
        })
      );
    });

    it('should use custom connection timeout when provided', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        connection_timeout: 5000,
      };

      await adapter.initialize(credentials);

      expect(mockedMysql.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          connectTimeout: 5000,
        })
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected mysql, got postgres'
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      mockedMysql.createConnection.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Failed to initialize MySQL client: Connection failed'
      );
    });
  });

  describe('query execution', () => {
    const credentials: MySQLCredentials = {
      type: DataSourceType.MySQL,
      host: 'localhost',
      database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
    });

    it('should execute simple query without parameters', async () => {
      const mockResult = [
        [{ id: 1, name: 'Test' }],
        [
          { name: 'id', type: 'LONG' },
          { name: 'name', type: 'VAR_STRING' },
        ],
      ];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users');

      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM users', undefined);

      expect(result).toEqual({
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [
          { name: 'id', type: 'integer', nullable: true, length: 0, precision: 0 },
          { name: 'name', type: 'varchar', nullable: true, length: 0, precision: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockResult = [[{ id: 1 }], [{ name: 'id', type: 'LONG' }]];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
      expect(result.rows).toEqual([{ id: 1 }]);
    });

    it('should handle maxRows limit', async () => {
      const mockResult = [
        Array.from({ length: 11 }, (_, i) => ({ id: i + 1 })),
        [{ name: 'id', type: 'LONG' }],
      ];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(true);
    });

    it('should detect when there are exactly maxRows', async () => {
      const mockResult = [
        Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
        [{ name: 'id', type: 'LONG' }],
      ];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(false);
    });

    it('should use custom timeout when provided', async () => {
      const mockResult = [[], []];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      await adapter.query('SELECT 1', [], undefined, 5000);

      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT 1', []);
    });

    it('should handle query errors', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('Query failed'));

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'MySQL query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new MySQLAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'mysql adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      const mockResult = [[], [{ name: 'id', type: 'LONG' }]];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toHaveLength(1);
    });

    it('should handle results without field metadata', async () => {
      const mockResult = [[{ id: 1 }], []];

      mockConnection.execute.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT 1 as id');

      expect(result.fields).toEqual([]);
    });
  });

  describe('connection management', () => {
    it('should test connection successfully', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockConnection.execute.mockResolvedValueOnce([[], []]);

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith('SELECT 1 as test');
    });

    it('should return false when test connection fails', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockConnection.execute.mockRejectedValueOnce(new Error('Connection test failed'));

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);
      await adapter.close();

      expect(mockConnection.end).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockConnection.end.mockRejectedValueOnce(new Error('Close failed'));

      // Should not throw
      await adapter.close();
    });
  });

  describe('introspection', () => {
    it('should return introspector', async () => {
      const credentials: MySQLCredentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
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
        'mysql adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.MySQL);
    });
  });
});
