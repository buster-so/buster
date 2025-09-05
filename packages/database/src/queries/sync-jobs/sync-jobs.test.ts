import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import * as syncJobs from './index';

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    and: vi.fn(),
    eq: vi.fn(),
    inArray: vi.fn(),
    isNull: vi.fn(),
  },
}));

describe('Sync Jobs Query Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExistingSyncJobs', () => {
    it('should validate and return existing sync jobs grouped by data source', async () => {
      // This test validates the schema structure
      const mockOutput: syncJobs.GetExistingSyncJobsOutput = {
        syncJobs: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
            dataSourceName: 'Test Data Source',
            dataSourceType: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174002',
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
            status: 'pending',
            errorMessage: null,
            lastSyncedAt: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
            dataSourceName: 'Test Data Source',
            dataSourceType: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174002',
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
            status: 'failed',
            errorMessage: 'Connection timeout',
            lastSyncedAt: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 2,
        byDataSource: {
          '123e4567-e89b-12d3-a456-426614174001': {
            dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
            dataSourceName: 'Test Data Source',
            dataSourceType: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174002',
            jobCount: 2,
            jobs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
                dataSourceName: 'Test Data Source',
                dataSourceType: 'postgresql',
                organizationId: '123e4567-e89b-12d3-a456-426614174002',
                databaseName: 'test_db',
                schemaName: 'public',
                tableName: 'users',
                columnName: 'name',
                status: 'pending',
                errorMessage: null,
                lastSyncedAt: null,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
              {
                id: '123e4567-e89b-12d3-a456-426614174003',
                dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
                dataSourceName: 'Test Data Source',
                dataSourceType: 'postgresql',
                organizationId: '123e4567-e89b-12d3-a456-426614174002',
                databaseName: 'test_db',
                schemaName: 'public',
                tableName: 'users',
                columnName: 'email',
                status: 'failed',
                errorMessage: 'Connection timeout',
                lastSyncedAt: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          },
        },
      };

      // Validate output schema
      const validated = syncJobs.GetExistingSyncJobsOutputSchema.parse(mockOutput);
      expect(validated.syncJobs).toHaveLength(2);
      expect(validated.totalCount).toBe(2);
      expect(Object.keys(validated.byDataSource)).toHaveLength(1);
      expect(validated.byDataSource['123e4567-e89b-12d3-a456-426614174001']?.jobCount).toBe(2);
    });

    it('should reject invalid sync job data', () => {
      const invalidData = {
        syncJobs: [
          {
            id: 'not-a-uuid',
            dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
            dataSourceName: 'Test',
            dataSourceType: 'postgresql',
            organizationId: '123e4567-e89b-12d3-a456-426614174002',
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
            status: 'pending',
            errorMessage: null,
            lastSyncedAt: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCount: 1,
        byDataSource: {},
      };

      expect(() => syncJobs.GetExistingSyncJobsOutputSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('createSearchableValuesSyncJob', () => {
    it('should validate sync job creation input', () => {
      const validInput: syncJobs.CreateSyncJobInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        databaseName: 'test_db',
        schemaName: 'public',
        tableName: 'users',
        columnName: 'email',
        syncType: 'daily',
      };

      const validated = syncJobs.CreateSyncJobInputSchema.parse(validInput);
      expect(validated.dataSourceId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(validated.syncType).toBe('daily');
    });

    it('should reject invalid creation input', () => {
      const invalidInput = {
        dataSourceId: 'not-a-uuid',
        databaseName: '',
        schemaName: 'public',
        tableName: 'users',
        columnName: 'email',
      };

      expect(() => syncJobs.CreateSyncJobInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('updateSyncJobStatus', () => {
    it('should validate status update input', () => {
      const validInput: syncJobs.UpdateSyncJobStatusInput = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'success',
        metadata: {
          processedCount: 100,
          existingCount: 50,
          newCount: 50,
          duration: 5000,
          syncedAt: '2024-01-01T00:00:00.000Z',
        },
      };

      const validated = syncJobs.UpdateSyncJobStatusInputSchema.parse(validInput);
      expect(validated.status).toBe('success');
      expect(validated.metadata?.processedCount).toBe(100);
    });

    it('should accept valid status values', () => {
      const statuses = [
        'pending',
        'pending_manual',
        'pending_initial',
        'in_progress',
        'success',
        'failed',
        'cancelled',
        'skipped',
      ];

      for (const status of statuses) {
        const input = {
          jobId: '123e4567-e89b-12d3-a456-426614174000',
          status,
        };
        expect(() => syncJobs.UpdateSyncJobStatusInputSchema.parse(input)).not.toThrow();
      }
    });

    it('should reject invalid status values', () => {
      const invalidInput = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid_status',
      };

      expect(() => syncJobs.UpdateSyncJobStatusInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('batchCreateSyncJobs', () => {
    it('should validate batch creation input', () => {
      const validInput: syncJobs.BatchCreateSyncJobsInput = {
        dataSourceId: '123e4567-e89b-12d3-a456-426614174000',
        syncType: 'manual',
        columns: [
          {
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
          },
          {
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'email',
          },
        ],
      };

      const validated = syncJobs.BatchCreateSyncJobsInputSchema.parse(validInput);
      expect(validated.columns).toHaveLength(2);
      expect(validated.syncType).toBe('manual');
    });

    it('should validate batch creation output', () => {
      const validOutput: syncJobs.BatchCreateSyncJobsOutput = {
        created: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
            databaseName: 'test_db',
            schemaName: 'public',
            tableName: 'users',
            columnName: 'name',
            status: 'pending',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalCreated: 1,
        errors: [
          {
            column: {
              databaseName: 'test_db',
              schemaName: 'public',
              tableName: 'users',
              columnName: 'email',
            },
            error: 'Duplicate entry',
          },
        ],
      };

      const validated = syncJobs.BatchCreateSyncJobsOutputSchema.parse(validOutput);
      expect(validated.totalCreated).toBe(1);
      expect(validated.errors).toHaveLength(1);
    });
  });

  describe('bulkUpdateSyncJobs', () => {
    it('should validate bulk update input', () => {
      const validInput: syncJobs.BulkUpdateSyncJobsInput = {
        jobIds: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        status: 'cancelled',
        errorMessage: 'Batch cancelled by user',
      };

      const validated = syncJobs.BulkUpdateSyncJobsInputSchema.parse(validInput);
      expect(validated.jobIds).toHaveLength(2);
      expect(validated.status).toBe('cancelled');
      expect(validated.errorMessage).toBe('Batch cancelled by user');
    });

    it('should reject empty job IDs array', () => {
      const invalidInput = {
        jobIds: [],
        status: 'cancelled',
      };

      expect(() => syncJobs.BulkUpdateSyncJobsInputSchema.parse(invalidInput)).toThrow(z.ZodError);
    });
  });

  describe('getSyncJobStatus', () => {
    it('should validate get status input', () => {
      const validInput: syncJobs.GetSyncJobStatusInput = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const validated = syncJobs.GetSyncJobStatusInputSchema.parse(validInput);
      expect(validated.jobId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should validate get status output', () => {
      const validOutput: syncJobs.GetSyncJobStatusOutput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        dataSourceId: '123e4567-e89b-12d3-a456-426614174001',
        databaseName: 'test_db',
        schemaName: 'public',
        tableName: 'users',
        columnName: 'email',
        status: 'in_progress',
        lastSyncedAt: null,
        errorMessage: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const validated = syncJobs.GetSyncJobStatusOutputSchema.parse(validOutput);
      expect(validated.status).toBe('in_progress');
      expect(validated.lastSyncedAt).toBeNull();
    });
  });
});
