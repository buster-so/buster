import { checkPermission } from '@buster/access-controls';
import {
  type User,
  getCollectionsAssociatedWithDashboard,
  getDashboardById,
  getOrganizationMemberCount,
  getUsersWithDashboardPermissions,
} from '@buster/database/queries';
import { DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { getPubliclyEnabledByUser } from '../../../../shared-helpers/get-publicly-enabled-by-user';
import {
  buildMetricResponse,
  fetchAndProcessMetricData,
} from '../../../../shared-helpers/metric-helpers';
import { getDashboardHandler } from './GET';

// Mock all dependencies
vi.mock('@buster/access-controls', () => ({
  checkPermission: vi.fn(),
}));

vi.mock('@buster/database/queries', () => ({
  getDashboardById: vi.fn(),
  getUsersWithDashboardPermissions: vi.fn(),
  getOrganizationMemberCount: vi.fn(),
  getCollectionsAssociatedWithDashboard: vi.fn(),
}));

vi.mock('../../../../shared-helpers/get-publicly-enabled-by-user', () => ({
  getPubliclyEnabledByUser: vi.fn(),
}));

vi.mock('../../../../shared-helpers/metric-helpers', () => ({
  fetchAndProcessMetricData: vi.fn(),
  buildMetricResponse: vi.fn(),
}));

vi.mock('js-yaml', () => ({
  default: {
    dump: vi.fn((obj) => `yaml: ${JSON.stringify(obj)}`),
  },
}));

describe('getDashboardHandler', () => {
  const mockCheckPermission = checkPermission as Mock;
  const mockGetDashboardById = getDashboardById as Mock;
  const mockGetUsersWithDashboardPermissions = getUsersWithDashboardPermissions as Mock;
  const mockGetOrganizationMemberCount = getOrganizationMemberCount as Mock;
  const mockGetCollectionsAssociatedWithDashboard = getCollectionsAssociatedWithDashboard as Mock;
  const mockGetPubliclyEnabledByUser = getPubliclyEnabledByUser as Mock;
  const mockFetchAndProcessMetricData = fetchAndProcessMetricData as Mock;
  const mockBuildMetricResponse = buildMetricResponse as Mock;

  // Mock data
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockDashboardContent = {
    name: 'Test Dashboard',
    description: 'A test dashboard',
    rows: [
      {
        items: [{ id: 'metric-1' }, { id: 'metric-2' }],
      },
    ],
  };

  const mockDashboard = {
    id: 'dashboard-123',
    name: 'Test Dashboard',
    fileName: 'test-dashboard.yml',
    organizationId: 'org-123',
    content: mockDashboardContent,
    versionHistory: {
      '1': {
        version_number: 1,
        updated_at: '2023-01-01T00:00:00Z',
        content: mockDashboardContent,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock returns
    mockGetDashboardById.mockResolvedValue(mockDashboard);
    mockCheckPermission.mockResolvedValue({
      hasAccess: true,
      effectiveRole: 'can_view',
    });
    mockGetUsersWithDashboardPermissions.mockResolvedValue([]);
    mockGetOrganizationMemberCount.mockResolvedValue(5);
    mockGetCollectionsAssociatedWithDashboard.mockResolvedValue([]);
    mockGetPubliclyEnabledByUser.mockResolvedValue(null);
    mockFetchAndProcessMetricData.mockResolvedValue({
      metricFile: { id: 'metric-1' },
      resolvedContent: { name: 'Test Metric' },
      resolvedName: 'Test Metric',
      resolvedDescription: 'A test metric',
      resolvedTimeFrame: 'last_7_days',
      resolvedChartConfig: DEFAULT_CHART_CONFIG,
      resolvedSql: 'SELECT COUNT(*) FROM users',
      resolvedUpdatedAt: '2023-01-01T00:00:00Z',
      resolvedVersionNum: 1,
      effectiveRole: 'can_view',
      versions: [],
    });
    mockBuildMetricResponse.mockResolvedValue({
      id: 'metric-1',
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
    });
  });

  describe('successful requests', () => {
    it('should return dashboard data for valid dashboard ID', async () => {
      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result.dashboard.id).toBe('dashboard-123');
      expect(result.dashboard.name).toBe('Test Dashboard');
      expect(result.dashboard.config).toEqual(mockDashboardContent);
      expect(result.versions).toEqual([{ version_number: 1, updated_at: '2023-01-01T00:00:00Z' }]);
      expect(result.permission).toBe('can_view');

      expect(mockGetDashboardById).toHaveBeenCalledWith({ dashboardId: 'dashboard-123' });
      expect(mockCheckPermission).toHaveBeenCalledWith({
        userId: mockUser.id,
        assetId: 'dashboard-123',
        assetType: 'dashboard_file',
        requiredRole: 'can_view',
        organizationId: mockDashboard.organizationId,
        workspaceSharing: 'none',
        publiclyAccessible: false,
        publicExpiryDate: undefined,
        publicPassword: undefined,
        userSuppliedPassword: undefined,
      });
    });

    it('should handle version_number parameter', async () => {
      const versionedDashboard = {
        ...mockDashboard,
        versionHistory: {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: { ...mockDashboardContent, name: 'Version 1' },
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: { ...mockDashboardContent, name: 'Version 2' },
          },
        },
      };
      mockGetDashboardById.mockResolvedValue(versionedDashboard);

      const result = await getDashboardHandler(
        { dashboardId: 'dashboard-123', versionNumber: 1 },
        mockUser
      );

      expect((result.dashboard.config as any).name).toBe('Version 1');
      expect(result.dashboard.version_number).toBe(1);
    });

    it('should handle password parameter for public dashboards', async () => {
      const publicDashboard = {
        ...mockDashboard,
        publiclyAccessible: true,
        publicPassword: 'secret123',
      };
      mockGetDashboardById.mockResolvedValue(publicDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      const result = await getDashboardHandler(
        { dashboardId: 'dashboard-123', password: 'secret123' },
        mockUser
      );

      expect(result.permission).toBe('can_view');
    });
  });

  describe('error handling', () => {
    it('should throw 404 when dashboard does not exist', async () => {
      mockGetDashboardById.mockResolvedValue(null);

      await expect(
        getDashboardHandler({ dashboardId: 'nonexistent-dashboard' }, mockUser)
      ).rejects.toThrow(new HTTPException(404, { message: 'Dashboard not found' }));
    });

    it('should throw 403 when user has no permission and dashboard is not public', async () => {
      const privateDashboard = {
        ...mockDashboard,
        publiclyAccessible: false,
      };
      mockGetDashboardById.mockResolvedValue(privateDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      await expect(getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser)).rejects.toThrow(
        new HTTPException(403, { message: "You don't have permission to view this dashboard" })
      );
    });

    it('should throw 403 when public access has expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const expiredDashboard = {
        ...mockDashboard,
        publiclyAccessible: true,
        publicExpiryDate: pastDate.toISOString(),
      };
      mockGetDashboardById.mockResolvedValue(expiredDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      await expect(getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser)).rejects.toThrow(
        new HTTPException(403, { message: 'Public access to this dashboard has expired' })
      );
    });

    it('should throw 418 when password is required but not provided', async () => {
      const passwordProtectedDashboard = {
        ...mockDashboard,
        publiclyAccessible: true,
        publicPassword: 'secret123',
      };
      mockGetDashboardById.mockResolvedValue(passwordProtectedDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      await expect(getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser)).rejects.toThrow(
        new HTTPException(418, { message: 'Password required for public access' })
      );
    });

    it('should throw 403 when incorrect password is provided', async () => {
      const passwordProtectedDashboard = {
        ...mockDashboard,
        publiclyAccessible: true,
        publicPassword: 'secret123',
      };
      mockGetDashboardById.mockResolvedValue(passwordProtectedDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      await expect(
        getDashboardHandler({ dashboardId: 'dashboard-123', password: 'wrong-password' }, mockUser)
      ).rejects.toThrow(
        new HTTPException(403, { message: 'Incorrect password for public access' })
      );
    });

    it('should throw 404 when requested version does not exist', async () => {
      await expect(
        getDashboardHandler({ dashboardId: 'dashboard-123', versionNumber: 99 }, mockUser)
      ).rejects.toThrow(new HTTPException(404, { message: 'Version 99 not found' }));
    });

    it('should throw 404 when requested version exists but has no content', async () => {
      const versionedDashboard = {
        ...mockDashboard,
        versionHistory: {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: null,
          },
        },
      };
      mockGetDashboardById.mockResolvedValue(versionedDashboard);

      await expect(
        getDashboardHandler({ dashboardId: 'dashboard-123', versionNumber: 1 }, mockUser)
      ).rejects.toThrow(new HTTPException(404, { message: 'Version 1 not found' }));
    });
  });

  describe('version history parsing', () => {
    it('should parse version history correctly', async () => {
      const versionedDashboard = {
        ...mockDashboard,
        versionHistory: {
          '3': {
            version_number: 3,
            updated_at: '2023-01-03T00:00:00Z',
            content: mockDashboardContent,
          },
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockDashboardContent,
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: mockDashboardContent,
          },
        },
      };
      mockGetDashboardById.mockResolvedValue(versionedDashboard);

      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result.versions).toEqual([
        { version_number: 1, updated_at: '2023-01-01T00:00:00Z' },
        { version_number: 2, updated_at: '2023-01-02T00:00:00Z' },
        { version_number: 3, updated_at: '2023-01-03T00:00:00Z' },
      ]);
    });

    it('should use latest version when no version specified', async () => {
      const versionedDashboard = {
        ...mockDashboard,
        versionHistory: {
          '1': {
            version_number: 1,
            updated_at: '2023-01-01T00:00:00Z',
            content: mockDashboardContent,
          },
          '2': {
            version_number: 2,
            updated_at: '2023-01-02T00:00:00Z',
            content: mockDashboardContent,
          },
        },
      };
      mockGetDashboardById.mockResolvedValue(versionedDashboard);

      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result.dashboard.version_number).toBe(2);
      expect(result.dashboard.config).toEqual(mockDashboardContent); // From current content
    });
  });

  describe('permission handling', () => {
    it('should grant access when user has permission', async () => {
      mockCheckPermission.mockResolvedValue({
        hasAccess: true,
        effectiveRole: 'can_edit',
      });

      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result.permission).toBe('can_edit');
    });

    it('should use public access when permission is denied but dashboard is publicly accessible', async () => {
      const publicDashboard = {
        ...mockDashboard,
        publiclyAccessible: true,
      };
      mockGetDashboardById.mockResolvedValue(publicDashboard);
      mockCheckPermission.mockResolvedValue({
        hasAccess: false,
        effectiveRole: undefined,
      });

      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result.permission).toBe('can_view');
    });
  });

  describe('response structure', () => {
    it('should return properly formatted dashboard data', async () => {
      const result = await getDashboardHandler({ dashboardId: 'dashboard-123' }, mockUser);

      expect(result).toMatchObject({
        dashboard: {
          id: 'dashboard-123',
          name: 'Test Dashboard',
          file_name: 'test-dashboard.yml',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          created_by: 'user-123',
          version_number: 1,
          config: mockDashboardContent,
        },
        permission: 'can_view',
        versions: [{ version_number: 1, updated_at: '2023-01-01T00:00:00Z' }],
      });
    });
  });
});
