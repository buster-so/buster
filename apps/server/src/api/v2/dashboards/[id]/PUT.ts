import { checkPermission } from '@buster/access-controls';
import {
  getDashboardById,
  manageMetricAssociations,
  type User,
  updateDashboard,
} from '@buster/database/queries';
import type { DashboardVersionHistory } from '@buster/database/schema-types';
import type { DashboardConfig, DashboardYml } from '@buster/server-shared/dashboards';
import {
  UpdateDashboardParamsSchema,
  UpdateDashboardRequestSchema,
  type UpdateDashboardResponse,
} from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';
import { getDashboardHandler } from './GET';

interface UpdateDashboardHandlerParams {
  dashboardId: string;
  name?: string | undefined;
  description?: string | undefined;
  config?: DashboardConfig | undefined;
  file?: string | undefined;
  update_version?: boolean | undefined;
  restore_to_version?: number | undefined;
}

const app = new Hono().put(
  '/',
  zValidator('param', UpdateDashboardParamsSchema),
  zValidator('json', UpdateDashboardRequestSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const requestBody = c.req.valid('json');
    const user = c.get('busterUser');

    console.info(`Processing PUT request for dashboard with ID: ${id}, user_id: ${user.id}`);

    const response: UpdateDashboardResponse = await updateDashboardHandler(
      {
        dashboardId: id,
        ...requestBody,
      },
      user
    );

    return c.json(response);
  }
);

export default app;

/**
 * Handler to update a dashboard by ID
 * This is the TypeScript equivalent of the Rust update_dashboard_handler
 */
export async function updateDashboardHandler(
  params: UpdateDashboardHandlerParams,
  user: User
): Promise<UpdateDashboardResponse> {
  const {
    dashboardId,
    name,
    description,
    config,
    file,
    update_version = true,
    restore_to_version,
  } = params;

  const dashboardFile = await getDashboardById({ dashboardId });

  if (!dashboardFile) {
    console.warn(`Dashboard file not found: ${dashboardId}`);
    throw new HTTPException(404, {
      message: 'Dashboard not found',
    });
  }

  const { hasAccess, effectiveRole } = await checkPermission({
    userId: user.id,
    assetId: dashboardId,
    assetType: 'dashboard_file',
    requiredRole: 'can_edit',
    organizationId: dashboardFile.organizationId,
    workspaceSharing: dashboardFile.workspaceSharing || 'none',
  });

  if (!hasAccess || !effectiveRole) {
    console.warn(`Permission denied for user ${user.id} to update dashboard ${dashboardId}`);
    throw new HTTPException(403, {
      message: "You don't have permission to update this dashboard",
    });
  }

  // Start with current dashboard YAML content
  let dashboardYml = dashboardFile.content as DashboardYml;
  let hasContentChanges = false;

  // Prioritize version restoration if supplied
  if (restore_to_version !== undefined) {
    const versionHistory = dashboardFile.versionHistory;
    const versionKey = restore_to_version.toString();
    const requestedVersion = versionHistory[versionKey];

    if (!requestedVersion) {
      throw new HTTPException(404, {
        message: `Version ${restore_to_version} not found`,
      });
    }

    // Update dashboard YAML to the older version content
    dashboardYml = requestedVersion.content as DashboardYml;
    hasContentChanges = true;

    console.info(`Restoring dashboard ${dashboardId} to version ${restore_to_version}`);
  } else {
    if (file !== undefined) {
      try {
        dashboardYml = yaml.load(file) as DashboardYml;
        hasContentChanges = true;
      } catch (error) {
        throw new HTTPException(400, {
          message: `Invalid YAML content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    } else {
      if (description !== undefined) {
        dashboardYml = {
          ...dashboardYml,
          description,
        };
        hasContentChanges = true;
      }

      if (name !== undefined) {
        dashboardYml = {
          ...dashboardYml,
          name,
        };
        hasContentChanges = true;
      }

      if (config !== undefined) {
        try {
          const newRows =
            config.rows?.map((configRow) => ({
              items: configRow.items?.map((item) => ({ id: item.id })) || [],
              rowHeight: configRow.rowHeight,
              columnSizes: configRow.columnSizes || [],
              id: configRow.id,
            })) || [];

          dashboardYml = {
            ...dashboardYml,
            rows: newRows,
          };
          hasContentChanges = true;
        } catch (error) {
          throw new HTTPException(400, {
            message: `Invalid dashboard config: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }
  }

  if (hasContentChanges) {
    let updatedVersionHistory = dashboardFile.versionHistory as DashboardVersionHistory;

    if (update_version) {
      const versionNumbers = Object.values(updatedVersionHistory).map((v) => v.version_number);
      const nextVersion = Math.max(...versionNumbers, 0) + 1;

      // Add new version to history
      const versionKey = nextVersion.toString();
      updatedVersionHistory = {
        ...updatedVersionHistory,
        [versionKey]: {
          content: dashboardYml,
          updated_at: new Date().toISOString(),
          version_number: nextVersion,
        },
      };
    } else {
      // Update the latest version in place
      const versionNumbers = Object.values(updatedVersionHistory).map((v) => v.version_number);
      const latestVersionNumber = Math.max(...versionNumbers, 1);
      const latestVersionKey = latestVersionNumber.toString();

      if (updatedVersionHistory[latestVersionKey]) {
        updatedVersionHistory = {
          ...updatedVersionHistory,
          [latestVersionKey]: {
            version_number: latestVersionNumber,
            content: dashboardYml,
            updated_at: new Date().toISOString(),
          },
        };
      }
    }

    await updateDashboard({
      dashboardId,
      userId: user.id,
      name,
      content: dashboardYml,
      versionHistory: updatedVersionHistory,
    });

    // Extract metric IDs from the updated dashboard YAML
    const metricIds: string[] = dashboardYml.rows
      ? dashboardYml.rows.flatMap((row) => row.items).map((item) => item.id)
      : [];

    // Update metric associations
    await manageMetricAssociations({
      dashboardId,
      metricIds,
      userId: user.id,
    });
  }

  // Return the updated dashboard using the GET handler
  return getDashboardHandler(
    {
      dashboardId,
    },
    user
  );
}
