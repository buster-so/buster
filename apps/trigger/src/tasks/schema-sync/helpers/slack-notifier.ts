import {
  createSlackMessageTracking,
  getActiveSlackIntegration,
  getSecretByName,
} from '@buster/database';
import { logger } from '@trigger.dev/sdk/v3';
import type { OrganizationSyncResult } from '../types';
import {
  formatDataTeamSummary,
  formatSchemaSyncErrorNotification,
  formatSchemaSyncNotification,
} from './notification-formatter';
import type { SchemaSyncRunWithDiscrepancies, SlackNotificationMessage } from './types';

// Data team Slack configuration (should be in env vars)
const DATA_TEAM_SLACK_WEBHOOK_URL = process.env.DATA_TEAM_SLACK_WEBHOOK_URL;
const DATA_TEAM_CHANNEL_ID = process.env.DATA_TEAM_SLACK_CHANNEL_ID || '#data-team-alerts';

/**
 * Send schema sync notifications for an organization
 */
export async function sendOrganizationNotification(
  result: OrganizationSyncResult,
  run: SchemaSyncRunWithDiscrepancies
): Promise<boolean> {
  try {
    // Skip if no discrepancies
    if (result.discrepancies === 0) {
      logger.info('No discrepancies found, skipping notification', {
        organizationId: result.organizationId,
      });
      return false;
    }

    // Get active Slack integration
    const slackIntegration = await getActiveSlackIntegration({
      organizationId: result.organizationId,
    });

    if (!slackIntegration || !slackIntegration.tokenVaultKey) {
      logger.warn('No active Slack integration found', {
        organizationId: result.organizationId,
      });
      return false;
    }

    // Get Slack token from vault
    const tokenSecret = await getSecretByName(slackIntegration.tokenVaultKey);
    if (!tokenSecret?.secret) {
      logger.error('Failed to retrieve Slack token from vault', {
        organizationId: result.organizationId,
        vaultKey: slackIntegration.tokenVaultKey,
      });
      return false;
    }

    // Format notification
    const notification = formatSchemaSyncNotification(run, result.organizationName);

    // Get channel ID from defaultChannel object
    const channelId =
      slackIntegration.defaultChannel && 'id' in slackIntegration.defaultChannel
        ? slackIntegration.defaultChannel.id
        : '#general';

    // Send to Slack
    const sent = await sendSlackMessage(tokenSecret.secret, channelId, notification);

    if (sent.success && sent.messageTs) {
      // Track in database
      await createSlackMessageTracking({
        integrationId: slackIntegration.id,
        internalMessageId: run.id,
        slackChannelId:
          slackIntegration.defaultChannel && 'id' in slackIntegration.defaultChannel
            ? slackIntegration.defaultChannel.id
            : '#general',
        slackMessageTs: sent.messageTs,
        messageType: 'schema_sync',
        content: JSON.stringify(notification),
        senderInfo: {
          sentBy: 'schema-sync-task',
          organizationId: result.organizationId,
          organizationName: result.organizationName,
        },
      });

      logger.info('Schema sync notification sent successfully', {
        organizationId: result.organizationId,
        channelId,
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Failed to send organization notification', {
      organizationId: result.organizationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Send error notification for an organization
 */
export async function sendOrganizationErrorNotification(
  organizationId: string,
  organizationName: string,
  error: string,
  runId?: string
): Promise<boolean> {
  try {
    // Get active Slack integration
    const slackIntegration = await getActiveSlackIntegration({ organizationId });

    if (!slackIntegration || !slackIntegration.tokenVaultKey) {
      logger.warn('No active Slack integration found for error notification', {
        organizationId,
      });
      return false;
    }

    // Get Slack token from vault
    const tokenSecret = await getSecretByName(slackIntegration.tokenVaultKey);
    if (!tokenSecret?.secret) {
      logger.error('Failed to retrieve Slack token for error notification', {
        organizationId,
        vaultKey: slackIntegration.tokenVaultKey,
      });
      return false;
    }

    // Format error notification
    const notification = formatSchemaSyncErrorNotification(organizationName, error, runId);

    // Get channel ID from defaultChannel object
    const channelId =
      slackIntegration.defaultChannel && 'id' in slackIntegration.defaultChannel
        ? slackIntegration.defaultChannel.id
        : '#general';

    // Send to Slack
    const sent = await sendSlackMessage(tokenSecret.secret, channelId, notification);

    return sent.success;
  } catch (error) {
    logger.error('Failed to send error notification', {
      organizationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Send summary notification to data team
 */
export async function sendDataTeamSummary(results: OrganizationSyncResult[]): Promise<boolean> {
  try {
    if (!DATA_TEAM_SLACK_WEBHOOK_URL) {
      logger.warn('Data team Slack webhook URL not configured');
      return false;
    }

    // Format summary
    const organizationReports = results.map((r) => ({
      organizationName: r.organizationName,
      criticalCount: r.criticalCount,
      warningCount: r.warningCount,
      totalCount: r.discrepancies,
    }));

    const notification = formatDataTeamSummary(organizationReports);

    // Send via webhook
    const response = await fetch(DATA_TEAM_SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: DATA_TEAM_CHANNEL_ID,
        blocks: notification.blocks,
        text: notification.text,
      }),
    });

    if (!response.ok) {
      logger.error('Failed to send data team summary', {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    logger.info('Data team summary sent successfully');
    return true;
  } catch (error) {
    logger.error('Failed to send data team summary', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Send a Slack message using the Web API
 */
async function sendSlackMessage(
  token: string,
  channel: string,
  notification: SlackNotificationMessage
): Promise<{ success: boolean; messageTs?: string }> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        blocks: notification.blocks,
        text: notification.text,
      }),
    });

    const data = (await response.json()) as {
      ok: boolean;
      error?: string;
      ts?: string;
    };

    if (!data.ok) {
      logger.error('Slack API error', {
        error: data.error,
        channel,
      });
      return { success: false };
    }

    return {
      success: true,
      ...(data.ts && { messageTs: data.ts }),
    };
  } catch (error) {
    logger.error('Failed to send Slack message', {
      error: error instanceof Error ? error.message : 'Unknown error',
      channel,
    });
    return { success: false };
  }
}
