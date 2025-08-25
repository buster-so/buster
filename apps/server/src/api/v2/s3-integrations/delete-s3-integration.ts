import type { User } from '@buster/database';
import {
  deleteS3IntegrationById,
  deleteSecret,
  getS3IntegrationById,
  getUserOrganizationId,
} from '@buster/database';
import type { DeleteS3IntegrationResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for deleting S3 integrations
 *
 * This handler:
 * 1. Validates user has access to the organization
 * 2. Verifies the integration belongs to the user's organization
 * 3. Soft deletes the integration record
 * 4. Hard deletes the vault secret
 */
export async function deleteS3IntegrationHandler(
  user: User,
  integrationId: string
): Promise<DeleteS3IntegrationResponse> {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(integrationId)) {
    throw new HTTPException(400, {
      message: 'Invalid integration ID format',
    });
  }

  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to delete storage integrations',
    });
  }

  const { organizationId } = userOrg;

  try {
    // Get the integration to verify ownership
    const integration = await getS3IntegrationById(integrationId);

    if (!integration) {
      throw new HTTPException(404, {
        message: 'Storage integration not found',
      });
    }

    // Verify the integration belongs to the user's organization
    if (integration.organizationId !== organizationId) {
      throw new HTTPException(403, {
        message: 'You do not have permission to delete this storage integration',
      });
    }

    // Soft delete the integration
    const deleteResult = await deleteS3IntegrationById(integrationId);

    if (!deleteResult.success) {
      throw new HTTPException(500, {
        message: 'Failed to delete storage integration',
      });
    }

    // Hard delete the vault secret
    const secretName = `s3-integration-${integrationId}`;
    try {
      await deleteSecret(secretName);
    } catch (error) {
      // Log error but don't fail the operation if secret deletion fails
      console.error('Failed to delete vault secret:', error);
    }

    return {
      success: true,
      message: 'Storage integration deleted successfully',
    };
  } catch (error) {
    // If it's already an HTTPException, re-throw it
    if (error instanceof HTTPException) {
      throw error;
    }

    // Generic error
    console.error('Error deleting S3 integration:', error);
    throw new HTTPException(500, {
      message: 'Failed to delete storage integration',
    });
  }
}
