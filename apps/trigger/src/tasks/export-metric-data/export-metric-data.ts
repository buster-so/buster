import { randomBytes } from 'node:crypto';
import { type AssetPermissionCheck, checkPermission } from '@buster/access-controls';
import {
  createAdapter,
  getCachedMetricData,
  getProviderForOrganization,
} from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import { getDataSourceCredentials, getMetricForExport } from '@buster/database/queries';
import type { MetricDataResponse } from '@buster/server-shared/metrics';
import { logger, schemaTask } from '@trigger.dev/sdk';
import { convertToCSV } from './csv-helpers';
import { ExportMetricDataInputSchema, type ExportMetricDataOutput } from './interfaces';
const MAX_ROWS = 1000000; // 1 million row limit for safety
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB max file size

/**
 * Task for exporting metric data to CSV and generating a presigned download URL
 *
 * This task:
 * 1. Fetches metric configuration and validates organization access
 * 2. Checks user has permission to view the metric file
 * 3. Retrieves data source credentials from vault
 * 4. Executes the metric's SQL query
 * 5. Converts results to CSV format
 * 6. Uploads to R2 storage
 * 7. Generates a 2 min presigned URL for download
 * 8. Schedules cleanup after 2 mins
 */
export const exportMetricData: ReturnType<
  typeof schemaTask<
    'export-metric-data',
    typeof ExportMetricDataInputSchema,
    ExportMetricDataOutput
  >
