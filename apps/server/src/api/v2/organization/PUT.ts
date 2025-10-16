import type { User } from '@buster/database/queries';
import { getOrganization, updateOrganization } from '@buster/database/queries';
import type {
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
} from '@buster/server-shared/organization';
import { UpdateOrganizationRequestSchema } from '@buster/server-shared/organization';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireOrganizationAdmin } from '../../../middleware/auth';
import { errorResponse, standardErrorHandler } from '../../../utils/response';

/**
 * Updates organization settings
 * Currently supports updating organization color palettes
 */
async function updateOrganizationHandler(
  organizationId: string,
  request: UpdateOrganizationRequest,
  user: User
): Promise<UpdateOrganizationResponse> {
  try {
    // Update the organization
    await updateOrganization({
      organizationId,
      ...request,
    });

    // Fetch the updated organization data
    const updatedOrg = await getOrganization({
      organizationId,
    });

    return updatedOrg;
  } catch (error) {
    console.error('Error in updateOrganizationHandler:', {
      organizationId,
      userId: user.id,
      requestFields: Object.keys(request),
      error: error instanceof Error ? error.message : error,
    });

    // Re-throw Zod errors to be handled by the route error handler
    if (error instanceof z.ZodError) {
      throw error;
    }

    throw errorResponse('Failed to update organization', 500);
  }
}

// Create route module for the update endpoint
const app = new Hono()
  .use('*', requireOrganizationAdmin)
  .put('/', zValidator('json', UpdateOrganizationRequestSchema), async (c) => {
    const request = c.req.valid('json');
    const user = c.get('busterUser');
    const userOrg = c.get('userOrganizationInfo');

    const organizationId = userOrg.organizationId;

    const response: UpdateOrganizationResponse = await updateOrganizationHandler(
      organizationId,
      request,
      user
    );

    return c.json(response);
  })
  .onError(standardErrorHandler);

export default app;
