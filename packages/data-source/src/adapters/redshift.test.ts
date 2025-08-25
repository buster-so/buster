import { Client } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceType } from '../types/credentials';
import type { RedshiftCredentials } from '../types/credentials';
import { RedshiftAdapter } from './redshift';

// Mock pg-cursor
vi.mock('pg-cursor');

// Create mock client instance
const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
  end: vi.fn().mockResolvedValue(undefined),
};

// Mock pg module (Redshift uses PostgreSQL client)
vi.mock('pg', () => ({
  Client: vi.fn(() => mockClient),
}));

describe('RedshiftAdapter', () => {
  let adapter: RedshiftAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new RedshiftAdapter();
  });

  describe('initialization', () => {
    it('should initialize with valid credentials', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.region.redshift.amazonaws.com',
        port: 5439,
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith({
        host: 'cluster.region.redshift.amazonaws.com',
        port: 5439,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
        ssl: true,
        connectionTimeoutMillis: 60000,
      });
      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should use default port when not specified', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 5439,
        })
      );
    });

    it('should configure SSL by default', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: true,
        })
      );
    });

    it('should disable SSL when explicitly set to false', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        ssl: false,
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: false,
        })
      );
    });

    it('should configure custom SSL options', async () => {
      const sslOptions = {
        rejectUnauthorized: false,
        ca: 'ca-cert',
      };

      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
        ssl: sslOptions,
      };

      await adapter.initialize(credentials);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: sslOptions,
        })
      );
    });

    it('should throw error with invalid credentials type', async () => {
      const credentials = {
        type: DataSourceType.MySQL,
        host: 'localhost',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Invalid credentials type. Expected redshift, got mysql'
      );
    });

    it('should handle connection errors gracefully', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(adapter.initialize(credentials)).rejects.toThrow(
        'Failed to initialize Redshift client: Connection failed'
      );
    });
  });

  describe('query execution', () => {
    const credentials: RedshiftCredentials = {
      type: DataSourceType.Redshift,
      host: 'cluster.redshift.amazonaws.com',
      default_database: 'testdb',
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
          { name: 'id', type: 'redshift_type_23', nullable: true, length: 4 },
          { name: 'name', type: 'redshift_type_25', nullable: true, length: 0 },
        ],
        hasMoreRows: false,
      });
    });

    it('should execute parameterized query', async () => {
      const mockResult = {
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
        fields: [],
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock the actual query
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await adapter.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result.rows).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should handle maxRows limit using cursor', async () => {
      const mockRows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const mockCursor = {
        read: vi.fn((size, callback) => {
          callback(null, mockRows);
        }),
        close: vi.fn((callback) => callback(null)),
        _result: {
          fields: [{ name: 'id', dataTypeID: 23, dataTypeSize: 4 }],
        },
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock cursor creation
      mockClient.query.mockReturnValueOnce(mockCursor);

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(false);
    });

    it('should detect when there are more rows', async () => {
      const mockRows = Array.from({ length: 11 }, (_, i) => ({ id: i + 1 }));
      const mockCursor = {
        read: vi.fn((size, callback) => {
          callback(null, mockRows);
        }),
        close: vi.fn((callback) => callback(null)),
        _result: {
          fields: [{ name: 'id', dataTypeID: 23, dataTypeSize: 4 }],
        },
      };

      // Mock the SET statement_timeout call
      mockClient.query.mockResolvedValueOnce({});
      // Mock cursor creation
      mockClient.query.mockReturnValueOnce(mockCursor);

      const result = await adapter.query('SELECT * FROM users', [], 10);

      expect(result.rows).toHaveLength(10);
      expect(result.hasMoreRows).toBe(true);
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
        'Redshift query failed: Query failed'
      );
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new RedshiftAdapter();

      await expect(disconnectedAdapter.query('SELECT 1')).rejects.toThrow(
        'redshift adapter is not connected. Call initialize() first.'
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);

      mockClient.query.mockRejectedValueOnce(new Error('Connection test failed'));

      const result = await adapter.testConnection();

      expect(result).toBe(false);
    });

    it('should close connection', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      await adapter.initialize(credentials);
      await adapter.close();

      expect(mockClient.end).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
        default_database: 'testdb',
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
      const credentials: RedshiftCredentials = {
        type: DataSourceType.Redshift,
        host: 'cluster.redshift.amazonaws.com',
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
        'redshift adapter is not connected. Call initialize() first.'
      );
    });
  });

  describe('data source type', () => {
    it('should return correct data source type', () => {
      expect(adapter.getDataSourceType()).toBe(DataSourceType.Redshift);
    });
  });
});
