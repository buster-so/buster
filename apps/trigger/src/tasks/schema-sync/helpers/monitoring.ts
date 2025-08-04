import { logger, metadata } from '@trigger.dev/sdk/v3';
import type { OrganizationSyncResult, TaskExecutionResult } from '../types';

/**
 * Log metrics for monitoring and alerting
 */
export function logExecutionMetrics(result: TaskExecutionResult): void {
  // Log overall metrics
  logger.info('Schema sync execution metrics', {
    organizationsProcessed: result.organizationsProcessed,
    totalDiscrepancies: result.totalDiscrepancies,
    criticalIssues: result.criticalIssues,
    warnings: result.warnings,
    notificationsSent: result.notificationsSent,
    executionTimeMs: result.executionTimeMs,
    executionTimeSec: Math.round(result.executionTimeMs / 1000),
    errorCount: result.errors?.length || 0,
  });

  // Log critical issues for alerting
  if (result.criticalIssues > 0) {
    logger.warn('Critical schema issues detected', {
      criticalCount: result.criticalIssues,
      affectedOrganizations: result.organizationsProcessed,
    });
  }

  // Log performance metrics
  const avgTimePerOrg =
    result.organizationsProcessed > 0
      ? Math.round(result.executionTimeMs / result.organizationsProcessed)
      : 0;

  logger.info('Performance metrics', {
    totalExecutionTimeMs: result.executionTimeMs,
    avgTimePerOrgMs: avgTimePerOrg,
    organizationsPerMinute:
      result.organizationsProcessed > 0
        ? Math.round((result.organizationsProcessed / result.executionTimeMs) * 60000)
        : 0,
  });
}

/**
 * Log organization-specific metrics
 */
export function logOrganizationMetrics(result: OrganizationSyncResult): void {
  const metrics = {
    organizationId: result.organizationId,
    organizationName: result.organizationName,
    success: result.success,
    dataSourcesChecked: result.dataSourcesChecked,
    datasetsChecked: result.datasetsChecked,
    discrepancies: result.discrepancies,
    criticalCount: result.criticalCount,
    warningCount: result.warningCount,
    notificationSent: result.notificationSent,
  };

  if (result.success) {
    logger.info('Organization processed successfully', metrics);
  } else {
    logger.error('Organization processing failed', {
      ...metrics,
      error: result.error,
    });
  }

  // Update progress metadata for Trigger.dev dashboard
  metadata.increment('organizationsProcessed', 1);
  metadata.increment('totalDiscrepancies', result.discrepancies);
  metadata.increment('criticalIssues', result.criticalCount);
  metadata.increment('warnings', result.warningCount);
}

/**
 * Initialize monitoring metadata
 */
export function initializeMonitoring(): void {
  // Set initial metadata for progress tracking
  metadata.set('startTime', new Date().toISOString());
  metadata.set('organizationsProcessed', 0);
  metadata.set('totalDiscrepancies', 0);
  metadata.set('criticalIssues', 0);
  metadata.set('warnings', 0);
  metadata.set('notificationsSent', 0);
  metadata.set('status', 'running');
}

/**
 * Finalize monitoring metadata
 */
export function finalizeMonitoring(success: boolean, result?: TaskExecutionResult): void {
  metadata.set('endTime', new Date().toISOString());
  metadata.set('status', success ? 'completed' : 'failed');

  if (result) {
    metadata.set('finalMetrics', {
      organizationsProcessed: result.organizationsProcessed,
      totalDiscrepancies: result.totalDiscrepancies,
      criticalIssues: result.criticalIssues,
      warnings: result.warnings,
      notificationsSent: result.notificationsSent,
      executionTimeMs: result.executionTimeMs,
      errors: result.errors || [],
    });
  }
}

/**
 * Log data source introspection metrics
 */
export function logIntrospectionMetrics(
  dataSourceId: string,
  database: string,
  schema: string,
  tablesCount: number,
  columnsCount: number,
  durationMs: number
): void {
  logger.info('Introspection completed', {
    dataSourceId,
    database,
    schema,
    tablesCount,
    columnsCount,
    durationMs,
    tablesPerSecond: tablesCount > 0 ? Math.round((tablesCount / durationMs) * 1000) : 0,
  });
}

/**
 * Log notification metrics
 */
export function logNotificationMetrics(
  organizationId: string,
  organizationName: string,
  channelId: string,
  success: boolean,
  discrepancyCount: number
): void {
  const metrics = {
    organizationId,
    organizationName,
    channelId,
    success,
    discrepancyCount,
    notificationType: 'schema_sync',
  };

  if (success) {
    logger.info('Notification sent successfully', metrics);
    metadata.increment('notificationsSent', 1);
  } else {
    logger.warn('Failed to send notification', metrics);
  }
}

/**
 * Create CloudWatch-compatible metrics
 * These can be parsed by log aggregation tools
 */
export function emitCloudWatchMetrics(result: TaskExecutionResult): void {
  // Emit as structured logs that CloudWatch can parse
  console.info(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: 'BusterSchemaSyncTask',
            Dimensions: [['Environment']],
            Metrics: [
              {
                Name: 'OrganizationsProcessed',
                Unit: 'Count',
              },
              {
                Name: 'TotalDiscrepancies',
                Unit: 'Count',
              },
              {
                Name: 'CriticalIssues',
                Unit: 'Count',
              },
              {
                Name: 'Warnings',
                Unit: 'Count',
              },
              {
                Name: 'NotificationsSent',
                Unit: 'Count',
              },
              {
                Name: 'ExecutionTime',
                Unit: 'Milliseconds',
              },
              {
                Name: 'Errors',
                Unit: 'Count',
              },
            ],
          },
        ],
      },
      Environment: process.env.NODE_ENV || 'development',
      OrganizationsProcessed: result.organizationsProcessed,
      TotalDiscrepancies: result.totalDiscrepancies,
      CriticalIssues: result.criticalIssues,
      Warnings: result.warnings,
      NotificationsSent: result.notificationsSent,
      ExecutionTime: result.executionTimeMs,
      Errors: result.errors?.length || 0,
    })
  );
}
