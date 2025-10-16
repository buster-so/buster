import { checkPermission } from '@buster/access-controls';
import { type User, deleteDashboard, getDashboardById } from '@buster/database/queries';
import {
  DeleteDashboardsRequestSchema,
  type DeleteDashboardsResponse,
} from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

const app = new Hono().delete('/', zValidator('json', DeleteDashboardsRequestSchema), async (c) => {
  const { ids } = c.req.valid('json');
  const user = c.get('busterUser');

  console.info(`Processing bulk DELETE request for ${ids.length} dashboards, user_id: ${user.id}`);

  const response: DeleteDashboardsResponse = await deleteDashboardsHandler(
    {
      dashboardIds: ids,
    },
    user
  );

  return c.json(response);
});

export default app;

interface DeleteDashboardsHandlerParams {
  dashboardIds: string[];
}

/**
 * Handler to delete multiple dashboards by IDs
 * Performs permission check for each dashboard before soft deleting
 * Returns count of successful deletions and any failed IDs
 */
export async function deleteDashboardsHandler(
  params: DeleteDashboardsHandlerParams,
  user: User
): Promise<DeleteDashboardsResponse> {
  const { dashboardIds } = params;

  let deletedCount = 0;
  const failedIds: string[] = [];

  for (const dashboardId of dashboardIds) {
    try {
      // Get the dashboard to check permissions
      const dashboardFile = await getDashboardById({ dashboardId });

      if (!dashboardFile) {
        console.warn(`Dashboard file not found: ${dashboardId}`);
        failedIds.push(dashboardId);
        continue;
      }

      // Check if user has permission to delete this dashboard
      const { hasAccess, effectiveRole } = await checkPermission({
        userId: user.id,
        assetId: dashboardId,
        assetType: 'dashboard_file',
        requiredRole: 'can_edit',
        organizationId: dashboardFile.organizationId,
        workspaceSharing: dashboardFile.workspaceSharing || 'none',
      });

      if (!hasAccess || !effectiveRole) {
        console.warn(`Permission denied for user ${user.id} to delete dashboard ${dashboardId}`);
        failedIds.push(dashboardId);
        continue;
      }

      // Perform the soft delete
      await deleteDashboard({ dashboardId });
      deletedCount++;
      console.info(`Successfully deleted dashboard ${dashboardId}`);
    } catch (error) {
      console.error(`Error deleting dashboard ${dashboardId}:`, error);
      failedIds.push(dashboardId);
    }
  }

  const message =
    deletedCount === dashboardIds.length
      ? `Successfully deleted ${deletedCount} dashboard${deletedCount === 1 ? '' : 's'}`
      : `Deleted ${deletedCount} of ${dashboardIds.length} dashboards`;

  return {
    success: deletedCount > 0,
    message,
    deleted_count: deletedCount,
    failed_ids: failedIds.length > 0 ? failedIds : undefined,
  };
}
