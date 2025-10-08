import { checkPermission } from '@buster/access-controls';
import {
  type MetricFile,
  type User,
  getAssetsAssociatedWithMetric,
  getMetricFileById,
  getOrganizationMemberCount,
  getUsersWithAssetPermissions,
} from '@buster/database/queries';
import { type ChartConfigProps, DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { getPubliclyEnabledByUser } from './get-publicly-enabled-by-user';
import {
  type MetricAccessOptions,
  type ProcessedMetricData,
  buildMetricResponse,
  fetchAndProcessMetricData,
} from './metric-helpers';

// Mock all dependencies
vi.mock('@buster/access-controls', () => ({
  checkPermission: vi.fn(),
}));

vi.mock('@buster/database/queries', () => ({
  getMetricFileById: vi.fn(),
  getUsersWithAssetPermissions: vi.fn(),
  getOrganizationMemberCount: vi.fn(),
  getAssetsAssociatedWithMetric: vi.fn(),
}));

vi.mock('./get-publicly-enabled-by-user', () => ({
  getPubliclyEnabledByUser: vi.fn(),
}));

// Mock js-yaml
vi.mock('js-yaml', () => ({
  default: {
    dump: vi.fn((obj) => `yaml: ${JSON.stringify(obj)}`),
  },
}));

describe('metric-helpers', () => {
  const mockCheckPermission = checkPermission as Mock;
  const mockGetMetricFileById = getMetricFileById as Mock;
  const mockGetUsersWithAssetPermissions = getUsersWithAssetPermissions as Mock;
  const mockGetOrganizationMemberCount = getOrganizationMemberCount as Mock;
  const mockGetAssetsAssociatedWithMetric = getAssetsAssociatedWithMetric as Mock;
  const mockGetPubliclyEnabledByUser = getPubliclyEnabledByUser as Mock;

  // Mock data
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockMetricContent = {
    name: 'Test Metric',
    description: 'A test metric',
    timeFrame: 'last_7_days',
    sql: 'SELECT COUNT(*) as count FROM users',
    chartConfig: {
      ...DEFAULT_CHART_CONFIG,
      selectedChartType: 'bar' as const,
      colors: ['#FF6B6B'],
    },
  };

  const createMockMetricFile = (overrides: Partial<MetricFile> = {}): MetricFile => ({
    id: 'metric-123',
    name: 'Test Metric',
    fileName: 'test-metric.yml',
    organizationId: 'org-123',
    dataSourceId: 'ds-123',
    content: mockMetricContent,
    versionHistory: {
      '1': {
        version_number: 1,
        updated_at: '2023-01-01T00:00:00Z',
        content: mockMetricContent,
      },
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
    screenshotBucketKey: null,
    savedToLibrary: false,
    screenshotTakenAt: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns
    mockCheckPermission.mockResolvedValue({
      hasAccess: true,
      effectiveRole: 'can_view',
    });
    mockGetUsersWithAssetPermissions.mockResolvedValue([]);
    mockGetOrganizationMemberCount.mockResolvedValue(5);
    mockGetAssetsAssociatedWithMetric.mockResolvedValue({
      dashboards: [],
      collections: [],
    });
    mockGetPubliclyEnabledByUser.mockResolvedValue(null);
  });

  describe('fetchAndProcessMetricData', () => {
    describe('version history parsing', () => {
      it('should handle snake_case version fields correctly', async () => {
        const versionHistory = {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockMetricContent,
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: { ...mockMetricContent, name: 'Updated Metric' },
          },
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.versions).toEqual([
          { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
          { version_number: 2, updated_at: '2023-01-02T00:00:00Z' },
        ]);
      });

      it('should handle camelCase version fields correctly', async () => {
        const versionHistory = {
          '1': {
            versionNumber: 1,
            updatedAt: '2023-01-01T00:00:00Z',
            content: mockMetricContent,
          } as any,
          '2': {
            versionNumber: 2,
            updatedAt: '2023-01-02T00:00:00Z',
            content: { ...mockMetricContent, name: 'Updated Metric' },
          } as any,
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.versions).toEqual([
          { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
          { version_number: 2, updated_at: '2023-01-02T00:00:00Z' },
        ]);
      });

      it('should handle mixed camelCase and snake_case version fields', async () => {
        const versionHistory = {
          '1': {
            version_number: 1, // snake_case
            updatedAt: '2023-01-01T00:00:00Z', // camelCase
            content: mockMetricContent,
          } as any,
          '2': {
            versionNumber: 2, // camelCase
            updated_at: '2023-01-02T00:00:00Z', // snake_case
            content: { ...mockMetricContent, name: 'Updated Metric' },
          } as any,
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.versions).toEqual([
          { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
          { version_number: 2, updated_at: '2023-01-02T00:00:00Z' },
        ]);
      });

      it('should prefer snake_case over camelCase when both are present', async () => {
        const versionHistory = {
          '1': {
            version_number: 1, // snake_case - should be preferred
            versionNumber: 999, // camelCase - should be ignored
            updated_at: '2023-01-01T00:00:00Z', // snake_case - should be preferred
            updatedAt: '2099-01-01T00:00:00Z', // camelCase - should be ignored
            content: mockMetricContent,
          } as any,
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.versions).toEqual([
          { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
        ]);
      });

      it('should sort versions by version number in ascending order', async () => {
        const versionHistory = {
          '3': {
            version_number: 3,
            updated_at: '2023-01-03T00:00:00Z',
            content: mockMetricContent,
          },
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockMetricContent,
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: mockMetricContent,
          },
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.versions).toEqual([
          { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
          { version_number: 2, updated_at: '2023-01-02T00:00:00Z' },
          { version_number: 3, updated_at: '2023-01-03T00:00:00Z' },
        ]);
      });
    });

    describe('metric not found', () => {
      it('should throw 404 when metric does not exist', async () => {
        mockGetMetricFileById.mockResolvedValue(null);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };

        await expect(
          fetchAndProcessMetricData('nonexistent-metric', mockUser, options)
        ).rejects.toThrow(new HTTPException(404, { message: 'Metric file not found' }));
      });
    });

    describe('permission handling', () => {
      it('should grant access when user has permission', async () => {
        const metricFile = createMockMetricFile();
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: true,
          effectiveRole: 'can_edit',
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.effectiveRole).toBe('can_edit');
      });

      it('should use public access when permission is denied but metric is publicly accessible', async () => {
        const metricFile = createMockMetricFile({ publiclyAccessible: true });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: true,
          effectiveRole: 'can_view',
          accessPath: 'public',
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.effectiveRole).toBe('can_view');
      });

      it('should throw 403 when no permission and not publicly accessible', async () => {
        const metricFile = createMockMetricFile({ publiclyAccessible: false });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: false,
          effectiveRole: undefined,
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(403, { message: 'You do not have permission to access this asset' })
        );
      });

      it('should use previously verified public access', async () => {
        const metricFile = createMockMetricFile({ publiclyAccessible: false });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: true,
          effectiveRole: 'can_view',
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: true };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.effectiveRole).toBe('can_view');
      });
    });

    describe('public access validation', () => {
      it('should throw 403 when public access has expired', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const metricFile = createMockMetricFile({
          publiclyAccessible: true,
          publicExpiryDate: pastDate.toISOString(),
        });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: false,
          effectiveRole: undefined,
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(403, { message: 'Public access expired' })
        );
      });

      it('should throw 418 when password is required but not provided', async () => {
        const metricFile = createMockMetricFile({
          publiclyAccessible: true,
          publicPassword: 'secret123',
        });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: false,
          effectiveRole: undefined,
        });

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(418, { message: 'Password required for public access' })
        );
      });

      it('should throw 403 when incorrect password is provided', async () => {
        const metricFile = createMockMetricFile({
          publiclyAccessible: true,
          publicPassword: 'secret123',
        });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: false,
          effectiveRole: undefined,
        });

        const options: MetricAccessOptions = {
          publicAccessPreviouslyVerified: false,
          password: 'wrong-password',
        };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(403, { message: 'Incorrect password for public access' })
        );
      });

      it('should grant access when correct password is provided', async () => {
        const metricFile = createMockMetricFile({
          publiclyAccessible: true,
          publicPassword: 'secret123',
        });
        mockGetMetricFileById.mockResolvedValue(metricFile);
        mockCheckPermission.mockResolvedValue({
          hasAccess: true,
          effectiveRole: 'can_view',
          accessPath: 'public',
        });

        const options: MetricAccessOptions = {
          publicAccessPreviouslyVerified: false,
          password: 'secret123',
        };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.effectiveRole).toBe('can_view');
      });
    });

    describe('version resolution', () => {
      it('should return latest version when no version specified', async () => {
        const versionHistory = {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockMetricContent,
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: { ...mockMetricContent, name: 'Updated Metric' },
          },
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.resolvedVersionNum).toBe(2);
        expect(result.resolvedName).toBe('Test Metric'); // From current content
      });

      it('should return specific version when version number is provided', async () => {
        const versionHistory = {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: { ...mockMetricContent, name: 'Version 1 Metric' },
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: { ...mockMetricContent, name: 'Version 2 Metric' },
          },
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = {
          publicAccessPreviouslyVerified: false,
          versionNumber: 1,
        };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.resolvedVersionNum).toBe(1);
        expect(result.resolvedName).toBe('Version 1 Metric');
        expect(result.resolvedUpdatedAt).toBe('2023-01-01T00:00:00Z');
      });

      it('should throw 404 when requested version does not exist', async () => {
        const versionHistory = {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockMetricContent,
          },
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = {
          publicAccessPreviouslyVerified: false,
          versionNumber: 99,
        };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(404, { message: 'Version 99 not found' })
        );
      });

      it('should throw 404 when requested version exists but has no content', async () => {
        const versionHistory = {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: null,
          } as any,
        };

        const metricFile = createMockMetricFile({ versionHistory });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = {
          publicAccessPreviouslyVerified: false,
          versionNumber: 1,
        };

        await expect(fetchAndProcessMetricData('metric-123', mockUser, options)).rejects.toThrow(
          new HTTPException(404, { message: 'Version 1 not found' })
        );
      });
    });

    describe('chart config handling', () => {
      it('should use default colors when chart config has no colors', async () => {
        const contentWithoutColors = {
          ...mockMetricContent,
          chartConfig: {
            ...DEFAULT_CHART_CONFIG,
            selectedChartType: 'bar' as const,
          }, // No colors property
        };

        const metricFile = createMockMetricFile({ content: contentWithoutColors });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.resolvedChartConfig.colors).toBeDefined();
        expect(Array.isArray(result.resolvedChartConfig.colors)).toBe(true);
      });

      it('should preserve existing colors when they exist', async () => {
        const customColors = ['#FF0000', '#00FF00', '#0000FF'];
        const contentWithColors = {
          ...mockMetricContent,
          chartConfig: {
            ...DEFAULT_CHART_CONFIG,
            selectedChartType: 'bar' as const,
            colors: customColors,
          },
        };

        const metricFile = createMockMetricFile({ content: contentWithColors });
        mockGetMetricFileById.mockResolvedValue(metricFile);

        const options: MetricAccessOptions = { publicAccessPreviouslyVerified: false };
        const result = await fetchAndProcessMetricData('metric-123', mockUser, options);

        expect(result.resolvedChartConfig.colors).toEqual(customColors);
      });
    });
  });

  describe('buildMetricResponse', () => {
    const createProcessedData = (
      overrides: Partial<ProcessedMetricData> = {}
    ): ProcessedMetricData => ({
      metricFile: createMockMetricFile(),
      resolvedContent: mockMetricContent,
      resolvedName: 'Test Metric',
      resolvedDescription: 'A test metric',
      resolvedTimeFrame: 'last_7_days',
      resolvedChartConfig: {
        ...DEFAULT_CHART_CONFIG,
        selectedChartType: 'bar',
        colors: ['#FF6B6B'],
      },
      resolvedSql: 'SELECT COUNT(*) as count FROM users',
      resolvedUpdatedAt: '2023-01-01T00:00:00Z',
      resolvedVersionNum: 1,
      effectiveRole: 'can_view',
      versions: [{ version_number: 1, updated_at: '2023-01-01T00:00:00Z' }],
      ...overrides,
    });

    it('should build complete metric response', async () => {
      const processedData = createProcessedData();

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response).toMatchObject({
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
      expect(response.file).toContain('yaml:');
    });

    it('should handle high evaluation score', async () => {
      const metricFile = createMockMetricFile({ evaluationScore: 0.9 });
      const processedData = createProcessedData({ metricFile });

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response.evaluation_score).toBe('High');
    });

    it('should handle moderate evaluation score', async () => {
      const metricFile = createMockMetricFile({ evaluationScore: 0.6 });
      const processedData = createProcessedData({ metricFile });

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response.evaluation_score).toBe('Moderate');
    });

    it('should handle low evaluation score', async () => {
      const metricFile = createMockMetricFile({ evaluationScore: 0.3 });
      const processedData = createProcessedData({ metricFile });

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response.evaluation_score).toBe('Low');
    });

    it('should handle null evaluation score as low', async () => {
      const metricFile = createMockMetricFile({ evaluationScore: null });
      const processedData = createProcessedData({ metricFile });

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response.evaluation_score).toBe('Low');
    });

    it('should include all associated data from concurrent queries', async () => {
      const processedData = createProcessedData();

      mockGetUsersWithAssetPermissions.mockResolvedValue([
        { role: 'can_view', email: 'user1@test.com', name: 'User 1', avatarUrl: null },
        { role: 'can_edit', email: 'user2@test.com', name: 'User 2', avatarUrl: null },
      ]);
      mockGetOrganizationMemberCount.mockResolvedValue(10);
      mockGetAssetsAssociatedWithMetric.mockResolvedValue({
        dashboards: [{ id: 'dash-1', name: 'Dashboard 1' }],
        collections: [{ id: 'coll-1', name: 'Collection 1' }],
      });
      mockGetPubliclyEnabledByUser.mockResolvedValue({
        id: 'user-456',
        name: 'Admin User',
      });

      const response = await buildMetricResponse(processedData, 'user-123');

      expect(response.individual_permissions).toHaveLength(2);
      expect(response.workspace_member_count).toBe(10);
      expect(response.dashboards).toHaveLength(1);
      expect(response.collections).toHaveLength(1);
      expect(response.public_enabled_by).toEqual({
        id: 'user-456',
        name: 'Admin User',
      });
    });
  });
});
