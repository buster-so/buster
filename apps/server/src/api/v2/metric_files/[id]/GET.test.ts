import type { User } from '@buster/database/queries';
import { DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMetricResponse,
  fetchAndProcessMetricData,
} from '../../../../shared-helpers/metric-helpers';
import { getMetricHandler } from './getMetricHandler';

// Mock the metric helpers
vi.mock('../../../../shared-helpers/metric-helpers', () => ({
  fetchAndProcessMetricData: vi.fn(),
  buildMetricResponse: vi.fn(),
}));

describe('getMetricHandler', () => {
  const mockFetchAndProcessMetricData = fetchAndProcessMetricData as Mock;
  const mockBuildMetricResponse = buildMetricResponse as Mock;

  // Mock data
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockProcessedData = {
    metricFile: {
      id: 'metric-123',
      name: 'Test Metric',
      fileName: 'test-metric.yml',
      organizationId: 'org-123',
      dataSourceId: 'ds-123',
      content: {
        name: 'Test Metric',
        description: 'A test metric',
        timeFrame: 'last_7_days',
        sql: 'SELECT COUNT(*) as count FROM users',
        chartConfig: DEFAULT_CHART_CONFIG,
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      createdBy: 'user-123',
      publiclyAccessible: false,
      publicExpiryDate: null,
      publicPassword: null,
      publiclyEnabledBy: null,
      workspaceSharing: 'none',
      verification: 'verified',
      dataMetadata: {},
      evaluationScore: 0.8,
      evaluationSummary: 'Good metric',
      evaluationObj: null,
      workspaceSharingEnabledAt: null,
      workspaceSharingEnabledBy: null,
      deletedAt: null,
      versionHistory: {},
    },
    resolvedContent: {
      name: 'Test Metric',
      description: 'A test metric',
      timeFrame: 'last_7_days',
      sql: 'SELECT COUNT(*) as count FROM users',
      chartConfig: DEFAULT_CHART_CONFIG,
    },
    resolvedName: 'Test Metric',
    resolvedDescription: 'A test metric',
    resolvedTimeFrame: 'last_7_days',
    resolvedChartConfig: DEFAULT_CHART_CONFIG,
    resolvedSql: 'SELECT COUNT(*) as count FROM users',
    resolvedUpdatedAt: '2023-01-01T00:00:00Z',
    resolvedVersionNum: 1,
    effectiveRole: 'can_view',
    versions: [{ version_number: 1, updated_at: '2023-01-01T00:00:00Z' }],
  };

  const mockMetricResponse = {
    id: 'metric-123',
    type: 'metric_file',
    name: 'Test Metric',
    version_number: 1,
    error: null,
    description: 'A test metric',
    file_name: 'test-metric.yml',
    time_frame: 'last_7_days',
    data_source_id: 'ds-123',
    chart_config: DEFAULT_CHART_CONFIG,
    data_metadata: {},
    status: 'verified',
    file: 'yaml content',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    sent_by_id: 'user-123',
    sent_by_name: '',
    sent_by_avatar_url: null,
    sql: 'SELECT COUNT(*) as count FROM users',
    dashboards: [],
    collections: [],
    versions: [{ version_number: 1, updated_at: '2023-01-01T00:00:00Z' }],
    evaluation_score: 'High',
    evaluation_summary: 'Good metric',
    permission: 'can_view',
    individual_permissions: [],
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    workspace_sharing: 'none',
    workspace_member_count: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAndProcessMetricData.mockResolvedValue(mockProcessedData);
    mockBuildMetricResponse.mockResolvedValue(mockMetricResponse);
  });

  describe('successful requests', () => {
    it('should return metric data for valid metric ID', async () => {
      const result = await getMetricHandler({ metricId: 'metric-123' }, mockUser);

      expect(result).toEqual(mockMetricResponse);
      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
      });
      expect(mockBuildMetricResponse).toHaveBeenCalledWith(mockProcessedData, mockUser.id);
    });

    it('should handle versionNumber parameter', async () => {
      await getMetricHandler({ metricId: 'metric-123', versionNumber: 2 }, mockUser);

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
        versionNumber: 2,
      });
    });

    it('should handle password parameter', async () => {
      await getMetricHandler({ metricId: 'metric-123', password: 'secret123' }, mockUser);

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
        password: 'secret123',
      });
    });

    it('should handle both versionNumber and password parameters', async () => {
      await getMetricHandler(
        { metricId: 'metric-123', versionNumber: 2, password: 'secret123' },
        mockUser
      );

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
        versionNumber: 2,
        password: 'secret123',
      });
    });

    it('should handle requests with no optional parameters', async () => {
      await getMetricHandler({ metricId: 'metric-123' }, mockUser);

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
      });
    });
  });

  describe('error handling', () => {
    it('should propagate errors from fetchAndProcessMetricData', async () => {
      const error = new Error('Metric not found');
      mockFetchAndProcessMetricData.mockRejectedValue(error);

      await expect(getMetricHandler({ metricId: 'nonexistent-metric' }, mockUser)).rejects.toThrow(
        'Failed to fetch metric'
      );

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('nonexistent-metric', mockUser, {
        publicAccessPreviouslyVerified: false,
      });
    });

    it('should propagate errors from buildMetricResponse', async () => {
      const error = new Error('Failed to build response');
      mockBuildMetricResponse.mockRejectedValue(error);

      await expect(getMetricHandler({ metricId: 'metric-123' }, mockUser)).rejects.toThrow(
        'Failed to fetch metric'
      );

      expect(mockFetchAndProcessMetricData).toHaveBeenCalled();
      expect(mockBuildMetricResponse).toHaveBeenCalledWith(mockProcessedData, mockUser.id);
    });
  });

  describe('parameter validation', () => {
    it('should handle different metric ID formats', async () => {
      await getMetricHandler({ metricId: 'invalid-id-format' }, mockUser);

      // The handler should pass through the ID to the business logic
      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('invalid-id-format', mockUser, {
        publicAccessPreviouslyVerified: false,
      });
    });

    it('should handle numeric versionNumber', async () => {
      await getMetricHandler({ metricId: 'metric-123', versionNumber: 123 }, mockUser);

      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
        versionNumber: 123,
      });
    });
  });

  describe('integration with helper functions', () => {
    it('should pass correct parameters to helper functions in correct order', async () => {
      await getMetricHandler(
        { metricId: 'metric-123', versionNumber: 2, password: 'secret' },
        mockUser
      );

      // Verify fetchAndProcessMetricData was called first with correct params
      expect(mockFetchAndProcessMetricData).toHaveBeenCalledBefore(mockBuildMetricResponse);
      expect(mockFetchAndProcessMetricData).toHaveBeenCalledWith('metric-123', mockUser, {
        publicAccessPreviouslyVerified: false,
        versionNumber: 2,
        password: 'secret',
      });

      // Verify buildMetricResponse was called with the result and user ID
      expect(mockBuildMetricResponse).toHaveBeenCalledWith(mockProcessedData, mockUser.id);
    });

    it('should not call buildMetricResponse if fetchAndProcessMetricData fails', async () => {
      mockFetchAndProcessMetricData.mockRejectedValue(new Error('Fetch failed'));

      await expect(getMetricHandler({ metricId: 'metric-123' }, mockUser)).rejects.toThrow();

      expect(mockFetchAndProcessMetricData).toHaveBeenCalled();
      expect(mockBuildMetricResponse).not.toHaveBeenCalled();
    });
  });

  describe('response format', () => {
    it('should return the exact response from buildMetricResponse', async () => {
      const customResponse = {
        ...mockMetricResponse,
        custom_field: 'custom_value',
      };
      mockBuildMetricResponse.mockResolvedValue(customResponse);

      const result = await getMetricHandler({ metricId: 'metric-123' }, mockUser);

      expect(result).toEqual(customResponse);
    });

    it('should maintain response structure', async () => {
      const result = await getMetricHandler({ metricId: 'metric-123' }, mockUser);

      expect(result).toMatchObject({
        id: 'metric-123',
        type: 'metric_file',
        name: 'Test Metric',
        version_number: 1,
        error: null,
        description: 'A test metric',
        file_name: 'test-metric.yml',
        time_frame: 'last_7_days',
        permission: 'can_view',
      });
    });
  });
});
