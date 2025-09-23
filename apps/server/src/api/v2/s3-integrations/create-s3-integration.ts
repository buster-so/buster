import { type StorageConfig, testStorageCredentials } from '@buster/data-source';
import type { User } from '@buster/database/queries';
import { createS3Integration, getUserOrganizationId } from '@buster/database/queries';
import { createSecret } from '@buster/database/queries';
import type {
  CreateS3IntegrationRequest,
  CreateS3IntegrationResponse,
} from '@buster/server-shared';
import { tasks } from '@trigger.dev/sdk';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for creating S3 integrations
 *
 * This handler:
 * 1. Validates user has access to an organization
 * 2. Checks if organization already has an active integration
 * 3. Validates credentials by testing bucket access
 * 4. Stores credentials securely in vault
 * 5. Creates integration record in database
 * 6. Triggers migration of existing assets if needed
 */
export async function createS3IntegrationHandler(
  user: User,
  request: CreateS3IntegrationRequest
): Promise<CreateS3IntegrationResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to create storage integrations',
    });
  }

  const { organizationId } = userOrg;

  try {
    // Validate credentials before saving
    await validateStorageCredentials(request);

    // Create the integration record
    const integration = await createS3Integration({
      provider: request.provider,
      organizationId,
    });

    // Store credentials in vault
    const secretName = `s3-integration-${integration.id}`;
    await createSecret({
      secret: JSON.stringify(request),
      name: secretName,
      description: `Storage integration credentials for ${request.provider}`,
    });

    // Trigger migration task for existing assets
    try {
      await tasks.trigger('migrate-storage-assets', {
        integrationId: integration.id,
        organizationId,
      });

      console.info('Migration task triggered for storage integration', {
        integrationId: integration.id,
        organizationId,
      });
    } catch (error) {
      // Don't fail the integration creation if migration task fails to trigger
      console.error('Failed to trigger migration task', error);
    }

    return {
      id: integration.id,
      provider: integration.provider,
      organizationId: integration.organizationId,
      bucketName: request.bucket,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      deletedAt: integration.deletedAt,
    };
  } catch (error) {
    // If it's already an HTTPException, re-throw it
    if (error instanceof HTTPException) {
      throw error;
    }

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already has an active storage integration')) {
        throw new HTTPException(409, {
          message: 'Organization already has an active storage integration',
        });
      }

      if (
        error.message.includes('Invalid credentials') ||
        error.message.includes('Failed to parse GCS') ||
        error.message.includes('Failed to initialize GCS')
      ) {
        throw new HTTPException(400, {
          message: error.message.includes('parse')
            ? 'Invalid GCS service account key format'
            : 'Invalid storage credentials provided',
        });
      }
    }

    // Generic error
    console.error('Error creating S3 integration:', error);
    throw new HTTPException(500, {
      message: 'Failed to create storage integration',
    });
  }
}

/**
 * Validate storage credentials by attempting to access the bucket
 */
async function validateStorageCredentials(request: CreateS3IntegrationRequest): Promise<void> {
  // Build storage config from request
  let config: StorageConfig;

  console.info('Validating storage credentials for provider:', request.provider);

  if (request.provider === 's3') {
    if (!request.region || !request.accessKeyId || !request.secretAccessKey || !request.bucket) {
      throw new Error('Invalid credentials: Missing required S3 fields');
    }
    config = {
      provider: 's3',
      region: request.region,
      bucket: request.bucket,
      accessKeyId: request.accessKeyId,
      secretAccessKey: request.secretAccessKey,
    };
  } else if (request.provider === 'r2') {
    if (!request.accountId || !request.accessKeyId || !request.secretAccessKey || !request.bucket) {
      throw new Error('Invalid credentials: Missing required R2 fields');
    }
    config = {
      provider: 'r2',
      accountId: request.accountId,
      bucket: request.bucket,
      accessKeyId: request.accessKeyId,
      secretAccessKey: request.secretAccessKey,
    };
  } else if (request.provider === 'gcs') {
    if (!request.projectId || !request.serviceAccountKey || !request.bucket) {
      throw new Error('Invalid credentials: Missing required GCS fields');
    }

    // Validate service account key is valid JSON
    try {
      const parsed = JSON.parse(request.serviceAccountKey);
      console.info('GCS service account key parsed successfully, project_id:', parsed.project_id);
    } catch (e) {
      console.error('Failed to parse GCS service account key:', e);
      throw new Error('Invalid credentials: Service account key must be valid JSON');
    }

    config = {
      provider: 'gcs',
      projectId: request.projectId,
      bucket: request.bucket,
      serviceAccountKey: request.serviceAccountKey,
    };
  } else {
    throw new Error('Invalid provider type');
  }

  // Test the credentials
  console.info('Testing credentials for bucket:', config.bucket);
  const isValid = await testStorageCredentials(config);
  console.info('Credential test result:', isValid);

  if (!isValid) {
    throw new Error('Invalid credentials: Unable to access the specified bucket');
  }
}
