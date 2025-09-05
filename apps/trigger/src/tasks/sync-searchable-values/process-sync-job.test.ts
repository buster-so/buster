import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processSyncJob } from './process-sync-job';
import type { SyncJobPayload } from './types';

// Extract the run function from the task
const runTask = (processSyncJob as any).run;

// Mock all external dependencies
vi.mock('@buster/ai', () => ({
  generateSearchableValueEmbeddings: vi.fn(),
}));

vi.mock('@buster/data-source', () => ({
  createAdapter: vi.fn(),
  getDefaultProvider: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  getDataSourceCredentials: vi.fn(),
  markSyncJobCompleted: vi.fn(),
  markSyncJobFailed: vi.fn(),
}));

vi.mock('@buster/search', () => ({
  deduplicateValues: vi.fn(),
  generateNamespace: vi.fn(),
  queryExistingKeys: vi.fn(),
  upsertSearchableValues: vi.fn(),
  processWithCache: vi.fn(),
  updateCache: vi.fn(),
}));

vi.mock('@trigger.dev/sdk', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  },
  schemaTask: vi.fn((config) => ({
    ...config,
    run: config.run,
  })),
}));

// Import mocked modules
import { generateSearchableValueEmbeddings } from '@buster/ai';
import { createAdapter, getDefaultProvider } from '@buster/data-source';
import {
  getDataSourceCredentials,
  markSyncJobCompleted,
  markSyncJobFailed,
} from '@buster/database';
import {
  deduplicateValues,
  generateNamespace,
  processWithCache,
  queryExistingKeys,
  updateCache,
  upsertSearchableValues,
} from '@buster/search';

