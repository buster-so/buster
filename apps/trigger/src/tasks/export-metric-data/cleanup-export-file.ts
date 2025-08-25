import { getProviderForOrganization } from '@buster/data-source';
import { logger, task } from '@trigger.dev/sdk';
import { CleanupExportFileInputSchema } from './interfaces';

/**
 * Cleanup task to delete export files from storage
 * Uses customer storage if configured, otherwise default R2
 */
export const cleanupExportFile = task({
  id: 'cleanup-export-file',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { key: string; organizationId: string }) => {
    const validated = CleanupExportFileInputSchema.parse(payload);

    try {
      // Get storage provider (customer storage or default R2)
      const storageProvider = await getProviderForOrganization(validated.organizationId);

      logger.log('Cleaning up export file', {
        key: validated.key,
        organizationId: validated.organizationId,
      });

      const deleted = await storageProvider.delete(validated.key);

      if (deleted) {
        logger.log('Export file deleted successfully', { key: validated.key });
      } else {
        logger.info('File already deleted or not found', { key: validated.key });
      }

      return {
        success: true,
        key: validated.key,
      };
    } catch (error) {
      logger.error('Failed to delete export file', {
        key: validated.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw to trigger retry
      throw error;
    }
  },
});
