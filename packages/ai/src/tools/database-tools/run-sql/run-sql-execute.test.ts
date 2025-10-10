import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunSqlContext, RunSqlOutput } from './run-sql';
import { createRunSqlExecute } from './run-sql-execute';

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

describe('run-sql-execute error handling', () => {
  const mockContext: RunSqlContext = {
    apiKey: 'test-api-key',
    apiUrl: 'http://localhost:3000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRunSqlExecute', () => {
    it('should execute SQL query successfully', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      const mockResponse: RunSqlOutput = {
        data: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
        data_metadata: {
          id: { type: 'integer' },
          name: { type: 'string' },
        },
        has_more_records: false,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await executeHandler({
        data_source_id: 'test-ds-id',
        sql: 'SELECT * FROM users LIMIT 2',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v2/tools/sql',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
          body: JSON.stringify({
            data_source_id: 'test-ds-id',
            sql: 'SELECT * FROM users LIMIT 2',
          }),
        })
      );
    });

    it('should throw error with clear message on API errors', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid SQL query' }),
      } as Response);

      await expect(
        executeHandler({
          data_source_id: 'test-ds-id',
          sql: 'INVALID SQL',
        })
      ).rejects.toThrow('Invalid SQL query');
    });

    it('should retry on timeout errors', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      const mockResponse: RunSqlOutput = {
        data: [{ result: 'success' }],
        data_metadata: {},
        has_more_records: false,
      };

      // First call times out, second succeeds
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Query timed out' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

      const result = await executeHandler({
        data_source_id: 'test-ds-id',
        sql: 'SELECT * FROM large_table',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      // Mock all retries to timeout
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Query timeout' }),
      } as Response);

      await expect(
        executeHandler({
          data_source_id: 'test-ds-id',
          sql: 'SELECT * FROM large_table',
        })
      ).rejects.toThrow();

      // Should have tried 4 times (1 initial + 3 retries)
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('should handle network errors gracefully', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        executeHandler({
          data_source_id: 'test-ds-id',
          sql: 'SELECT 1',
        })
      ).rejects.toThrow('Network error');
    });

    it('should throw error for empty SQL query', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      await expect(
        executeHandler({
          data_source_id: 'test-ds-id',
          sql: '',
        })
      ).rejects.toThrow('SQL query cannot be empty');
    });

    it('should handle non-timeout errors without retrying', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Permission denied' }),
      } as Response);

      await expect(
        executeHandler({
          data_source_id: 'test-ds-id',
          sql: 'SELECT * FROM secure_table',
        })
      ).rejects.toThrow('Permission denied');

      // Should not retry for non-timeout errors
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch failures with timeout detection', async () => {
      const executeHandler = createRunSqlExecute(mockContext);

      const mockResponse: RunSqlOutput = {
        data: [{ id: 1 }],
        data_metadata: {},
        has_more_records: false,
      };

      // First call throws fetch failed, second succeeds
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

      const result = await executeHandler({
        data_source_id: 'test-ds-id',
        sql: 'SELECT 1',
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
