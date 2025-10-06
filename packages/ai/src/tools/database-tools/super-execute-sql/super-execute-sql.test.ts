import { checkQueryIsReadOnly } from '@buster/access-controls';
import type { DataSource } from '@buster/data-source';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDataSource } from '../../../utils/get-data-source';
import type { SuperExecuteSqlContext, SuperExecuteSqlState } from './super-execute-sql';
import { createSuperExecuteSqlExecute } from './super-execute-sql-execute';

// Mock dependencies
vi.mock('../../../utils/get-data-source', () => ({
  getDataSource: vi.fn(),
}));

vi.mock('@buster/access-controls', () => ({
  checkQueryIsReadOnly: vi.fn(),
}));

describe('super-execute-sql', () => {
  const mockContext: SuperExecuteSqlContext = {
    dataSourceId: 'test-datasource',
  };

  const mockState: SuperExecuteSqlState = {
    startTime: Date.now(),
    executionTime: undefined,
    isComplete: false,
    executionResults: undefined,
  };

  const mockExecute = vi.fn();
  const mockClose = vi.fn();
  const mockDataSource = {
    execute: mockExecute,
    close: mockClose,
  } as unknown as DataSource;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockState.startTime = Date.now();
    mockState.executionTime = undefined;
    mockState.isComplete = false;
    mockState.executionResults = undefined;

    // Setup default mocks
    vi.mocked(getDataSource).mockResolvedValue(mockDataSource);
    vi.mocked(checkQueryIsReadOnly).mockReturnValue({ isReadOnly: true });
    mockClose.mockResolvedValue(undefined);
  });

  describe('createSuperExecuteSqlExecute', () => {
    it('should execute SQL statements successfully', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      mockExecute.mockResolvedValue({
        success: true,
        rows: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
      });

      const result = await executeHandler({
        statements: ['SELECT * FROM test_table'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        sql: 'SELECT * FROM test_table',
        results: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
      });

      expect(mockState.isComplete).toBe(true);
      expect(mockState.executionResults).toEqual(result.results);
      expect(mockState.executionTime).toBeDefined();
    });

    it('should handle multiple statements', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      mockExecute
        .mockResolvedValueOnce({
          success: true,
          rows: [{ count: 100 }],
        })
        .mockResolvedValueOnce({
          success: true,
          rows: [{ avg_value: 42.5 }],
        });

      const result = await executeHandler({
        statements: ['SELECT COUNT(*) FROM users', 'SELECT AVG(value) FROM metrics'],
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        status: 'success',
        sql: 'SELECT COUNT(*) FROM users',
        results: [{ count: 100 }],
      });
      expect(result.results[1]).toEqual({
        status: 'success',
        sql: 'SELECT AVG(value) FROM metrics',
        results: [{ avg_value: 42.5 }],
      });
    });

    it('should reject non-read-only queries', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      vi.mocked(checkQueryIsReadOnly).mockReturnValue({
        isReadOnly: false,
        error: 'Only SELECT statements are allowed',
      });

      const result = await executeHandler({
        statements: ['DELETE FROM users WHERE id = 1'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        sql: 'DELETE FROM users WHERE id = 1',
        error_message: 'Only SELECT statements are allowed',
      });

      // Should not have called execute since query was rejected
      expect(mockDataSource.execute).not.toHaveBeenCalled();
    });

    it('should handle SQL execution errors', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      mockExecute.mockResolvedValue({
        success: false,
        error: { message: 'Table not found' },
      });

      const result = await executeHandler({
        statements: ['SELECT * FROM nonexistent_table'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        sql: 'SELECT * FROM nonexistent_table',
        error_message: 'Table not found',
      });
    });

    it('should handle empty statements array', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      const result = await executeHandler({
        statements: [],
      });

      expect(result.results).toEqual([]);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('should handle invalid input - statements as string', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      mockExecute.mockResolvedValue({
        success: true,
        rows: [{ id: 1 }],
      });

      const result = await executeHandler({
        statements: 'SELECT * FROM users' as any,
      });

      // Should treat string as single statement
      expect(result.results).toHaveLength(1);
      const first = result.results[0];
      expect(first).toBeDefined();
      if (!first) throw new Error('Expected a first result');
      expect(first.sql).toBe('SELECT * FROM users');
    });

    it('should handle invalid input - null statements', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      const result = await executeHandler({
        statements: null as any,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        sql: '',
        error_message: 'Invalid input: statements is required',
      });
    });

    it('should truncate large string values', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      // Updated to test the new 5000 character limit
      const longString = 'a'.repeat(5100);
      mockExecute.mockResolvedValue({
        success: true,
        rows: [{ description: longString }],
      });

      const result = await executeHandler({
        statements: ['SELECT description FROM items'],
      });

      expect(result.results[0]).toBeDefined();
      const first = result.results[0];
      if (!first) throw new Error('Expected a first result');
      expect(first.status).toBe('success');
      if (first.status === 'success') {
        const firstRow = first.results[0];
        expect(firstRow).toBeDefined();
        if (!firstRow) throw new Error('Expected at least one result row');
        const description = firstRow.description as string;
        expect(description).toContain('...[TRUNCATED');
        expect(description.length).toBeLessThan(longString.length);
      }
    });

    it('should handle timeout and retry', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      // First call times out, second succeeds
      mockExecute
        .mockResolvedValueOnce({
          success: false,
          error: { message: 'Query timeout' },
        })
        .mockResolvedValueOnce({
          success: true,
          rows: [{ id: 1 }],
        });

      const result = await executeHandler({
        statements: ['SELECT * FROM large_table'],
      });

      // Should have retried and succeeded
      expect(mockExecute).toHaveBeenCalledTimes(2);
      expect(result.results[0]).toEqual({
        status: 'success',
        sql: 'SELECT * FROM large_table',
        results: [{ id: 1 }],
      });
    });

    it('should handle data source connection errors', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      vi.mocked(getDataSource).mockRejectedValue(new Error('Connection failed'));

      const result = await executeHandler({
        statements: ['SELECT 1'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        sql: 'SELECT 1',
        error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
      });
    });

    it('should stringify objects in results', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      // Reset the mock to resolve properly for this test
      vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

      mockExecute.mockResolvedValue({
        success: true,
        rows: [
          {
            id: 1,
            metadata: { key: 'value', nested: { data: 'test' } },
          },
        ],
      });

      const result = await executeHandler({
        statements: ['SELECT * FROM items'],
      });

      const first = result.results[0];
      expect(first).toBeDefined();
      if (!first) throw new Error('Expected a first result');
      expect(first.status).toBe('success');
      if (first.status === 'success') {
        const firstRow = first.results[0];
        expect(firstRow).toBeDefined();
        if (!firstRow) throw new Error('Expected at least one result row');
        const metadata = firstRow.metadata as string;
        expect(typeof metadata).toBe('string');
        expect(metadata).toBe('{"key":"value","nested":{"data":"test"}}');
      }
    });

    it('should apply smart truncation to large JSON objects', async () => {
      const executeHandler = createSuperExecuteSqlExecute(mockState, mockContext);

      // Reset the mock to resolve properly for this test
      vi.mocked(getDataSource).mockResolvedValue(mockDataSource);

      // Create a large object that exceeds 500 char budget
      const largeObject = {
        field1: 'a'.repeat(100),
        field2: 'b'.repeat(100),
        field3: 'c'.repeat(100),
        field4: 'd'.repeat(100),
        field5: 'e'.repeat(100),
        field6: 'f'.repeat(100),
      };

      mockExecute.mockResolvedValue({
        success: true,
        rows: [{ data: largeObject }],
      });

      const result = await executeHandler({
        statements: ['SELECT * FROM items'],
      });

      const first = result.results[0];
      expect(first).toBeDefined();
      if (!first) throw new Error('Expected a first result');
      expect(first.status).toBe('success');
      if (first.status === 'success') {
        const firstRow = first.results[0];
        expect(firstRow).toBeDefined();
        if (!firstRow) throw new Error('Expected at least one result row');
        const data = firstRow.data as string;
        expect(typeof data).toBe('string');
        // Should be stringified and contain truncation indicators
        expect(data).toContain('...[100 chars total]');
        // Should be around 500-700 chars (500 budget + overhead for structure and indicators)
        expect(data.length).toBeGreaterThan(400);
        expect(data.length).toBeLessThan(800);
      }
    });
  });
});
