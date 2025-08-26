import { getDefaultProvider, getProviderForOrganization } from '@buster/data-source';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import {
  type MigrateStorageAssetsInput,
  MigrateStorageAssetsInputSchema,
  type MigrateStorageAssetsOutput,
} from './interfaces';

/**
 * Task for migrating existing storage assets to customer's storage integration
 *
 * This task:
 * 1. Lists all existing assets in default R2 storage for the organization
 * 2. Downloads each asset from R2
 * 3. Uploads each asset to customer's storage
 * 4. Optionally deletes from R2 after successful migration
 * 5. Returns migration summary with any errors
 */
export const migrateStorageAssets: ReturnType<
  typeof schemaTask<
    'migrate-storage-assets',
    typeof MigrateStorageAssetsInputSchema,
    MigrateStorageAssetsOutput
  >
> = schemaTask({
  id: 'migrate-storage-assets',
  schema: MigrateStorageAssetsInputSchema,
  machine: {
    preset: 'large-1x', // 4 vCPU, 8GB RAM for handling large datasets
  },
  maxDuration: 1800, // 30 minutes max
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: MigrateStorageAssetsInput): Promise<MigrateStorageAssetsOutput> => {
    const startTime = Date.now();
    const errors: Array<{ key: string; error: string }> = [];

    try {
      logger.log('Starting storage asset migration', {
        integrationId: payload.integrationId,
        organizationId: payload.organizationId,
      });

      // Get default R2 provider to read from
      const defaultProvider = await getDefaultProvider();

      // Get customer's storage provider to write to
      const customerProvider = await getProviderForOrganization(payload.organizationId);

      // Define prefixes to migrate
      const prefixesToMigrate = [
        `exports/${payload.organizationId}/`,
        `static-report-assets/${payload.organizationId}/`,
      ];

      let totalAssets = 0;
      let migratedAssets = 0;
      let failedAssets = 0;

      for (const prefix of prefixesToMigrate) {
        logger.log('Migrating assets with prefix', { prefix });

        try {
          // List all objects with this prefix
          const objects = await defaultProvider.list(prefix, { maxKeys: 1000 });
          totalAssets += objects.length;

          logger.log('Found assets to migrate', {
            prefix,
            count: objects.length,
          });

          // Process in batches to avoid overwhelming the system
          const BATCH_SIZE = 10;
          for (let i = 0; i < objects.length; i += BATCH_SIZE) {
            const batch = objects.slice(i, i + BATCH_SIZE);

            await Promise.all(
              batch.map(async (object) => {
                try {
                  // Download from default storage
                  const downloadResult = await defaultProvider.download(object.key);

                  if (!downloadResult.success || !downloadResult.data) {
                    throw new Error(`Failed to download: ${downloadResult.error}`);
                  }

                  // Upload to customer storage
                  const uploadResult = await customerProvider.upload(
                    object.key,
                    downloadResult.data,
                    downloadResult.contentType
                      ? { contentType: downloadResult.contentType }
                      : undefined
                  );

                  if (!uploadResult.success) {
                    throw new Error(`Failed to upload: ${uploadResult.error}`);
                  }

                  migratedAssets++;
                  logger.log('Successfully migrated asset', { key: object.key });

                  // Optional: Delete from default storage after successful migration
                  // Commented out for safety - uncomment if you want to delete after migration
                  // await defaultProvider.delete(object.key);
                } catch (error) {
                  failedAssets++;
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                  errors.push({
                    key: object.key,
                    error: errorMessage,
                  });

                  logger.error('Failed to migrate asset', {
                    key: object.key,
                    error: errorMessage,
                  });
                }
              })
            );

            // Log progress
            logger.log('Migration progress', {
              processed: i + batch.length,
              total: objects.length,
              prefix,
            });
          }
        } catch (error) {
          logger.error('Failed to list or process assets for prefix', {
            prefix,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const executionTimeMs = Date.now() - startTime;

      logger.log('Storage asset migration completed', {
        totalAssets,
        migratedAssets,
        failedAssets,
        executionTimeMs,
      });

      return {
        success: failedAssets === 0,
        totalAssets,
        migratedAssets,
        failedAssets,
        errors: errors.length > 0 ? errors : undefined,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      logger.error('Unexpected error during migration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        totalAssets: 0,
        migratedAssets: 0,
        failedAssets: 0,
        errors: [
          {
            key: 'migration',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
        executionTimeMs,
      };
    }
  },
});
