import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createNamespaceIfNotExists,
  deleteSearchableValues,
  getAllSearchableValues,
  queryExistingKeys,
  TurbopufferError,
  upsertSearchableValues,
} from './client';
import type { SearchableValue, TurbopufferQuery } from './types';

// Mock the Turbopuffer module
vi.mock('@turbopuffer/turbopuffer', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      namespace: vi.fn().mockImplementation((name: string) => ({
        query: vi.fn(),
        write: vi.fn(),
        exists: vi.fn(),
      })),
    })),
  };
});

describe('Turbopuffer Client', () => {
  const mockDataSourceId = '123e4567-e89b-12d3-a456-426614174000';
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, TURBOPUFFER_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('TurbopufferError', () => {
    it('should create error with correct properties', () => {
      const error = new TurbopufferError('Test error', 'TEST_ERROR', true, { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('TurbopufferError');
    });
  });

  describe('createNamespaceIfNotExists', () => {
    it('should handle namespace creation', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        exists: vi.fn().mockResolvedValue(true),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      await createNamespaceIfNotExists(mockDataSourceId);

      expect(mockNamespace.exists).toHaveBeenCalled();
    });

    it('should handle namespace not found gracefully', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        exists: vi.fn().mockResolvedValue(false),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      // Should not throw for namespace not found
      await expect(createNamespaceIfNotExists(mockDataSourceId)).resolves.toBeUndefined();
    });

    it('should throw TurbopufferError for other errors', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        exists: vi.fn().mockRejectedValue(new Error('network error')),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      // Function now retries 3 times before giving up
      await expect(createNamespaceIfNotExists(mockDataSourceId)).rejects.toThrow();
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.TURBOPUFFER_API_KEY;

      // Function now retries 3 times before giving up
      await expect(createNamespaceIfNotExists(mockDataSourceId)).rejects.toThrow();
    });
  });

  describe('queryExistingKeys', () => {
    it('should query and return unique keys', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockResponse = {
        rows: [
          {
            attributes: {
              database: 'db1',
              schema: 'public',
              table: 'users',
              column: 'name',
              value: 'John',
            },
          },
          {
            attributes: {
              database: 'db1',
              schema: 'public',
              table: 'users',
              column: 'email',
              value: 'john@example.com',
            },
          },
        ],
      };

      const mockNamespace = {
        query: vi.fn().mockResolvedValue(mockResponse),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const query: TurbopufferQuery = {
        database: 'db1',
      };

      const keys = await queryExistingKeys({ dataSourceId: mockDataSourceId, query });

      expect(keys).toHaveLength(2);
      // Keys now use hashes of the values, not the actual values
      expect(keys[0]).toMatch(/^db1:public:users:name:[a-z0-9]{8}$/);
      expect(keys[1]).toMatch(/^db1:public:users:email:[a-z0-9]{8}$/);

      expect(mockNamespace.query).toHaveBeenCalledWith({
        top_k: 1200,
        filters: ['database', 'Eq', 'db1'],
        include_attributes: ['database', 'schema', 'table', 'column', 'value'],
      });
    });

    it('should handle empty results', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const query: TurbopufferQuery = {};

      const keys = await queryExistingKeys({ dataSourceId: mockDataSourceId, query });
      expect(keys).toEqual([]);
    });

    it('should apply all filters correctly', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const query: TurbopufferQuery = {
        database: 'db1',
        schema: 'public',
        table: 'users',
        column: 'name',
      };

      await queryExistingKeys({ dataSourceId: mockDataSourceId, query });

      expect(mockNamespace.query).toHaveBeenCalledWith({
        top_k: 1200,
        filters: [
          'And',
          [
            ['database', 'Eq', 'db1'],
            ['schema', 'Eq', 'public'],
            ['table', 'Eq', 'users'],
            ['column', 'Eq', 'name'],
          ],
        ],
        include_attributes: ['database', 'schema', 'table', 'column', 'value'],
      });
    });
  });

  describe('upsertSearchableValues', () => {
    it('should upsert values successfully', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockResolvedValue(undefined),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const values: SearchableValue[] = [
        {
          database: 'db1',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John',
          embedding: new Array(512).fill(0.1),
        },
        {
          database: 'db1',
          schema: 'public',
          table: 'users',
          column: 'email',
          value: 'john@example.com',
          embedding: new Array(512).fill(0.2),
        },
      ];

      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values });

      expect(result.upserted).toBe(2);
      expect(result.namespace).toBe(mockDataSourceId);
      expect(result.errors).toBeUndefined();

      expect(mockNamespace.write).toHaveBeenCalledTimes(1);
      const callArgs = mockNamespace.write.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        upsert_columns: {
          // id array should have hashed values, not original values
          database: ['db1', 'db1'],
          schema: ['public', 'public'],
          table: ['users', 'users'],
          column: ['name', 'email'],
          value: ['John', 'john@example.com'],
        },
        distance_metric: 'cosine_distance',
        schema: {
          value: { type: 'string', full_text_search: true },
          database: { type: 'string' },
          schema: { type: 'string' },
          table: { type: 'string' },
          column: { type: 'string' },
          synced_at: { type: 'string' },
        },
      });
      // Check ID field with hashed values
      expect(callArgs.upsert_columns.id).toHaveLength(2);
      expect(callArgs.upsert_columns.id[0]).toMatch(/^db1:public:users:name:[a-z0-9]{8}$/);
      expect(callArgs.upsert_columns.id[1]).toMatch(/^db1:public:users:email:[a-z0-9]{8}$/);
      // Check vector field separately
      expect(callArgs.upsert_columns.vector).toHaveLength(2);
      expect(callArgs.upsert_columns.vector[0]).toHaveLength(512);
      expect(callArgs.upsert_columns.vector[1]).toHaveLength(512);
      // Check synced_at separately
      expect(callArgs.upsert_columns.synced_at).toHaveLength(2);
    });

    it('should handle empty values array', async () => {
      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values: [] });

      expect(result.upserted).toBe(0);
      expect(result.namespace).toBe(mockDataSourceId);
    });

    it('should handle invalid embeddings', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockResolvedValue(undefined),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const values: SearchableValue[] = [
        {
          database: 'db1',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John',
          // Missing embedding
        },
      ];

      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values });
      expect(result.upserted).toBe(0);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });

    it('should batch large upserts', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockResolvedValue(undefined),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      // Create 250 values (should result in 3 batches with batch size 100)
      const values: SearchableValue[] = Array.from({ length: 250 }, (_, i) => ({
        database: 'db1',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: `User${i}`,
        embedding: new Array(512).fill(0.1),
      }));

      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values });

      expect(result.upserted).toBe(250);
      expect(mockNamespace.write).toHaveBeenCalledTimes(3); // 100 + 100 + 50
    });

    it('should handle batch errors gracefully', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi
          .fn()
          .mockResolvedValueOnce(undefined) // First batch succeeds
          .mockRejectedValueOnce(new Error('Batch error')) // Second batch fails
          .mockResolvedValueOnce(undefined), // Third batch succeeds
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const values: SearchableValue[] = Array.from({ length: 250 }, (_, i) => ({
        database: 'db1',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: `User${i}`,
        embedding: new Array(512).fill(0.1),
      }));

      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values });

      expect(result.upserted).toBe(150); // Only first and third batch succeed
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('deleteSearchableValues', () => {
    it('should delete values successfully', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockResolvedValue(undefined),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const keys = ['db1:public:users:name:John', 'db1:public:users:email:john@example.com'];

      const result = await deleteSearchableValues({ dataSourceId: mockDataSourceId, keys });

      expect(result.deleted).toBe(2);
      expect(mockNamespace.write).toHaveBeenCalledWith({
        deletes: keys,
      });
    });

    it('should handle empty keys array', async () => {
      const result = await deleteSearchableValues({ dataSourceId: mockDataSourceId, keys: [] });
      expect(result.deleted).toBe(0);
    });

    it('should batch large deletes', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockResolvedValue(undefined),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const keys = Array.from({ length: 250 }, (_, i) => `db1:public:users:name:User${i}`);

      const result = await deleteSearchableValues({ dataSourceId: mockDataSourceId, keys });

      expect(result.deleted).toBe(250);
      expect(mockNamespace.write).toHaveBeenCalledTimes(3); // 100 + 100 + 50
    });
  });

  describe('getAllSearchableValues', () => {
    it('should retrieve all values', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockResponse = {
        rows: [
          {
            attributes: {
              database: 'db1',
              schema: 'public',
              table: 'users',
              column: 'name',
              value: 'John',
              synced_at: '2024-01-01T00:00:00Z',
            },
          },
        ],
      };

      const mockNamespace = {
        query: vi.fn().mockResolvedValue(mockResponse),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const values = await getAllSearchableValues({ dataSourceId: mockDataSourceId });

      expect(values).toHaveLength(1);
      expect(values[0]).toEqual({
        database: 'db1',
        schema: 'public',
        table: 'users',
        column: 'name',
        value: 'John',
        // Note: vector/embedding not available from query response
        synced_at: '2024-01-01T00:00:00Z',
      });

      expect(mockNamespace.query).toHaveBeenCalledWith({
        top_k: 1000,
        include_attributes: ['database', 'schema', 'table', 'column', 'value', 'synced_at'],
      });
    });

    it('should respect limit parameter', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        query: vi.fn().mockResolvedValue({ rows: [] }),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      await getAllSearchableValues({ dataSourceId: mockDataSourceId, limit: 500 });

      expect(mockNamespace.query).toHaveBeenCalledWith({
        top_k: 500,
        include_attributes: ['database', 'schema', 'table', 'column', 'value', 'synced_at'],
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        query: vi
          .fn()
          .mockRejectedValueOnce(new Error('ECONNREFUSED'))
          .mockResolvedValueOnce({ rows: [] }),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const query: TurbopufferQuery = {};

      const keys = await queryExistingKeys({ dataSourceId: mockDataSourceId, query });

      expect(keys).toEqual([]);
      expect(mockNamespace.query).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limit errors', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        query: vi
          .fn()
          .mockRejectedValueOnce(new Error('429 Too Many Requests'))
          .mockResolvedValueOnce({ rows: [] }),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const query: TurbopufferQuery = {};

      const keys = await queryExistingKeys({ dataSourceId: mockDataSourceId, query });

      expect(keys).toEqual([]);
      expect(mockNamespace.query).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const Turbopuffer = (await import('@turbopuffer/turbopuffer')).default;
      const mockNamespace = {
        write: vi.fn().mockRejectedValue(new Error('Invalid data')),
      };

      (Turbopuffer as any).mockImplementation(() => ({
        namespace: vi.fn().mockReturnValue(mockNamespace),
      }));

      const values: SearchableValue[] = [
        {
          database: 'db1',
          schema: 'public',
          table: 'users',
          column: 'name',
          value: 'John',
          embedding: new Array(512).fill(0.1),
        },
      ];

      // The function should handle batch errors gracefully and return with errors array
      const result = await upsertSearchableValues({ dataSourceId: mockDataSourceId, values });

      expect(result.upserted).toBe(0);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(mockNamespace.write).toHaveBeenCalledTimes(1); // No retry
    });
  });
});
