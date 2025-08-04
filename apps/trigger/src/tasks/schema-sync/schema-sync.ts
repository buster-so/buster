import { logger, schedules } from '@trigger.dev/sdk';
import {
  emitCloudWatchMetrics,
  finalizeMonitoring,
  initializeMonitoring,
  logExecutionMetrics,
  logNotificationMetrics,
  logOrganizationMetrics,
  processAllOrganizations,
  sendDataTeamSummary,
  sendOrganizationErrorNotification,
  sendOrganizationNotification,
} from './helpers';
import type { TaskExecutionResult } from './types';

/**
 * Schema Sync Task
 *
 * Runs daily at midnight MST to:
 * 1. Introspect customer data sources to get current table/column schemas
 * 2. Compare against measures and dimensions defined in dataset YML files
 * 3. Send Slack notifications when discrepancies are found
 * 4. Track all messages in the database for audit trail
 *
 * Uses lightweight introspection approach by grouping datasets by database/schema
 * to minimize queries to customer data sources.
 */
export const schemaSyncTask = schedules.task({
  id: 'schema-sync',
  // Run at midnight MST (7:00 UTC)
  cron: '0 7 * * *', // Every day at 7:00 UTC (midnight MST)
  maxDuration: 3600, // 1 hour max
  run: async (payload) => {
    const startTime = Date.now();
    const timestamp = payload.timestamp
      ? payload.timestamp.toISOString()
      : new Date().toISOString();

    logger.info('Starting schema sync task', { timestamp });
    initializeMonitoring();

    const executionResult: TaskExecutionResult = {
      success: true,
      executionTimeMs: 0,
      organizationsProcessed: 0,
      totalDiscrepancies: 0,
      criticalIssues: 0,
      warnings: 0,
      notificationsSent: 0,
      errors: [],
    };

    try {
      // Process all organizations
      const processResults = await processAllOrganizations();
      executionResult.organizationsProcessed = processResults.length;

      // Send notifications for each organization with discrepancies
      for (const { result, run } of processResults) {
        if (!result.success) {
          // Track organization errors
          executionResult.errors = executionResult.errors || [];
          executionResult.errors.push({
            organizationId: result.organizationId,
            organizationName: result.organizationName,
            error: result.error || 'Unknown error',
          });

          // Try to send error notification
          await sendOrganizationErrorNotification(
            result.organizationId,
            result.organizationName,
            result.error || 'Failed to process organization'
          );
          continue;
        }

        // Update totals
        executionResult.totalDiscrepancies += result.discrepancies;
        executionResult.criticalIssues += result.criticalCount;
        executionResult.warnings += result.warningCount;

        // Log organization metrics
        logOrganizationMetrics(result);

        // Send notification if there are discrepancies
        if (result.discrepancies > 0) {
          const notificationSent = await sendOrganizationNotification(result, run);

          if (notificationSent) {
            executionResult.notificationsSent++;
            result.notificationSent = true;
          }

          logNotificationMetrics(
            result.organizationId,
            result.organizationName,
            'default', // Would get actual channel from notification result
            notificationSent,
            result.discrepancies
          );
        }
      }

      // Send summary to data team
      if (processResults.length > 0) {
        const results = processResults.map((pr) => pr.result);
        await sendDataTeamSummary(results);
      }

      // Calculate execution time
      executionResult.executionTimeMs = Date.now() - startTime;

      // Log final metrics
      logExecutionMetrics(executionResult);
      emitCloudWatchMetrics(executionResult);
      finalizeMonitoring(true, executionResult);

      logger.info('Schema sync task completed successfully', {
        organizationsProcessed: executionResult.organizationsProcessed,
        totalDiscrepancies: executionResult.totalDiscrepancies,
        criticalIssues: executionResult.criticalIssues,
        warnings: executionResult.warnings,
        notificationsSent: executionResult.notificationsSent,
        executionTimeMs: executionResult.executionTimeMs,
      });

      return {
        success: true,
        timestamp,
        result: executionResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Schema sync task failed', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      finalizeMonitoring(false, executionResult);

      return {
        success: false,
        timestamp,
        error: {
          code: 'SCHEMA_SYNC_FAILED',
          message: errorMessage,
          details: {
            executionTimeMs: Date.now() - startTime,
            partialResult: executionResult,
          },
        },
      };
    }
  },
});
