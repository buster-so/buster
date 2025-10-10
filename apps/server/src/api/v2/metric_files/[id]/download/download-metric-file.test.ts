import { checkPermission } from '@buster/access-controls';
import { getUserOrganizationId } from '@buster/database/queries';
import { tasks } from '@trigger.dev/sdk';
import { HTTPException } from 'hono/http-exception';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadMetricFileHandler } from './download-metric-file';

// Mock all external dependencies
vi.mock('@buster/access-controls');
vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');
vi.mock('@trigger.dev/sdk', () => ({
  tasks: {
    trigger: vi.fn(),
  },
  runs: {
    retrieve: vi.fn(),
  },
}));

describe('downloadMetricFileHandler', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockMetricId = 'metric-456';
  const mockOrganizationId = 'org-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Access Control', () => {
    it('should throw 403 if user is not part of an organization', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue(null);

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toThrow(
        HTTPException
      );

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 403,
        message: 'You must be part of an organization to download metric files',
      });
    });

    it('should throw 403 if user does not have permission to view the metric file', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: false,
      });

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toThrow(
        HTTPException
      );

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 403,
        message: 'You do not have permission to download this metric file',
      });

      // Verify permission check was called with correct parameters
      expect(checkPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: mockMetricId,
        assetType: 'metric_file',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
      });
    });

    it('should proceed with export when user has permission', async () => {
      const mockTaskHandle = { id: 'task-handle-123' };

      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_view',
        accessPath: 'direct',
      });

      vi.mocked(tasks.trigger).mockResolvedValue(mockTaskHandle as any);

      // Mock successful task completion
      const { runs } = await import('@trigger.dev/sdk');
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: true,
          downloadUrl: 'https://example.com/download',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
          fileSize: 1024,
          fileName: 'metric-456.csv',
          rowCount: 100,
        },
      } as any);

      const result = await downloadMetricFileHandler(mockMetricId, mockUser as any);

      // Verify permission check was performed
      expect(checkPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: mockMetricId,
        assetType: 'metric_file',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
      });

      // Verify task was triggered with correct parameters and idempotency
      expect(tasks.trigger).toHaveBeenCalledWith(
        'export-metric-data',
        {
          metricId: mockMetricId,
          userId: mockUser.id,
          organizationId: mockOrganizationId,
          reportFileId: undefined,
          metricVersionNumber: undefined,
        },
        {
          idempotencyKey: `export-${mockUser.id}-${mockMetricId}`,
          idempotencyKeyTTL: '2m',
        }
      );

      // Verify successful response
      expect(result).toMatchObject({
        downloadUrl: 'https://example.com/download',
        fileSize: 1024,
        fileName: 'metric-456.csv',
        rowCount: 100,
        message: 'Download link expires in 2 minutes. Please start your download immediately.',
      });
    });

    it('should respect different permission levels', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      // Test with 'owner' permission
      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'owner',
        accessPath: 'direct',
      });

      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: true,
          downloadUrl: 'https://example.com/download',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      } as any);

      await downloadMetricFileHandler(mockMetricId, mockUser as any);

      expect(checkPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: mockMetricId,
        assetType: 'metric_file',
        requiredRole: 'can_view',
        organizationId: mockOrganizationId,
      });
    });

    it('should handle workspace sharing permissions', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      // Simulate access through workspace sharing
      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_view',
        accessPath: 'workspace_sharing',
      });

      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: true,
          downloadUrl: 'https://example.com/download',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      } as any);

      await downloadMetricFileHandler(mockMetricId, mockUser as any);

      expect(checkPermission).toHaveBeenCalled();
      expect(tasks.trigger).toHaveBeenCalled();
    });

    it('should handle cascading permissions', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      // Simulate access through cascading permissions (e.g., from parent collection)
      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_edit',
        accessPath: 'cascading',
      });

      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: true,
          downloadUrl: 'https://example.com/download',
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        },
      } as any);

      await downloadMetricFileHandler(mockMetricId, mockUser as any);

      expect(checkPermission).toHaveBeenCalled();
      expect(tasks.trigger).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Setup basic mocks for permission checks to pass
      vi.mocked(getUserOrganizationId).mockResolvedValue({
        organizationId: mockOrganizationId,
        userId: mockUser.id,
        role: 'member',
      } as any);

      vi.mocked(checkPermission).mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_view',
        accessPath: 'direct',
      });
    });

    it('should handle task failure', async () => {
      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'FAILED',
      } as any);

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toThrow(
        HTTPException
      );

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 500,
        message: 'Export task failed',
      });
    });

    it.skip('should handle timeout', async () => {
      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');

      // Simulate task still in progress after timeout
      vi.mocked(runs.retrieve).mockImplementation((() => {
        // Always return EXECUTING status to simulate timeout
        return Promise.resolve({ status: 'EXECUTING' } as any);
      }) as any);

      // Use fake timers
      vi.useFakeTimers();

      const promise = downloadMetricFileHandler(mockMetricId, mockUser as any);

      // Advance time past the timeout (2 minutes + buffer)
      await vi.advanceTimersByTimeAsync(125000);

      // Verify the promise rejects with the expected error
      await expect(promise).rejects.toThrow(HTTPException);

      // Clean up timers
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('should handle specific error codes from export task', async () => {
      vi.mocked(tasks.trigger).mockResolvedValue({ id: 'task-123' } as any);

      const { runs } = await import('@trigger.dev/sdk');

      // Test UNAUTHORIZED error code
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: false,
          error: 'Access denied to data source',
          errorCode: 'UNAUTHORIZED',
        },
      } as any);

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 403,
        message: 'Access denied to data source',
      });

      // Test NOT_FOUND error code
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: false,
          error: 'Metric not found',
          errorCode: 'NOT_FOUND',
        },
      } as any);

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 404,
        message: 'Metric file not found or data source credentials missing',
      });

      // Test QUERY_ERROR
      vi.mocked(runs.retrieve).mockResolvedValue({
        status: 'COMPLETED',
        output: {
          success: false,
          error: 'SQL syntax error',
          errorCode: 'QUERY_ERROR',
        },
      } as any);

      await expect(downloadMetricFileHandler(mockMetricId, mockUser as any)).rejects.toMatchObject({
        status: 400,
        message: 'Query execution failed: SQL syntax error',
      });
    });
  });
});