> = schemaTask({
  id: 'export-metric-data',
  schema: ExportMetricDataInputSchema,
  machine: {
    preset: 'large-1x', // 4 vCPU, 8GB RAM for handling large datasets
  },
  maxDuration: 300, // 5 minutes max
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload): Promise<ExportMetricDataOutput> => {
    const startTime = Date.now();

    try {
      logger.log('Starting metric export', {
        metricId: payload.metricId,
        userId: payload.userId,
        organizationId: payload.organizationId,
      });

      // Step 1: Fetch metric details and validate access
      const metric = await getMetricForExport({
        metricId: payload.metricId,
        versionNumber: payload.metricVersionNumber,
      });

      // Validate organization access
      if (metric.organizationId !== payload.organizationId) {
        logger.error('Unauthorized access attempt', {
          metricId: payload.metricId,
          metricOrgId: metric.organizationId,
          requestOrgId: payload.organizationId,
        });

        return {
          success: false,
          error: 'You do not have permission to export this metric',
          errorCode: 'UNAUTHORIZED',
        };
      }

      // Step 1b: Check user has permission to view this metric file
      const permissionCheck: AssetPermissionCheck = {
        userId: payload.userId,
        assetId: payload.metricId,
        assetType: 'metric_file',
        requiredRole: 'can_view',
        organizationId: payload.organizationId,
      };

      const permissionResult = await checkPermission(permissionCheck);

      if (!permissionResult.hasAccess) {
        logger.error('User lacks permission to access metric file', {
          metricId: payload.metricId,
          userId: payload.userId,
          organizationId: payload.organizationId,
        });

        return {
          success: false,
          error: 'You do not have permission to export this metric',
          errorCode: 'UNAUTHORIZED',
        };
      }

      logger.log('Metric validated', {
        metricName: metric.name,
        dataSourceId: metric.dataSourceId,
      });

      // Step 2: Check cache if reportFileId is provided AND no specific version is requested
      // When a specific version is requested, always fetch fresh data
      let queryResult:
        | Awaited<ReturnType<Awaited<ReturnType<typeof createAdapter>>['query']>>
        | undefined;
      let cachedData: MetricDataResponse | undefined;

      if (payload.reportFileId && !payload.metricVersionNumber) {
        logger.log('Checking cache for metric data', {
          metricId: payload.metricId,
          reportFileId: payload.reportFileId,
          organizationId: payload.organizationId,
        });

        try {
          const cached = await getCachedMetricData(
            payload.organizationId,
            payload.metricId,
            payload.reportFileId
          );

          if (cached) {
            cachedData = cached;
            logger.log('Cache hit - using cached data', {
              metricId: payload.metricId,
              reportFileId: payload.reportFileId,
              rowCount: cachedData.data?.length || 0,
            });
          } else {
            logger.log('Cache miss - will fetch from data source', {
              metricId: payload.metricId,
              reportFileId: payload.reportFileId,
            });
          }
        } catch (error) {
          logger.warn('Error checking cache, falling back to data source', {
            metricId: payload.metricId,
            reportFileId: payload.reportFileId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else if (payload.metricVersionNumber) {
        logger.log('Skipping cache - specific version requested', {
          metricId: payload.metricId,
          versionNumber: payload.metricVersionNumber,
        });
      }

      // Step 3: If no cached data, get from data source
      if (!cachedData) {
        // Get data source credentials from vault
        let credentials: Credentials;

        try {
          const rawCredentials = await getDataSourceCredentials({
            dataSourceId: metric.dataSourceId,
          });

          // Ensure credentials have the correct type
          credentials = {
            ...rawCredentials,
            type: rawCredentials.type || metric.dataSourceType,
          } as Credentials;
        } catch (error) {
          logger.error('Failed to retrieve data source credentials', {
            error: error instanceof Error ? error.message : 'Unknown error',
            dataSourceId: metric.dataSourceId,
          });

          return {
            success: false,
            error: 'Failed to access data source credentials',
            errorCode: 'NOT_FOUND',
          };
        }

        // Execute query using data source adapter
        logger.log('Executing metric query', { sql: `${metric.sql?.substring(0, 100)}...` });

        const adapter = await createAdapter(credentials);

        try {
          if (!metric.sql) {
            throw new Error('Metric SQL is missing');
          }
          queryResult = await adapter.query(
            metric.sql,
            [], // No parameters for metric queries
            MAX_ROWS,
            60000 // 60 second query timeout
          );

          logger.log('Query executed successfully', {
            rowCount: queryResult.rowCount,
            fieldCount: queryResult.fields.length,
          });
        } catch (error) {
          logger.error('Query execution failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return {
            success: false,
            error: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errorCode: 'QUERY_ERROR',
          };
        } finally {
          // Always close the adapter connection
          await adapter.close().catch((err: unknown) => {
            logger.warn('Failed to close adapter connection', { error: err });
          });
        }
      }

      // Step 4: Convert to CSV
      logger.log('Converting results to CSV');

      let csv: string;
      let rowCount: number;

      if (cachedData) {
        // Convert cached MetricDataResponse to CSV
        // data_metadata contains column information similar to query fields
        const fields =
          cachedData.data_metadata?.column_metadata?.map((col) => ({
            name: col.name,
            type: col.type || 'text', // Provide default type if not specified
          })) || [];

        csv = convertToCSV(cachedData.data || [], fields);
        rowCount = cachedData.data?.length || 0;
      } else if (queryResult) {
        // Convert fresh query results to CSV
        csv = convertToCSV(queryResult.rows, queryResult.fields);
        rowCount = queryResult.rowCount;
      } else {
        // This shouldn't happen, but handle gracefully
        logger.error('No data to convert to CSV');
        return {
          success: false,
          error: 'No data available for export',
          errorCode: 'UNKNOWN',
        };
      }

      const csvSize = Buffer.byteLength(csv, 'utf-8');

      // Check file size
      if (csvSize > MAX_FILE_SIZE) {
        logger.error('CSV file too large', {
          size: csvSize,
          maxSize: MAX_FILE_SIZE,
        });

        return {
          success: false,
          error: `File size (${Math.round(csvSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`,
          errorCode: 'QUERY_ERROR',
        };
      }

      logger.log('CSV generated', {
        size: csvSize,
        rowCount: rowCount,
        fromCache: !!cachedData,
      });

      // Step 5: Generate unique storage key with security
      const randomId = randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const sanitizedMetricName = metric.name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
      const fileName = `${sanitizedMetricName}_${timestamp}.csv`;
      const key = `exports/${payload.organizationId}/${payload.metricId}/${timestamp}-${randomId}/${fileName}`;

      // Step 6: Get storage provider (customer storage or default R2)
      const storageProvider = await getProviderForOrganization(payload.organizationId);

      // Step 7: Upload to storage
      logger.log('Uploading to storage', { key });

      const uploadResult = await storageProvider.upload(key, csv, {
        contentType: 'text/csv',
        contentDisposition: `attachment; filename="${fileName}"`,
        metadata: {
          'metric-id': payload.metricId,
          'user-id': payload.userId,
          'organization-id': payload.organizationId,
          'row-count': String(rowCount),
          'created-at': new Date().toISOString(),
          'auto-delete': 'true',
        },
      });

      if (!uploadResult.success) {
        logger.error('Upload to storage failed', {
          error: uploadResult.error,
        });

        return {
          success: false,
          error: 'Failed to upload file to storage',
          errorCode: 'UPLOAD_ERROR',
        };
      }

      logger.log('File uploaded successfully');

      // Step 8: Generate presigned URL with 2min expiry
      let downloadUrl: string;

      try {
        downloadUrl = await storageProvider.getSignedUrl(key, 120); // 120 seconds / 2 mins
        logger.log('Presigned URL generated', { expiresIn: 120 });
      } catch (error) {
        logger.error('Failed to generate presigned URL', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
          success: false,
          error: 'Failed to generate download URL',
          errorCode: 'UNKNOWN',
        };
      }

      // Step 9: Schedule cleanup after 2 mins (matches URL expiry) and trigger job idempotency
      try {
        const { cleanupExportFile } = await import('./cleanup-export-file');
        await cleanupExportFile.trigger(
          { key, organizationId: payload.organizationId },
          { delay: '2m' } // 2 min delay
        );

        logger.log('Cleanup scheduled for 2 mins');
      } catch (error) {
        // Non-critical error, just log
        logger.warn('Failed to schedule cleanup', { error });
      }

      const processingTime = Date.now() - startTime;

      logger.log('Export completed successfully', {
        metricId: payload.metricId,
        processingTime,
        fileSize: csvSize,
        rowCount: rowCount,
        fromCache: !!cachedData,
      });

      return {
        success: true,
        downloadUrl,
        expiresAt: new Date(Date.now() + 120000).toISOString(), // 2 mins from now
        fileSize: csvSize,
        rowCount: rowCount,
        fileName,
      };
    } catch (error) {
      logger.error('Unexpected error during export', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        errorCode: 'UNKNOWN',
      };
    }
  },
});
