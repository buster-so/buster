import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetrieveMetadataContext, RetrieveMetadataOutput } from './retrieve-metadata';
import { createRetrieveMetadataExecute } from './retrieve-metadata-execute';

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe('retrieve-metadata-execute error handling', () => {
  const mockContext: RetrieveMetadataContext = {
    apiKey: 'test-api-key',
    apiUrl: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRetrieveMetadataExecute', () => {
    it('should retrieve metadata successfully', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      const mockResponse: RetrieveMetadataOutput = {
        metadata: {
          columns: [
            { name: 'id', type: 'integer' },
            { name: 'name', type: 'string' },
          ],
          row_count: 1000,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await executeHandler({
        dataSourceId: 'test-ds-id',
        database: 'test_db',
        schema: 'public',
        name: 'users',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v2/tools/metadata?dataSourceId=test-ds-id&database=test_db&schema=public&name=users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: 'Bearer test-api-key',
          },
        })
      );
    });

    it('should throw error with clear message on API errors', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Table not found' }),
      } as Response);

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'public',
          name: 'nonexistent_table',
        })
      ).rejects.toThrow('Table not found');
    });

    it('should handle network errors gracefully', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'public',
          name: 'users',
        })
      ).rejects.toThrow('Network connection failed');
    });

    it('should handle permission errors', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Insufficient permissions' }),
      } as Response);

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'restricted',
          name: 'sensitive_table',
        })
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should handle server errors', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed' }),
      } as Response);

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'public',
          name: 'users',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle malformed error responses', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'public',
          name: 'users',
        })
      ).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle generic metadata retrieval failures', async () => {
      const executeHandler = createRetrieveMetadataExecute(mockContext);

      vi.mocked(fetch).mockRejectedValueOnce(new Error());

      await expect(
        executeHandler({
          dataSourceId: 'test-ds-id',
          database: 'test_db',
          schema: 'public',
          name: 'users',
        })
      ).rejects.toThrow('Metadata retrieval failed');
    });
  });
});
