import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeDashboardScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { type User, createDashboard } from '@buster/database/queries';
import type { PostDashboardRequest, PostDashboardResponse } from '@buster/server-shared/dashboards';
import { PostDashboardRequestSchema } from '@buster/server-shared/dashboards';
import type { DashboardYml } from '@buster/server-shared/dashboards';
import { zValidator } from '@hono/zod-validator';
import { triggerScreenshotIfNeeded } from '@shared-helpers/screenshots';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';
import { requireAuth, requireOrganization } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';
import { getDashboardHandler } from './[id]/GET';

const app = new Hono()
  .use(requireAuth)
  .use(requireOrganization)

  .post('/', zValidator('json', PostDashboardRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const org = c.get('userOrganizationInfo');

    console.info(`Processing POST request to create dashboard for user: ${user.id}`);

    try {
      const response = await createDashboardHandler(request, user, org.organizationId);

      // Trigger screenshot for new dashboard
      await triggerScreenshotIfNeeded<TakeDashboardScreenshotTrigger>({
        tag: `take-dashboard-screenshot-${response.dashboard.id}`,
        key: screenshots_task_keys.take_dashboard_screenshot,
        context: c,
        payload: {
          dashboardId: response.dashboard.id,
          organizationId: org.organizationId,
          accessToken: c.get('accessToken'),
          isOnSaveEvent: true,
        },
      });

      return c.json(response);
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw new HTTPException(500, { message: 'Failed to create dashboard' });
    }
  })
  .onError(standardErrorHandler);

export default app;

/**
 * Handler to create a new dashboard
 */
export async function createDashboardHandler(
  request: PostDashboardRequest,
  user: User,
  organizationId: string
): Promise<PostDashboardResponse> {
  // Parse config from file if provided, otherwise use config directly or create default
  let dashboardConfig: DashboardYml;
  if (request.config) {
    // Merge config with name and description from request
    dashboardConfig = {
      ...request.config,
      name: request.name,
      description: request.description ?? '',
    };
  } else {
    // Create default config if neither file nor config provided
    dashboardConfig = {
      name: request.name,
      description: request.description ?? '',
      rows: [],
    };
  }

  // Generate a fileName based on the dashboard name

  // Create the dashboard
  const newDashboard = await createDashboard({
    name: request.name,
    fileName: request.name,
    content: dashboardConfig,
    organizationId,
    userId: user.id,
  });

  // Use the existing getDashboardHandler to fetch the complete dashboard response
  const response = await getDashboardHandler(
    {
      dashboardId: newDashboard.id,
    },
    user
  );

  return response;
}
