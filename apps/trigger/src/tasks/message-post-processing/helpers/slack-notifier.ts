import { and, eq, getDb, getSecretByName, isNull, slackIntegrations } from '@buster/database';
import { logger } from '@trigger.dev/sdk/v3';

export interface SlackNotificationParams {
  organizationId: string;
  userName: string | null;
  summaryTitle?: string | undefined;
  summaryMessage?: string | undefined;
  formattedMessage?: string | null | undefined;
  toolCalled: string;
  message?: string | undefined;
}

export interface SlackNotificationResult {
  sent: boolean;
  error?: string;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    verbatim?: boolean;
  };
}

interface SlackMessage {
  blocks?: SlackBlock[];
  text?: string;
}

/**
 * Send a Slack notification based on post-processing results
 */
export async function sendSlackNotification(
  params: SlackNotificationParams
): Promise<SlackNotificationResult> {
  try {
    // Step 1: Check if organization has active Slack integration
    const db = getDb();
    const [integration] = await db
      .select()
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.organizationId, params.organizationId),
          eq(slackIntegrations.status, 'active'),
          isNull(slackIntegrations.deletedAt)
        )
      )
      .limit(1);

    if (!integration) {
      logger.log('No active Slack integration found', { organizationId: params.organizationId });
      return { sent: false, error: 'No active Slack integration' };
    }

    if (!integration.defaultChannelId) {
      logger.log('No default channel configured for Slack integration', {
        organizationId: params.organizationId,
        integrationId: integration.id,
      });
      return { sent: false, error: 'No default channel configured' };
    }

    // Step 2: Check if we should send a notification
    const shouldSendNotification = shouldSendSlackNotification(params);
    if (!shouldSendNotification) {
      logger.log('Notification conditions not met', { params });
      return { sent: false, error: 'Notification conditions not met' };
    }

    // Step 3: Retrieve access token from vault
    if (!integration.tokenVaultKey) {
      logger.error('No token vault key found for integration', {
        integrationId: integration.id,
        organizationId: params.organizationId,
      });
      return { sent: false, error: 'No token vault key found' };
    }

    const tokenSecret = await getSecretByName(integration.tokenVaultKey);
    if (!tokenSecret) {
      logger.error('Failed to retrieve token from vault', {
        tokenVaultKey: integration.tokenVaultKey,
        organizationId: params.organizationId,
      });
      return { sent: false, error: 'Failed to retrieve access token' };
    }

    // Step 4: Format the Slack message
    const slackMessage = formatSlackMessage(params);

    // Step 5: Send the message via Slack API
    const result = await sendSlackMessage(
      tokenSecret.secret,
      integration.defaultChannelId,
      slackMessage
    );

    if (result.success) {
      logger.log('Successfully sent Slack notification', {
        organizationId: params.organizationId,
        channelId: integration.defaultChannelId,
        messageTs: result.messageTs,
      });
      return { sent: true };
    }

    logger.error('Failed to send Slack notification', {
      organizationId: params.organizationId,
      channelId: integration.defaultChannelId,
      error: result.error,
    });
    return { sent: false, error: result.error || 'Failed to send message' };
  } catch (error) {
    logger.error('Error in sendSlackNotification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: params.organizationId,
    });
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Determine if we should send a Slack notification based on the parameters
 */
function shouldSendSlackNotification(params: SlackNotificationParams): boolean {
  // Condition 1: formattedMessage is present (from format-message steps)
  if (params.formattedMessage) {
    return true;
  }

  // Condition 2: summaryTitle and summaryMessage are present (legacy)
  if (params.summaryTitle && params.summaryMessage) {
    return true;
  }

  // Condition 3: toolCalled is 'flagChat' and message is present (legacy)
  if (params.toolCalled === 'flagChat' && params.message) {
    return true;
  }

  return false;
}

/**
 * Format the Slack message based on the notification type
 */
function formatSlackMessage(params: SlackNotificationParams): SlackMessage {
  const userName = params.userName || 'Unknown User';

  // Case 1: Formatted message from workflow (highest priority)
  if (params.formattedMessage) {
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Buster flagged a chat for review:\n*<fakeLink.toEmployeeProfile.com|${userName}>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: params.formattedMessage,
            verbatim: false,
          },
        },
      ],
    };
  }

  // Case 2: Summary notification (summaryTitle and summaryMessage present)
  if (params.summaryTitle && params.summaryMessage) {
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Buster flagged a chat for review:\n*<fakeLink.toEmployeeProfile.com|${userName} - ${params.summaryTitle}>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: params.summaryMessage,
            verbatim: false,
          },
        },
      ],
    };
  }

  // Case 3: Flagged chat notification (toolCalled is 'flagChat' and message present)
  if (params.toolCalled === 'flagChat' && params.message) {
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Buster flagged a chat for review:\n*<fakeLink.toEmployeeProfile.com|${userName} - Flagged Chat>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: params.message,
            verbatim: false,
          },
        },
      ],
    };
  }

  // This shouldn't happen if shouldSendSlackNotification is working correctly
  throw new Error('Invalid notification parameters');
}

/**
 * Send a message to Slack using the Web API
 */
async function sendSlackMessage(
  accessToken: string,
  channelId: string,
  message: SlackMessage
): Promise<{ success: boolean; messageTs?: string; error?: string }> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        blocks: message.blocks,
        text: message.text || ' ', // Fallback text required by Slack
      }),
    });

    const data = (await response.json()) as { ok: boolean; ts?: string; error?: string };

    if (data.ok) {
      return {
        success: true,
        ...(data.ts && { messageTs: data.ts }),
      };
    }

    return {
      success: false,
      error: data.error || 'Failed to send message',
    };
  } catch (error) {
    logger.error('Failed to send Slack message', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}
