import { checkPermission } from '@buster/access-controls';
import { type User, deleteDashboard, getDashboardById } from '@buster/database/queries';
import {
  DeleteDashboardParamsSchema,
  type DeleteDashboardResponse,
} from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().delete('/', zValidator('param', DeleteDashboardParamsSchema), async (c) => {
  const { id } = c.req.valid('param');
  const user = c.get('busterUser');

  console.info(`Processing DELETE request for dashboard with ID: ${id}, user_id: ${user.id}`);

  const response: DeleteDashboardResponse = await deleteDashboardHandler(
    {
      dashboardId: id,
    },
    user
  );

  return c.json(response);
});

export default app;

interface DeleteDashboardHandlerParams {
  dashboardId: string;
}

/**
 * Handler to delete a dashboard by ID
 * Performs permission check before soft deleting the dashboard
 */
export async function deleteDashboardHandler(
  params: DeleteDashboardHandlerParams,
  user: User
): Promise<DeleteDashboardResponse> {
  const { dashboardId } = params;

  // First, get the dashboard to check permissions
  const dashboardFile = await getDashboardById({ dashboardId });

  if (!dashboardFile) {
    console.warn(`Dashboard file not found: ${dashboardId}`);
    throw new HTTPException(404, {
      message: 'Dashboard not found',
    });
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
    throw new HTTPException(403, {
      message: "You don't have permission to delete this dashboard",
    });
  }

  // Perform the soft delete
  await deleteDashboard({ dashboardId });

  console.info(`Successfully deleted dashboard ${dashboardId}`);

  return {
    success: true,
    message: 'Dashboard successfully deleted',
  };
}
