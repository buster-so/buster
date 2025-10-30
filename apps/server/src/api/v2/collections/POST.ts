import {
  createCollection,
  getOrganizationMemberCount,
  getUserOrganizationId,
  type User,
} from '@buster/database/queries';
import {
  type BusterCollection,
  CreateCollectionRequestBodySchema,
} from '@buster/server-shared/collections';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono().post(
  '/',
  zValidator('json', CreateCollectionRequestBodySchema),
  async (c) => {
    const body = c.req.valid('json');
    const user = c.get('busterUser');

    try {
      const response: BusterCollection = await createCollectionHandler(body, user);
      return c.json(response, 201);
    } catch (error) {
      console.error('Error creating collection:', error);

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, { message: 'Failed to create collection' });
    }
  }
);

export default app;

interface CreateCollectionHandlerParams {
  name: string;
  description: string;
}

/**
 * Handler to create a new collection
 */
async function createCollectionHandler(
  params: CreateCollectionHandlerParams,
  user: User
): Promise<BusterCollection> {
  const { name, description } = params;

  // Get user's organization
  const userOrganization = await getUserOrganizationId(user.id);
  if (!userOrganization) {
    throw new HTTPException(400, {
      message: 'User does not have an active organization',
    });
  }

  // Create the collection
  const newCollection = await createCollection({
    name,
    description,
    userId: user.id,
    organizationId: userOrganization.organizationId,
  });

  if (!newCollection) {
    throw new HTTPException(500, {
      message: 'Failed to create collection',
    });
  }

  // Get workspace member count
  const workspaceMemberCount = await getOrganizationMemberCount(newCollection.organizationId);

  // Build the response
  const response: BusterCollection = {
    id: newCollection.id,
    name: newCollection.name,
    created_at: newCollection.createdAt,
    assets: null,
    created_by: newCollection.createdBy,
    deleted_at: newCollection.deletedAt,
    permission: 'owner',
    updated_at: newCollection.updatedAt,
    updated_by: newCollection.updatedBy,
    individual_permissions: null,
    publicly_accessible: false,
    public_expiry_date: null,
    public_enabled_by: null,
    public_password: null,
    workspace_sharing: newCollection.workspaceSharing || null,
    workspace_member_count: workspaceMemberCount,
    added_to_library: true,
  };

  return response;
}
