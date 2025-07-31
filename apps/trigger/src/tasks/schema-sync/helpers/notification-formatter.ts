import type {
  SchemaDiscrepancy,
  SchemaSyncRunWithDiscrepancies,
  SlackNotificationMessage,
} from './types';

/**
 * Format schema sync results into a Slack notification
 * @param run Schema sync run with discrepancies
 * @param organizationName Name of the organization
 * @returns Formatted Slack notification
 */
export function formatSchemaSyncNotification(
  run: SchemaSyncRunWithDiscrepancies,
  organizationName: string
): SlackNotificationMessage {
  const blocks: SlackNotificationMessage['blocks'] = [];

  // Header block
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `🔍 Schema Sync Report - ${organizationName}`,
    },
  });

  // Summary section
  const { critical, warning, info } = categorizeDiscrepancies(run.discrepancies);
  const totalIssues = run.discrepancies.length;

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Summary*\n• Total issues found: *${totalIssues}*\n• Critical: *${critical.length}* 🔴\n• Warnings: *${warning.length}* 🟡\n• Info: *${info.length}* 🔵\n• Data sources checked: *${run.dataSources.length}*`,
    },
  });

  // Add divider
  blocks.push({ type: 'divider' });

  // Group discrepancies by dataset
  const groupedByDataset = groupDiscrepanciesByDataset(run.discrepancies);

  // Add details for each dataset with issues
  for (const [datasetName, discrepancies] of Object.entries(groupedByDataset)) {
    const datasetCritical = discrepancies.filter((d) => d.severity === 'critical').length;
    const datasetWarning = discrepancies.filter((d) => d.severity === 'warning').length;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${datasetName}*\nCritical: ${datasetCritical} | Warnings: ${datasetWarning}`,
      },
    });

    // Add top 3 issues for this dataset
    const topIssues = discrepancies.slice(0, 3);
    for (const issue of topIssues) {
      const icon =
        issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      const issueText = formatDiscrepancyMessage(issue);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${icon} ${issueText}`,
        },
      });
    }

    if (discrepancies.length > 3) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_...and ${discrepancies.length - 3} more issues_`,
          },
        ],
      });
    }
  }

  // Add timestamp footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Run completed at ${run.completedAt?.toLocaleString() || 'N/A'} | Duration: ${
          run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : 'N/A'
        }`,
      },
    ],
  });

  return {
    organizationId: run.organizationId,
    runId: run.id,
    blocks,
    text: `Schema Sync Report - ${organizationName}: ${totalIssues} issues found (${critical.length} critical, ${warning.length} warnings)`,
    messageType: 'schema_sync_report',
  };
}

/**
 * Format a single discrepancy into a readable message
 */
function formatDiscrepancyMessage(discrepancy: SchemaDiscrepancy): string {
  switch (discrepancy.type) {
    case 'missing_table':
      return `Table \`${discrepancy.tableName}\` not found in database`;

    case 'missing_column':
      return `Column \`${discrepancy.columnName}\` missing in table \`${discrepancy.tableName}\``;

    case 'type_mismatch':
      return `Type mismatch for \`${discrepancy.tableName}.${discrepancy.columnName}\`: expected \`${discrepancy.details?.expectedType}\`, found \`${discrepancy.details?.actualType}\``;

    case 'unknown_column':
      return `Unknown column \`${discrepancy.columnName}\` in YML for table \`${discrepancy.tableName}\``;

    default:
      return discrepancy.message;
  }
}

/**
 * Format a simple error notification for Slack
 * @param organizationName Name of the organization
 * @param error Error message
 * @param runId Optional run ID
 * @returns Formatted error notification
 */
export function formatSchemaSyncErrorNotification(
  organizationName: string,
  error: string,
  runId?: string
): SlackNotificationMessage {
  const blocks: SlackNotificationMessage['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `❌ Schema Sync Error - ${organizationName}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error Details*\n\`\`\`${error}\`\`\``,
      },
    },
  ];

  if (runId) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Run ID: ${runId}`,
        },
      ],
    });
  }

  return {
    organizationId: '', // Will be set by caller
    runId: runId || '',
    blocks,
    text: `Schema Sync Error - ${organizationName}: ${error}`,
    messageType: 'schema_sync_error',
  };
}

/**
 * Categorize discrepancies by severity
 */
function categorizeDiscrepancies(discrepancies: SchemaDiscrepancy[]): {
  critical: SchemaDiscrepancy[];
  warning: SchemaDiscrepancy[];
  info: SchemaDiscrepancy[];
} {
  const result = {
    critical: [] as SchemaDiscrepancy[],
    warning: [] as SchemaDiscrepancy[],
    info: [] as SchemaDiscrepancy[],
  };

  for (const discrepancy of discrepancies) {
    switch (discrepancy.severity) {
      case 'critical':
        result.critical.push(discrepancy);
        break;
      case 'warning':
        result.warning.push(discrepancy);
        break;
      case 'info':
        result.info.push(discrepancy);
        break;
    }
  }

  return result;
}

/**
 * Group discrepancies by dataset name
 */
function groupDiscrepanciesByDataset(
  discrepancies: SchemaDiscrepancy[]
): Record<string, SchemaDiscrepancy[]> {
  const grouped: Record<string, SchemaDiscrepancy[]> = {};

  for (const discrepancy of discrepancies) {
    const key = discrepancy.datasetName;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(discrepancy);
  }

  return grouped;
}

/**
 * Format a summary message for data team channel
 * @param organizationReports Array of organization reports
 * @returns Formatted summary notification
 */
export function formatDataTeamSummary(
  organizationReports: Array<{
    organizationName: string;
    criticalCount: number;
    warningCount: number;
    totalCount: number;
  }>
): SlackNotificationMessage {
  const blocks: SlackNotificationMessage['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Daily Schema Sync Summary',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}*\n\nProcessed ${organizationReports.length} organizations`,
      },
    },
    { type: 'divider' },
  ];

  // Add organization summaries
  const orgsWithIssues = organizationReports.filter((org) => org.totalCount > 0);

  if (orgsWithIssues.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Organizations with Issues:*',
      },
    });

    for (const org of orgsWithIssues) {
      const criticalEmoji = org.criticalCount > 0 ? '🔴' : '✅';
      const warningEmoji = org.warningCount > 0 ? '🟡' : '✅';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${org.organizationName}*\n  ${criticalEmoji} Critical: ${org.criticalCount}\n  ${warningEmoji} Warnings: ${org.warningCount}\n  Total: ${org.totalCount}`,
        },
      });
    }
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ All organizations have clean schemas!',
      },
    });
  }

  // Footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Generated at ${new Date().toLocaleTimeString()}`,
      },
    ],
  });

  return {
    organizationId: '', // Not org-specific
    runId: '', // Summary doesn't have a specific run ID
    blocks,
    text: `Daily Schema Sync Summary - ${orgsWithIssues.length} organizations with issues`,
    messageType: 'schema_sync_summary',
  };
}