describe('processSyncJob', () => {
  const mockPayload: SyncJobPayload = {
    jobId: 'test-job-123',
    dataSourceId: 'ds-456',
    databaseName: 'test_db',
    schemaName: 'public',
    tableName: 'customers',
    columnName: 'company_name',
    maxValues: 1000,
  };

  const mockAdapter = {
    testConnection: vi.fn(),
    close: vi.fn(),
    query: vi.fn(),
    initialize: vi.fn(),
    executeBulk: vi.fn(),
    getMetadata: vi.fn(),
    isConnected: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations to default behavior
    vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
    vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
    vi.mocked(markSyncJobCompleted).mockResolvedValue({
      id: 'test-job-123',
      status: 'success',
      updatedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      errorMessage: null,
    });
    vi.mocked(markSyncJobFailed).mockResolvedValue({
      id: 'test-job-123',
      status: 'failed',
      updatedAt: new Date().toISOString(),
      lastSyncedAt: null,
      errorMessage: 'Error message',
    });
    mockAdapter.testConnection.mockResolvedValue(undefined);
    mockAdapter.close.mockResolvedValue(undefined);
    mockAdapter.query.mockResolvedValue({ rows: [], fields: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful sync workflow', () => {
    it('should complete full sync workflow with new values', async () => {
      // Setup mocks for successful flow
      const mockCredentials = { type: 'postgresql', host: 'localhost' };
      const mockDistinctValues = ['Apple Inc.', 'Google LLC', 'Microsoft Corp'];
      const mockEmbeddings = [
        [0.1, 0.2, 0.3], // Google LLC embedding
        [0.4, 0.5, 0.6], // Microsoft Corp embedding
      ];

      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue(mockCredentials);
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: mockDistinctValues.map((v) => ({ value: v })),
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: ['Apple Inc.'],
        newValues: ['Google LLC', 'Microsoft Corp'],
        totalValues: 3,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue(mockEmbeddings);
      vi.mocked(upsertSearchableValues).mockResolvedValue({
        namespace: 'ds-456',
        upserted: 2,
        errors: [],
      });
      vi.mocked(updateCache).mockResolvedValue(true);

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify result
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: true,
        processedCount: 3,
        existingCount: 1,
        newCount: 2,
        duration: expect.any(Number),
      });

      // Verify workflow steps were called correctly
      expect(getDataSourceCredentials).toHaveBeenCalledWith({
        dataSourceId: 'ds-456',
      });
      expect(createAdapter).toHaveBeenCalledWith(mockCredentials);
      expect(mockAdapter.testConnection).toHaveBeenCalled();
      expect(mockAdapter.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT "company_name"')
      );
      expect(processWithCache).toHaveBeenCalledWith(
        'ds-456',
        'test_db',
        'public',
        'customers',
        'company_name',
        mockDistinctValues,
        mockStorageProvider
      );
      expect(generateSearchableValueEmbeddings).toHaveBeenCalledWith([
        'Google LLC',
        'Microsoft Corp',
      ]);
      expect(upsertSearchableValues).toHaveBeenCalledWith({
        dataSourceId: 'ds-456',
        values: expect.arrayContaining([
          expect.objectContaining({
            value: 'Google LLC',
            embedding: [0.1, 0.2, 0.3],
          }),
          expect.objectContaining({
            value: 'Microsoft Corp',
            embedding: [0.4, 0.5, 0.6],
          }),
        ]),
      });
      expect(markSyncJobCompleted).toHaveBeenCalledWith(
        'test-job-123',
        expect.objectContaining({
          processedCount: 3,
          existingCount: 1,
          newCount: 2,
        })
      );
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should handle case when no values need syncing (empty column)', async () => {
      // Setup mocks for empty column
      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      mockAdapter.query.mockResolvedValue({
        rows: [],
        fields: [],
      });

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify result
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: true,
        processedCount: 0,
        existingCount: 0,
        newCount: 0,
        duration: expect.any(Number),
      });

      // Verify early exit
      expect(markSyncJobCompleted).toHaveBeenCalledWith(
        'test-job-123',
        expect.objectContaining({
          processedCount: 0,
          existingCount: 0,
          newCount: 0,
        })
      );
      expect(processWithCache).not.toHaveBeenCalled();
      expect(generateSearchableValueEmbeddings).not.toHaveBeenCalled();
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should handle case when all values already exist', async () => {
      // Setup mocks for all existing values
      const mockDistinctValues = ['Apple Inc.', 'Google LLC'];
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: mockDistinctValues.map((v) => ({ value: v })),
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: true,
        existingValues: ['Apple Inc.', 'Google LLC'],
        newValues: [],
        totalValues: 2,
      });

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify result
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: true,
        processedCount: 2,
        existingCount: 2,
        newCount: 0,
        duration: expect.any(Number),
      });

      // Verify no embeddings or upserts were needed
      expect(generateSearchableValueEmbeddings).not.toHaveBeenCalled();
      expect(upsertSearchableValues).not.toHaveBeenCalled();
      expect(markSyncJobCompleted).toHaveBeenCalledWith(
        'test-job-123',
        expect.objectContaining({
          processedCount: 2,
          existingCount: 2,
          newCount: 0,
        })
      );
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should create namespace if it does not exist', async () => {
      // Setup mocks with non-existing namespace
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: [{ value: 'Test Company' }],
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: ['Test Company'],
        totalValues: 1,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue([[0.1, 0.2, 0.3]]);
      vi.mocked(upsertSearchableValues).mockResolvedValue({
        namespace: 'ds-456',
        upserted: 1,
        errors: [],
      });
      vi.mocked(updateCache).mockResolvedValue(true);

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify namespace creation
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle credential fetch errors', async () => {
      // Setup mock to fail credential fetch
      vi.mocked(getDataSourceCredentials).mockRejectedValue(
        new Error('Failed to fetch credentials from vault')
      );

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify error handling
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: false,
        error: 'Failed to fetch credentials from vault',
      });
      expect(markSyncJobFailed).toHaveBeenCalledWith(
        'test-job-123',
        'Failed to fetch credentials from vault'
      );
    });

    it('should handle database connection errors', async () => {
      // Setup mock to fail connection
      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      mockAdapter.testConnection.mockRejectedValue(new Error('Connection timeout'));

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify error handling
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: false,
        error: 'Connection timeout',
      });
      expect(markSyncJobFailed).toHaveBeenCalledWith('test-job-123', 'Connection timeout');
      expect(mockAdapter.close).toHaveBeenCalled(); // Cleanup attempted
    });

    it('should handle query execution errors', async () => {
      // Setup mock to fail query
      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      mockAdapter.query.mockRejectedValue(new Error('Table not found'));

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify error handling
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: false,
        error: expect.stringContaining('Failed to query distinct values'),
      });
      expect(markSyncJobFailed).toHaveBeenCalled();
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should handle embedding generation errors', async () => {
      // Setup mocks up to embedding generation
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: [{ value: 'Test Company' }],
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: ['Test Company'],
        totalValues: 1,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockRejectedValue(
        new Error('OpenAI API rate limit exceeded')
      );

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify error handling
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: false,
        error: 'OpenAI API rate limit exceeded',
      });
      expect(markSyncJobFailed).toHaveBeenCalledWith(
        'test-job-123',
        'OpenAI API rate limit exceeded'
      );
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should handle Turbopuffer upsert errors', async () => {
      // Setup mocks up to upsert
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: [{ value: 'Test Company' }],
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: ['Test Company'],
        totalValues: 1,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue([[0.1, 0.2, 0.3]]);
      vi.mocked(upsertSearchableValues).mockRejectedValue(new Error('Turbopuffer API error'));

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify error handling
      expect(result).toEqual({
        jobId: 'test-job-123',
        success: false,
        error: 'Turbopuffer API error',
      });
      expect(markSyncJobFailed).toHaveBeenCalledWith('test-job-123', 'Turbopuffer API error');
      expect(mockAdapter.close).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      // Setup mocks with disconnect failure
      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      mockAdapter.query.mockResolvedValue({
        rows: [],
        fields: [],
      });
      mockAdapter.close.mockRejectedValue(new Error('Failed to close connection'));

      // Execute the task
      const result = await runTask(mockPayload);

      // Should still return success despite disconnect error
      expect(result.success).toBe(true);
      expect(mockAdapter.close).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle values with special characters', async () => {
      // Setup mocks with special characters
      const specialValues = ["O'Reilly Media", 'AT&T', '"Quoted" Company', 'Line\nBreak Corp'];
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: specialValues.map((v) => ({ value: v })),
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: specialValues,
        totalValues: specialValues.length,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue(
        specialValues.map(() => [0.1, 0.2, 0.3])
      );
      vi.mocked(upsertSearchableValues).mockResolvedValue({
        namespace: 'ds-456',
        upserted: specialValues.length,
        errors: [],
      });
      vi.mocked(updateCache).mockResolvedValue(true);

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify handling of special characters
      expect(result.success).toBe(true);
      expect(result.newCount).toBe(specialValues.length);
      expect(generateSearchableValueEmbeddings).toHaveBeenCalledWith(specialValues);
    });

    it('should filter out null and empty values from query results', async () => {
      // Setup mocks with mixed valid/invalid values
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: [
          { value: 'Valid Company' },
          { value: null },
          { value: '' },
          { value: '   ' }, // Only whitespace
          { value: 'Another Valid' },
        ],
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: ['Valid Company', 'Another Valid'],
        totalValues: 2,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);
      vi.mocked(upsertSearchableValues).mockResolvedValue({
        namespace: 'ds-456',
        upserted: 2,
        errors: [],
      });
      vi.mocked(updateCache).mockResolvedValue(true);

      // Execute the task
      const result = await runTask(mockPayload);

      // Verify only valid values were processed
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2); // Only valid values
      expect(processWithCache).toHaveBeenCalledWith(
        'ds-456',
        'test_db',
        'public',
        'customers',
        'company_name',
        ['Valid Company', 'Another Valid'],
        mockStorageProvider
      );
    });

    it('should respect maxValues limit', async () => {
      // Setup payload with small limit
      const limitedPayload = { ...mockPayload, maxValues: 2 };
      const mockStorageProvider = {
        getFile: vi.fn(),
        putFile: vi.fn(),
        deleteFile: vi.fn(),
        listFiles: vi.fn(),
        upload: vi.fn(),
        download: vi.fn(),
        getSignedUrl: vi.fn(),
        delete: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
      } as any;

      // Setup mocks
      vi.mocked(getDataSourceCredentials).mockResolvedValue({ type: 'postgresql' });
      vi.mocked(createAdapter).mockResolvedValue(mockAdapter as any);
      vi.mocked(getDefaultProvider).mockReturnValue(mockStorageProvider);
      mockAdapter.query.mockResolvedValue({
        rows: [{ value: 'Company 1' }, { value: 'Company 2' }],
        fields: [],
      });
      vi.mocked(processWithCache).mockResolvedValue({
        cacheHit: false,
        existingValues: [],
        newValues: ['Company 1', 'Company 2'],
        totalValues: 2,
      });
      vi.mocked(generateSearchableValueEmbeddings).mockResolvedValue([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);
      vi.mocked(upsertSearchableValues).mockResolvedValue({
        namespace: 'ds-456',
        upserted: 2,
        errors: [],
      });
      vi.mocked(updateCache).mockResolvedValue(true);

      // Execute the task
      const result = await runTask(limitedPayload);

      // Verify limit was respected in query
      expect(result.success).toBe(true);
      expect(mockAdapter.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 2'));
    });
  });
});
