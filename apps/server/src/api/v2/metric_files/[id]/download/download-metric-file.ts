import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import type { User } from '@buster/database/queries';
import { getUserOrganizationId } from '@buster/database/queries';
import type { ExportMetricDataOutput, MetricDownloadResponse } from '@buster/server-shared/metrics';
import { runs, tasks } from '@trigger.dev/sdk';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for downloading metric file data as CSV
 *
 * This handler:
 * 1. Validates user has access to the organization
 * 2. Checks user has permission to view the metric file
 * 3. Triggers the export task in Trigger.dev
 * 4. Waits for the task to complete (max 2 minutes)
 * 5. Returns a presigned URL for downloading the CSV file
 *
 * The download URL expires after 2 minutes for security
 */
export async function downloadMetricFileHandler(
  metricId: string,
  user: User,
  reportFileId?: string,
  metricVersionNumber?: number
): Promise<MetricDownloadResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to download metric files',
    });
  }

  const { organizationId } = userOrg;

  // Check if user has permission to view this metric file
  const permissionCheck: AssetPermissionCheck = {
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId,
  };

  const permissionResult = await checkPermission(permissionCheck);

  if (!permissionResult.hasAccess) {
    throw new HTTPException(403, {
      message: 'You do not have permission to download this metric file',
    });
  }

  try {
    // Trigger the export task with idempotency to prevent duplicates
    // If the same user tries to download the same metric within 2 minutes,
    // it will return the existing task instead of creating a new one
    const handle = await tasks.trigger(
      'export-metric-data',
      {
        metricId,
        userId: user.id,
        organizationId,
        reportFileId,
        metricVersionNumber,
      },
      {
        idempotencyKey: metricVersionNumber
          ? `export-${user.id}-${metricId}-v${metricVersionNumber}`
          : reportFileId
            ? `export-${user.id}-${metricId}-${reportFileId}`
            : `export-${user.id}-${metricId}`,
        idempotencyKeyTTL: '2m', // 2 minutes TTL
      }
    );

    // Poll for task completion with timeout
    const startTime = Date.now();
    const timeout = 120000; // 2 minutes
    const pollInterval = 2000; // Poll every 2 seconds

    let run: Awaited<ReturnType<typeof runs.retrieve>>;
    while (true) {
      run = await runs.retrieve(handle.id);

      // Check if task completed, failed, or was canceled
      if (run.status === 'COMPLETED' || run.status === 'FAILED' || run.status === 'CANCELED') {
        break;
      }

      // Check for timeout
      if (Date.now() - startTime > timeout) {
        throw new HTTPException(504, {
          message: 'Export took too long to complete. Please try again with less data.',
        });
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Check task status
    if (run.status === 'FAILED' || run.status === 'CANCELED') {
      throw new HTTPException(500, {
        message: `Export task ${run.status.toLowerCase()}`,
      });
    }

    // Check if task completed successfully
    if (!run.output) {
      throw new HTTPException(500, {
        message: 'Export task did not return any output',
      });
    }

    const output = run.output as ExportMetricDataOutput;

    if (!output.success) {
      // Handle specific error codes
      const errorCode = output.errorCode;
      const errorMessage = output.error || 'Export failed';

      switch (errorCode) {
        case 'UNAUTHORIZED':
          throw new HTTPException(403, {
            message: errorMessage,
          });
        case 'NOT_FOUND':
          throw new HTTPException(404, {
            message: 'Metric file not found or data source credentials missing',
          });
        case 'QUERY_ERROR':
          throw new HTTPException(400, {
            message: `Query execution failed: ${errorMessage}`,
          });
        case 'UPLOAD_ERROR':
          throw new HTTPException(500, {
            message: 'Failed to prepare download file',
          });
        default:
          throw new HTTPException(500, {
            message: errorMessage,
          });
      }
    }

    // Validate required output fields
    if (!output.downloadUrl || !output.expiresAt) {
      throw new HTTPException(500, {
        message: 'Export succeeded but download URL was not generated',
      });
    }

    // Return successful response
    return {
      downloadUrl: output.downloadUrl,
      expiresAt: output.expiresAt,
      fileSize: output.fileSize || 0,
      fileName: output.fileName || `metric-${metricId}.csv`,
      rowCount: output.rowCount || 0,
      message: 'Download link expires in 2 minutes. Please start your download immediately.',
    };
  } catch (error) {
    // Re-throw HTTPException as-is
    if (error instanceof HTTPException) {
      throw error;
    }

    // Log unexpected errors
    console.error('Unexpected error during metric download:', error);

    throw new HTTPException(500, {
      message: 'An unexpected error occurred during export',
    });
  }
}
