import type { User } from '@buster/database/queries';
import type { deploy } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deployHandler } from './POST';

// Mock all database functions
vi.mock('@buster/database/queries', () => ({
  getUserOrganizationId: vi.fn(),
  getDataSourceByName: vi.fn(),
  upsertDataset: vi.fn(),
  upsertDoc: vi.fn(),
  deleteLogsWriteBackConfig: vi.fn(),
  getDataSourceCredentials: vi.fn(),
  upsertLogsWriteBackConfig: vi.fn(),
}));

vi.mock('@buster/database/connection', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

import { db } from '@buster/database/connection';
import {
  getDataSourceByName,
  getUserOrganizationId,
  upsertDataset,
  upsertDoc,
} from '@buster/database/queries';

const mockGetUserOrganizationId = vi.mocked(getUserOrganizationId);
const mockGetDataSourceByName = vi.mocked(getDataSourceByName);
const mockUpsertDataset = vi.mocked(upsertDataset);
const mockUpsertDoc = vi.mocked(upsertDoc);
const mockDbTransaction = vi.mocked(db.transaction);

describe('deployHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockRequest: deploy.UnifiedDeployRequest = {
    models: [
      {
        name: 'test_model',
        data_source_name: 'test_datasource',
        database: 'test_db',
        schema: 'public',
        description: 'Test model',
        sql_definition: 'SELECT * FROM test',
        yml_file: 'model: test',
        columns: [
          {
            name: 'id',
            description: 'ID column',
            semantic_type: 'dimension',
            type: 'integer',
            searchable: false,
          },
        ],
      },
    ],
    docs: [
      {
        name: 'README.md',
        content: '# Documentation',
        type: 'normal',
      },
      {
        name: 'ANALYST.md',
        content: '# Analyst Guide',
        type: 'analyst',
      },
    ],
    deleteAbsentModels: true,
    deleteAbsentDocs: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockDbTransaction.mockImplementation(async (callback) => {
      return callback({} as any); // Mock transaction object
    });
  });

  describe('permission checks', () => {
    it('should throw 401 if user has no organization', async () => {
      mockGetUserOrganizationId.mockResolvedValue(null);

      await expect(deployHandler(mockRequest, mockUser)).rejects.toThrow(
        new HTTPException(401, {
          message: 'User is not associated with an organization',
        })
      );
    });

    // Removed test case for null organizationId as the actual function
    // returns null when there's no organization, not an object with null organizationId

    it('should throw 403 if user lacks sufficient permissions', async () => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'viewer',
      });

      await expect(deployHandler(mockRequest, mockUser)).rejects.toThrow(
        new HTTPException(403, {
          message: 'Insufficient permissions. Only workspace admins and data admins can deploy.',
        })
      );
    });

    it('should allow workspace_admin to deploy', async () => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });

      mockGetDataSourceByName.mockResolvedValue({
        id: 'ds-123',
        name: 'test_datasource',
        type: 'postgresql',
        organizationId: 'org-123',
      });

      mockUpsertDataset.mockResolvedValue({ datasetId: 'dataset-123', updated: false });
      mockUpsertDoc.mockResolvedValue({} as any);

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.models.summary.successCount).toBe(1);
      expect(result.docs.summary.createdCount).toBe(2);
    });

    it('should allow data_admin to deploy', async () => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'data_admin',
      });

      mockGetDataSourceByName.mockResolvedValue({
        id: 'ds-123',
        name: 'test_datasource',
        type: 'postgresql',
        organizationId: 'org-123',
      });

      mockUpsertDataset.mockResolvedValue({ datasetId: 'dataset-123', updated: false });
      mockUpsertDoc.mockResolvedValue({} as any);

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.models.summary.successCount).toBe(1);
      expect(result.docs.summary.createdCount).toBe(2);
    });
  });

  describe('model deployment', () => {
    beforeEach(() => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
    });

    it('should successfully deploy new model', async () => {
      mockGetDataSourceByName.mockResolvedValue({
        id: 'ds-123',
        name: 'test_datasource',
        type: 'postgresql',
        organizationId: 'org-123',
      });

      mockUpsertDataset.mockResolvedValue({ datasetId: 'dataset-123', updated: false });
      mockUpsertDoc.mockResolvedValue({} as any);

      const result = await deployHandler(mockRequest, mockUser);

      expect(mockUpsertDataset).toHaveBeenCalledWith({
        name: 'test_model',
        dataSourceId: 'ds-123',
        organizationId: 'org-123',
        database: 'test_db',
        schema: 'public',
        description: 'Test model',
        sql_definition: 'SELECT * FROM test',
        yml_file: 'model: test',
        userId: 'user-123',
      });

      expect(result.models.success).toEqual([
        {
          name: 'test_model',
          dataSource: 'test_datasource',
        },
      ]);
      expect(result.models.summary.successCount).toBe(1);
      expect(result.models.summary.updateCount).toBe(0);
    });

    it('should handle model updates', async () => {
      mockGetDataSourceByName.mockResolvedValue({
        id: 'ds-123',
        name: 'test_datasource',
        type: 'postgresql',
        organizationId: 'org-123',
      });

      mockUpsertDataset.mockResolvedValue({ datasetId: 'dataset-123', updated: true });
      mockUpsertDoc.mockResolvedValue({} as any);

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.models.updated).toEqual([
        {
          name: 'test_model',
          dataSource: 'test_datasource',
        },
      ]);
      expect(result.models.summary.successCount).toBe(0);
      expect(result.models.summary.updateCount).toBe(1);
    });

    it('should handle missing data source', async () => {
      mockGetDataSourceByName.mockResolvedValue(null);
      mockUpsertDoc.mockResolvedValue({} as any);

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.models.failures).toEqual([
        {
          name: 'test_model',
          errors: ["Data source 'test_datasource' not found"],
        },
      ]);
      expect(result.models.summary.failureCount).toBe(1);
    });

    it('should handle model deployment errors', async () => {
      mockGetDataSourceByName.mockResolvedValue({
        id: 'ds-123',
        name: 'test_datasource',
        type: 'postgresql',
        organizationId: 'org-123',
      });

      mockUpsertDataset.mockRejectedValue(new Error('Database constraint violation'));
      mockUpsertDoc.mockResolvedValue({} as any);

      // Mock console.error to avoid test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.models.failures).toEqual([
        {
          name: 'test_model',
          errors: ['Database constraint violation'],
        },
      ]);
      expect(result.models.summary.failureCount).toBe(1);

      consoleSpy.mockRestore();
    });

    it('should handle multiple models with mixed results', async () => {
      const multiModelRequest: deploy.UnifiedDeployRequest = {
        models: [
          {
            name: 'model1',
            data_source_name: 'ds1',
            schema: 'public',
            description: '',
            columns: [],
          },
          {
            name: 'model2',
            data_source_name: 'missing_ds',
            schema: 'public',
            description: '',
            columns: [],
          },
          {
            name: 'model3',
            data_source_name: 'ds1',
            schema: 'public',
            description: '',
            columns: [],
          },
        ],
        docs: [],
        deleteAbsentModels: false,
        deleteAbsentDocs: false,
      };

      mockGetDataSourceByName
        .mockResolvedValueOnce({
          id: 'ds-123',
          name: 'ds1',
          type: 'postgresql',
          organizationId: 'org-123',
        })
        .mockResolvedValueOnce(null) // missing_ds
        .mockResolvedValueOnce({
          id: 'ds-123',
          name: 'ds1',
          type: 'postgresql',
          organizationId: 'org-123',
        });

      mockUpsertDataset
        .mockResolvedValueOnce({ datasetId: 'dataset-1', updated: false })
        .mockResolvedValueOnce({ datasetId: 'dataset-2', updated: true });

      const result = await deployHandler(multiModelRequest, mockUser);

      expect(result.models.summary.successCount).toBe(1);
      expect(result.models.summary.updateCount).toBe(1);
      expect(result.models.summary.failureCount).toBe(1);
      expect(result.models.failures[0]?.name).toBe('model2');
    });
  });

  describe('doc deployment', () => {
    beforeEach(() => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
    });

    it('should successfully deploy docs', async () => {
      mockUpsertDoc.mockResolvedValue({} as any);

      const docsOnlyRequest: deploy.UnifiedDeployRequest = {
        models: [],
        docs: [
          { name: 'README.md', content: '# Readme', type: 'normal' },
          { name: 'ANALYST.md', content: '# Analyst', type: 'analyst' },
        ],
        deleteAbsentModels: false,
        deleteAbsentDocs: false,
      };

      const result = await deployHandler(docsOnlyRequest, mockUser);

      expect(mockUpsertDoc).toHaveBeenCalledTimes(2);
      expect(mockUpsertDoc).toHaveBeenCalledWith({
        name: 'README.md',
        content: '# Readme',
        type: 'normal',
        organizationId: 'org-123',
      });
      expect(mockUpsertDoc).toHaveBeenCalledWith({
        name: 'ANALYST.md',
        content: '# Analyst',
        type: 'analyst',
        organizationId: 'org-123',
      });

      expect(result.docs.created).toEqual(['README.md', 'ANALYST.md']);
      expect(result.docs.summary.createdCount).toBe(2);
    });

    it('should handle doc deployment errors', async () => {
      mockUpsertDoc
        .mockResolvedValueOnce({} as any)
        .mockRejectedValueOnce(new Error('Doc storage error'));

      // Mock console.error to avoid test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await deployHandler(mockRequest, mockUser);

      expect(result.docs.created).toEqual(['README.md']);
      expect(result.docs.failed).toEqual([
        {
          name: 'ANALYST.md',
          error: 'Doc storage error',
        },
      ]);
      expect(result.docs.summary.createdCount).toBe(1);
      expect(result.docs.summary.failedCount).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
    });

    it('should handle transaction failures', async () => {
      mockDbTransaction.mockRejectedValue(new Error('Transaction failed'));

      // Mock console.error to avoid test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(deployHandler(mockRequest, mockUser)).rejects.toThrow(
        new HTTPException(500, {
          message: 'Transaction failed',
        })
      );

      consoleSpy.mockRestore();
    });

    it('should re-throw HTTPExceptions without wrapping', async () => {
      mockDbTransaction.mockRejectedValue(
        new HTTPException(503, { message: 'Service unavailable' })
      );

      // Mock console.error to avoid test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(deployHandler(mockRequest, mockUser)).rejects.toThrow(
        new HTTPException(503, { message: 'Service unavailable' })
      );

      consoleSpy.mockRestore();
    });

    it('should wrap unknown errors in 500 HTTPException', async () => {
      mockDbTransaction.mockRejectedValue('Unknown error type');

      // Mock console.error to avoid test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(deployHandler(mockRequest, mockUser)).rejects.toThrow(
        new HTTPException(500, {
          message: 'Deployment failed',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('empty requests', () => {
    beforeEach(() => {
      mockGetUserOrganizationId.mockResolvedValue({
        organizationId: 'org-123',
        role: 'workspace_admin',
      });
    });

    it('should handle empty models and docs', async () => {
      const emptyRequest: deploy.UnifiedDeployRequest = {
        models: [],
        docs: [],
        deleteAbsentModels: false,
        deleteAbsentDocs: false,
      };

      const result = await deployHandler(emptyRequest, mockUser);

      expect(result.models.summary.totalModels).toBe(0);
      expect(result.docs.summary.totalDocs).toBe(0);
      expect(mockUpsertDataset).not.toHaveBeenCalled();
      expect(mockUpsertDoc).not.toHaveBeenCalled();
    });
  });
});
