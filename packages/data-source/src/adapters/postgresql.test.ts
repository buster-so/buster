import { Client } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostgreSQLCredentials } from '../types/credentials';
import { DataSourceType } from '../types/credentials';
import { PostgreSQLAdapter } from './postgresql';

// Create mock client instance
const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  end: vi.fn().mockResolvedValue(undefined),
};

// Mock pg module
vi.mock('pg', () => ({
  Client: vi.fn(() => mockClient),
}));

describe('PostgreSQLAdapter', () => {
  let adapter: PostgreSQLAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PostgreSQLAdapter();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
        ssl: { rejectUnauthorized: false },
      });
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should handle database field for backward compatibility', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 'testdb',
        })
      );
    });

    it('should handle default_database field for backward compatibility', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      } as any;

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          database: 'testdb',
        })
      );
    });

    it('should throw error when neither database nor default_database is provided', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        port: 5432,
        username: 'testuser',
        password: 'testpass',
      } as any;

      await expect(adapter.initialize(credentials)).rejects.toThrow('Database name is required');
    });

    it('should use default port when not specified', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 5432,
        })
      );
    });

    it('should configure SSL when specified', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        ssl: true,
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });

    it('should set search_path when schema is provided', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        schema: 'custom_schema',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          options: '-c search_path=custom_schema',
        })
      );
    });

    it('should set connection timeout when provided', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        connection_timeout: 10000,
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeoutMillis: 10000,
        })
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected postgres, got mysql'
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Failed to initialize PostgreSQL client: Connection failed'
      );
    });
  });

  describe('query execution', () => {
    const credentials: PostgreSQLCredentials = {
      type: DataSourceType.PostgreSQL,
      host: 'localhost',
      database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    };

    beforeEach(async () => {
      await adapter.initialize(credentials);
      // Reset mock for query tests
      mockClient.query.mockClear();
    });

    it('should execute simple query without parameters', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [
          { name: 'id', dataTypeID: 23, dataTypeSize: 4 },
          { name: 'name', dataTypeID: 25, dataTypeSize: -1 },
        ],
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users');

      expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 60000');
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users', undefined);

      expect(result).toEqual({
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [
          { name: 'id', type: 'integer', nullable: true, length: 4 },
          { name: 'name', type: 'text', nullable: true, length: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [
          { name: 'id', dataTypeID: 23, dataTypeSize: 4 },
          { name: 'name', dataTypeID: 25, dataTypeSize: -1 },
        ],
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result.rows).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should use custom timeout when provided', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        fields: [],
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      await adapter.query('SELECT 1', [], undefined, 5000);

      expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 5000');
    });

    it('should handle query errors', async () => {
      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query to fail
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(adapter.query('SELECT * FROM invalid_table')).rejects.toThrow(
        'PostgreSQL query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new PostgreSQLAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'postgres adapter is not connected. Call initialize() first.'
      );
    });

    it('should handle empty result sets', async () => {
      const mockResult = {
        rows: [],
        rowCount: 0,
        fields: [{ name: 'id', dataTypeID: 23, dataTypeSize: 4 }],
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE 1=0');

      expect(result.rows).toEqual([]);
      expect(result.rowCount).toBe(0);
      expect(result.fields).toHaveLength(1);
    });

    it('should handle results without fields metadata', async () => {
      const mockResult = {
        rows: [{ id: 1 }],
        rowCount: 1,
        // No fields property
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT 1 as id');

      expect(result.fields).toEqual([]);
    });
  });

  describe('connection management', () => {
    it('should test connection successfully', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockClient.query.mockResolvedValueOnce({ rows: [{ result: 1 }] });

      const result = await adapter.testConnection();

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1 as test');
    });

    it('should return false when test connection fails', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockClient.query.mockRejectedValueOnce(new Error('Connection test failed'));

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);
      await adapter.close();

      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockClient.end.mockRejectedValueOnce(new Error('Close failed'));

      // Should not throw
      await adapter.close();
    });
  });

  describe('introspection', () => {
    it('should return introspector', async () => {
      const credentials: PostgreSQLCredentials = {
        type: DataSourceType.PostgreSQL,
        host: 'localhost',
        database: 'testdb',
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
        'postgres adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.PostgreSQL);
    });
  });
});
