import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeDashboardScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { checkPermission } from '@buster/access-controls';
import {
  type User,
  getCollectionsAssociatedWithDashboard,
  getDashboardById,
  getOrganizationMemberCount,
  getUserOrganizationId,
  getUsersWithAssetPermissions,
} from '@buster/database/queries';
import {
  GetDashboardParamsSchema,
  GetDashboardQuerySchema,
  type GetDashboardResponse,
} from '@buster/server-shared/dashboards';
import type { DashboardYml } from '@buster/server-shared/dashboards';
import type { VerificationStatus } from '@buster/server-shared/share';
import { zValidator } from '@hono/zod-validator';
import { triggerScreenshotIfNeeded } from '@shared-helpers/screenshots';
import { type Context, Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';
import { throwUnauthorizedError } from '../../../../shared-helpers/asset-public-access';
import { getPubliclyEnabledByUser } from '../../../../shared-helpers/get-publicly-enabled-by-user';
import { getMetricsInAncestorAssetFromMetricIds } from '../../../../shared-helpers/metric-helpers';

interface GetDashboardHandlerParams {
  dashboardId: string;
  versionNumber?: number | undefined;
  password?: string | undefined;
}

const app = new Hono().get(
  '/',
  zValidator('param', GetDashboardParamsSchema),
  zValidator('query', GetDashboardQuerySchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { password, version_number } = c.req.valid('query');
    const user = c.get('busterUser');

    console.info(
      `Processing GET request for dashboard with ID: ${id}, user_id: ${user.id}, version_number: ${version_number}`
    );

    const response: GetDashboardResponse = await getDashboardHandler(
      {
        dashboardId: id,
        versionNumber: version_number,
        password,
      },
      user
    );

    triggerScreenshotIfNeeded<TakeDashboardScreenshotTrigger>({
      tag: `take-dashboard-screenshot-${id}`,
      key: screenshots_task_keys.take_dashboard_screenshot,
      context: c,
      payload: {
        dashboardId: id,
        organizationId: (await getUserOrganizationId(user.id))?.organizationId || '',
        accessToken: c.get('accessToken'),
        isOnSaveEvent: false,
      },
    });

    return c.json(response);
  }
);

export default app;

/**
 * Handler to retrieve a dashboard by ID with optional version number
 * This is the TypeScript equivalent of the Rust get_dashboard_handler
 */
export async function getDashboardHandler(
  params: GetDashboardHandlerParams,
  user: User
): Promise<GetDashboardResponse> {
  const { dashboardId, versionNumber, password } = params;

  // Fetch dashboard details
  const dashboardFile = await getDashboardById({ dashboardId });

  if (!dashboardFile) {
    console.warn(`Dashboard file not found: ${dashboardId}`);
    throw new HTTPException(404, {
      message: 'Dashboard not found',
    });
  }

  let { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_view',
    organizationId: dashboardFile.organizationId,
    workspaceSharing: dashboardFile.workspaceSharing || 'none',
    publiclyAccessible: dashboardFile.publiclyAccessible,
    publicExpiryDate: dashboardFile.publicExpiryDate ?? undefined,
    publicPassword: dashboardFile.publicPassword ?? undefined,
    userSuppliedPassword: password,
  });

  // Check public access
  if (!hasAccess) {
    if (!dashboardFile.publiclyAccessible) {
      console.warn(`Permission denied for user ${user.id} to dashboard ${dashboardId}`);
      throw new HTTPException(403, {
        message: "You don't have permission to view this dashboard",
      });
    }

    // Check if public access has expired
    const today = new Date();
    if (dashboardFile.publicExpiryDate && new Date(dashboardFile.publicExpiryDate) < today) {
      console.warn(`Public access expired for dashboard ${dashboardId}`);
      throw new HTTPException(403, {
        message: 'Public access to this dashboard has expired',
      });
    }

    // Check password if required
    if (dashboardFile.publicPassword) {
      if (!password) {
        console.warn(`Public password required for dashboard ${dashboardId}`);
        // I'm a teapot error code for password required
        throw new HTTPException(418, {
          message: 'Password required for public access',
        });
      }

      if (password !== dashboardFile.publicPassword) {
        console.warn(`Incorrect public password for dashboard ${dashboardId}`);
        throw new HTTPException(403, {
          message: 'Incorrect password for public access',
        });
      }
    }

    hasAccess = true;
    effectiveRole = 'can_view';
  }

  if (!hasAccess || !effectiveRole) {
    // This should never be hit because we have already thrown errors for no public access
    console.warn(`Permission denied for user ${user.id} to dashboard ${dashboardId}`);
    throwUnauthorizedError({
      publiclyAccessible: dashboardFile.publiclyAccessible ?? false,
      publicExpiryDate: dashboardFile.publicExpiryDate ?? undefined,
      publicPassword: dashboardFile.publicPassword ?? undefined,
      userSuppliedPassword: password,
    });
  }

  // Resolve version-specific data
  let resolvedContent: DashboardYml;
  let resolvedName: string;
  let resolvedDescription: string | null;
  let resolvedUpdatedAt: string;
  let resolvedVersionNum: number;

  // Parse version history
  const versionHistory = dashboardFile.versionHistory;
  const versions: Array<{ version_number: number; updated_at: string }> = [];

  Object.values(versionHistory).forEach((version) => {
    versions.push({
      version_number: version.version_number,
      updated_at: version.updated_at,
    });
  });
  versions.sort((a, b) => a.version_number - b.version_number);

  // Get requested version if included in the request
  if (versionNumber) {
    const requestedVersionNumToString = versionNumber.toString();

    if (versionHistory[requestedVersionNumToString]) {
      const version = versionHistory[requestedVersionNumToString];

      if (!version || !version.content) {
        throw new HTTPException(404, {
          message: `Version ${versionNumber} not found`,
        });
      }

      const versionContent = version.content as DashboardYml;
      resolvedContent = versionContent;
      resolvedName = versionContent.name;
      resolvedDescription = versionContent.description;
      resolvedUpdatedAt = version.updated_at;
      resolvedVersionNum = version.version_number;
    } else {
      throw new HTTPException(404, {
        message: `Version ${versionNumber} not found`,
      });
    }
  } else {
    // Use current/latest version
    const currentContent = dashboardFile.content as DashboardYml;
    resolvedContent = currentContent;
    resolvedName = dashboardFile.name;
    resolvedDescription = currentContent.description;
    resolvedUpdatedAt = dashboardFile.updatedAt;

    // Determine latest version number
    const maxVersion = Math.max(...versions.map((v) => v.version_number), 1);
    resolvedVersionNum = maxVersion;
  }

  const fileYaml = yaml.dump(resolvedContent);

  // Extract metric IDs from dashboard config
  const metricIds = extractMetricIds(resolvedContent);

  const metrics = await getMetricsInAncestorAssetFromMetricIds(metricIds, user);

  // Get the extra dashboard info concurrently
  const [individualPermissions, workspaceMemberCount, collections, publicEnabledBy] =
    await Promise.all([
      getUsersWithAssetPermissions({ assetId: dashboardId, assetType: 'dashboard_file' }),
      getOrganizationMemberCount(dashboardFile.organizationId),
      getCollectionsAssociatedWithDashboard(dashboardId, user.id),
      getPubliclyEnabledByUser(dashboardFile.publiclyEnabledBy),
    ]);

  // Build the response
  const response: GetDashboardResponse = {
    metrics,
    dashboard: {
      config: resolvedContent,
      created_at: dashboardFile.createdAt,
      created_by: dashboardFile.createdBy,
      deleted_at: null,
      description: resolvedDescription,
      id: dashboardFile.id,
      name: resolvedName,
      updated_at: resolvedUpdatedAt,
      updated_by: dashboardFile.createdBy,
      status: 'verified' as VerificationStatus,
      version_number: resolvedVersionNum,
      file: fileYaml,
      file_name: dashboardFile.fileName,
    },
    collections,
    versions,
    individual_permissions: individualPermissions,
    publicly_accessible: dashboardFile.publiclyAccessible,
    public_expiry_date: dashboardFile.publicExpiryDate,
    public_enabled_by: publicEnabledBy,
    public_password: dashboardFile.publicPassword,
    permission: effectiveRole,
    workspace_sharing: dashboardFile.workspaceSharing,
    workspace_member_count: workspaceMemberCount,
  };

  return response;
}

/**
 * Extract metric IDs from dashboard content
 */
export function extractMetricIds(content: DashboardYml): string[] {
  try {
    if (!content.rows) {
      return [];
    }

    const metricIds = content.rows.flatMap((row) => row.items?.map((item) => item.id) || []);

    return metricIds;
  } catch (error) {
    console.error('Error extracting metric IDs from dashboard content:', error);
    throw new HTTPException(500, {
      message: `Error extracting metric IDs from dashboard content: ${error}`,
    });
  }
}
