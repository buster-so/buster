import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSecret } from '@buster/secrets';
import { logger, task } from '@trigger.dev/sdk';
import { CleanupExportFileInputSchema } from './interfaces';

/**
 * Cleanup task to delete export files from R2 storage
 * This serves as a backup to R2's lifecycle rules
 */
export const cleanupExportFile = task({
  id: 'cleanup-export-file',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { key: string }) => {
    const validated = CleanupExportFileInputSchema.parse(payload);

    // Fetch secrets in real-time
    const [accountId, accessKeyId, secretAccessKey, bucket] = await Promise.all([
      getSecret('R2_ACCOUNT_ID'),
      getSecret('R2_ACCESS_KEY_ID'),
      getSecret('R2_SECRET_ACCESS_KEY'),
      getSecret('R2_BUCKET').catch(() => 'metric-exports'), // Default if not set
    ]);

    // Initialize R2 client with fetched secrets
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    try {
      logger.log('Cleaning up export file', {
        key: validated.key,
        bucket,
      });

      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: validated.key,
        })
      );

      logger.log('Export file deleted successfully', { key: validated.key });

      return {
        success: true,
        key: validated.key,
      };
    } catch (error) {
      // File might already be deleted by lifecycle rules
      if (error instanceof Error && error.name === 'NoSuchKey') {
        logger.info('File already deleted (likely by lifecycle rule)', {
          key: validated.key,
        });

        return {
          success: true,
          key: validated.key,
          note: 'Already deleted',
        };
      }

      logger.error('Failed to delete export file', {
        key: validated.key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Re-throw to trigger retry
      throw error;
    }
  },
});
