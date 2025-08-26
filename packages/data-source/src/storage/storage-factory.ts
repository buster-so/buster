import { getS3IntegrationByOrganizationId, getSecretByName } from '@buster/database';
import { DATA_SOURCE_KEYS, getSecret } from '@buster/secrets';
import type { CreateS3IntegrationRequest } from '@buster/server-shared';
import { createGCSProvider } from './providers/gcs-provider';
import { createR2Provider } from './providers/r2-provider';
import { createS3Provider } from './providers/s3-provider';
import type { StorageConfig, StorageProvider } from './types';

/**
 * Create a storage provider from configuration
 */
export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case 's3':
      return createS3Provider(config);
    case 'r2':
      return createR2Provider(config);
    case 'gcs':
      return createGCSProvider(config);
    default:
      // This should never happen as TypeScript ensures the config matches one of the union types
      throw new Error(`Unsupported storage provider`);
  }
}

/**
 * Get the default R2 storage provider
 */
export async function getDefaultProvider(): Promise<StorageProvider> {
  const accountId = await getSecret(DATA_SOURCE_KEYS.R2_ACCOUNT_ID);
  const accessKeyId = await getSecret(DATA_SOURCE_KEYS.R2_ACCESS_KEY_ID);
  const secretAccessKey = await getSecret(DATA_SOURCE_KEYS.R2_SECRET_ACCESS_KEY);
  const bucket = await getSecret(DATA_SOURCE_KEYS.R2_BUCKET);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Default R2 storage credentials not configured');
  }

  const config: StorageConfig = {
    provider: 'r2',
    accountId,
    bucket,
    accessKeyId,
    secretAccessKey,
  };

  return createStorageProvider(config);
}

/**
 * Get storage provider for an organization
 * Returns customer storage if configured, otherwise returns default R2 storage
 */
export async function getProviderForOrganization(organizationId: string): Promise<StorageProvider> {
  try {
    // Check if organization has a storage integration
    const integration = await getS3IntegrationByOrganizationId(organizationId);

    if (integration) {
      // Get credentials from vault
      const secretName = `s3-integration-${integration.id}`;
      const secret = await getSecretByName(secretName);

      if (secret?.secret) {
        // Parse the stored credentials
        const credentials = JSON.parse(secret.secret) as CreateS3IntegrationRequest;

        // Create appropriate config based on provider
        let config: StorageConfig;

        if (credentials.provider === 's3') {
          config = {
            provider: 's3',
            region: credentials.region,
            bucket: credentials.bucket,
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          };
        } else if (credentials.provider === 'r2') {
          config = {
            provider: 'r2',
            accountId: credentials.accountId,
            bucket: credentials.bucket,
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          };
        } else if (credentials.provider === 'gcs') {
          config = {
            provider: 'gcs',
            projectId: credentials.projectId,
            bucket: credentials.bucket,
            serviceAccountKey: credentials.serviceAccountKey,
          };
        } else {
          // This should never happen as the type is validated above
          throw new Error(`Unknown provider type`);
        }

        return createStorageProvider(config);
      }
    }
  } catch (error) {
    console.error('Error getting customer storage integration:', error);
    // Fall back to default storage
  }

  // Return default R2 storage
  return getDefaultProvider();
}

/**
 * Test storage credentials
 */
export async function testStorageCredentials(config: StorageConfig): Promise<boolean> {
  try {
    const provider = createStorageProvider(config);
    const result = await provider.testConnection();
    return result.success;
  } catch (error) {
    console.error('Credential test failed:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}
