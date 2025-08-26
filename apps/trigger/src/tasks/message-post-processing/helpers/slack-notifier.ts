import {
  and,
  db,
  eq,
  getSecretByName,
  isNull,
  messages,
  messagesToSlackMessages,
  slackIntegrations,
  slackMessageTracking,
} from '@buster/database';
import { SERVER_KEYS, SLACK_KEYS, getSecret } from '@buster/secrets';
import { SlackMessageSource, convertMarkdownToSlack } from '@buster/slack';
import { logger } from '@trigger.dev/sdk/v3';

export interface SlackNotificationParams {
  organizationId: string;
  userName: string | null;
  chatId: string;
  summaryTitle?: string | undefined;
  summaryMessage?: string | undefined;
  formattedMessage?: string | null | undefined;
  toolCalled: string;
  message?: string | undefined;
}

export interface SlackReplyNotificationParams extends SlackNotificationParams {
  threadTs: string;
  channelId: string;
  integrationId: string;
  tokenVaultKey: string;
}

export interface SlackNotificationResult {
  sent: boolean;
  error?: string;
  messageTs?: string;
  threadTs?: string;
  integrationId?: string;
  channelId?: string;
  slackBlocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    verbatim?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
    action_id?: string;
  }>;
}

interface SlackMessage {
  blocks?: SlackBlock[];
  text?: string;
}

/**
 * Check if any messages from the same chat have been sent to Slack
 * Returns the most recent Slack message if found
 */
export async function getExistingSlackMessageForChat(chatId: string): Promise<{
  exists: boolean;
  slackMessageTs?: string;
  slackThreadTs?: string;
  channelId?: string;
  integrationId?: string;
} | null> {
  try {
    // Find messages from the same chat that have been sent to Slack
    const existingSlackMessages = await db
      .select({
        slackMessageId: messagesToSlackMessages.slackMessageId,
        messageId: messagesToSlackMessages.messageId,
        chatId: messages.chatId,
        createdAt: messages.createdAt,
      })
      .from(messagesToSlackMessages)
      .innerJoin(messages, eq(messages.id, messagesToSlackMessages.messageId))
      .innerJoin(
        slackMessageTracking,
        eq(slackMessageTracking.id, messagesToSlackMessages.slackMessageId)
      )
      .where(
        and(
          eq(messages.chatId, chatId),
          eq(slackMessageTracking.messageType, SlackMessageSource.ANALYST_MESSAGE_POST_PROCESSING)
        )
      )
      .orderBy(messages.createdAt)
      .limit(1);

    if (existingSlackMessages.length === 0) {
      return null;
    }

    const firstSlackMessage = existingSlackMessages[0];
    if (!firstSlackMessage) {
      return null;
    }

    // Get the Slack message details
    const [slackMessageDetails] = await db
      .select({
        slackMessageTs: slackMessageTracking.slackMessageTs,
        slackThreadTs: slackMessageTracking.slackThreadTs,
        slackChannelId: slackMessageTracking.slackChannelId,
        integrationId: slackMessageTracking.integrationId,
      })
      .from(slackMessageTracking)
      .where(eq(slackMessageTracking.id, firstSlackMessage.slackMessageId))
      .limit(1);

    if (!slackMessageDetails) {
      return null;
    }

    return {
      exists: true,
      slackMessageTs: slackMessageDetails.slackMessageTs,
      slackThreadTs: slackMessageDetails.slackThreadTs || slackMessageDetails.slackMessageTs,
      channelId: slackMessageDetails.slackChannelId,
      integrationId: slackMessageDetails.integrationId,
    };
  } catch (error) {
    logger.error('Failed to check for existing Slack messages', {
      chatId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Send a Slack notification based on post-processing results
 */
export async function sendSlackNotification(
  params: SlackNotificationParams
): Promise<SlackNotificationResult> {
  try {
    // Step 1: Check if organization has active Slack integration
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

    if (!integration.defaultChannel) {
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
    const slackMessage = await formatSlackMessage(params);

    // Step 5: Send the message via Slack API
    const result = await sendSlackMessage(
      tokenSecret.secret,
      integration.defaultChannel.id,
      slackMessage
    );

    const busterChannelToken = await getSecret(SLACK_KEYS.BUSTER_ALERT_CHANNEL_TOKEN);
    const busterChannelId = await getSecret(SLACK_KEYS.BUSTER_ALERT_CHANNEL_ID);

    //Step 6: Send Alert To Buster Channel
    if (busterChannelToken && busterChannelId) {
      const busterResult = await sendSlackMessage(
        busterChannelToken,
        busterChannelId,
        slackMessage
      );
      if (!busterResult.success) {
        logger.warn('Failed to send alert to Buster channel', {
          error: busterResult.error,
          channelId: busterChannelId,
        });
      }
    }

    if (result.success) {
      logger.log('Successfully sent Slack notification', {
        organizationId: params.organizationId,
        channelId: integration.defaultChannel.id,
        messageTs: result.messageTs,
      });
      return {
        sent: true,
        ...(result.messageTs && { messageTs: result.messageTs }),
        integrationId: integration.id,
        channelId: integration.defaultChannel.id,
        ...(slackMessage.blocks && { slackBlocks: slackMessage.blocks }),
      };
    }

    logger.error('Failed to send Slack notification', {
      organizationId: params.organizationId,
      channelId: integration.defaultChannel.id,
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
 * Send a Slack reply notification to an existing thread
 */
export async function sendSlackReplyNotification(
  params: SlackReplyNotificationParams
): Promise<SlackNotificationResult> {
  try {
    // Step 1: Check if we should send a notification
    const shouldSendNotification = shouldSendSlackNotification(params);
    if (!shouldSendNotification) {
      logger.log('Reply notification conditions not met', { params });
      return { sent: false, error: 'Notification conditions not met' };
    }

    // Step 2: Retrieve access token from vault
    const tokenSecret = await getSecretByName(params.tokenVaultKey);
    if (!tokenSecret) {
      logger.error('Failed to retrieve token from vault for reply', {
        tokenVaultKey: params.tokenVaultKey,
        organizationId: params.organizationId,
      });
      return { sent: false, error: 'Failed to retrieve access token' };
    }

    // Step 3: Format the Slack message for reply
    const slackMessage = formatSlackReplyMessage(params);

    // Step 4: Send the reply message via Slack API
    const result = await sendSlackMessage(
      tokenSecret.secret,
      params.channelId,
      slackMessage,
      params.threadTs
    );

    if (result.success) {
      logger.log('Successfully sent Slack reply notification', {
        organizationId: params.organizationId,
        channelId: params.channelId,
        threadTs: params.threadTs,
        messageTs: result.messageTs,
      });
      return {
        sent: true,
        ...(result.messageTs && { messageTs: result.messageTs }),
        threadTs: params.threadTs,
        integrationId: params.integrationId,
        channelId: params.channelId,
        ...(slackMessage.blocks && { slackBlocks: slackMessage.blocks }),
      };
    }

    logger.error('Failed to send Slack reply notification', {
      organizationId: params.organizationId,
      channelId: params.channelId,
      threadTs: params.threadTs,
      error: result.error,
    });
    return { sent: false, error: result.error || 'Failed to send reply' };
  } catch (error) {
    logger.error('Error in sendSlackReplyNotification', {
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
 * Format the Slack message for a reply in an existing thread
 */
function formatSlackReplyMessage(params: SlackReplyNotificationParams): SlackMessage {
  // Format reply messages differently - more concise since context is in the thread
  if (params.formattedMessage) {
    const converted = convertMarkdownToSlack(params.formattedMessage);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.formattedMessage,
            verbatim: false,
          },
        },
      ],
    };
  }

  // For summary notifications, just show the message
  if (params.summaryTitle && params.summaryMessage) {
    const converted = convertMarkdownToSlack(params.summaryMessage);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.summaryMessage,
            verbatim: false,
          },
        },
      ],
    };
  }

  // For flagged chat notifications, just show the message
  if (params.toolCalled === 'flagChat' && params.message) {
    const converted = convertMarkdownToSlack(params.message);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.message,
            verbatim: false,
          },
        },
      ],
    };
  }

  throw new Error(
    'Invalid reply notification parameters: Missing required fields. ' +
      'Requires either formattedMessage, summaryTitle with summaryMessage, or toolCalled="flagChat" with message'
  );
}

/**
 * Format the Slack message based on the notification type
 */
async function formatSlackMessage(params: SlackNotificationParams): Promise<SlackMessage> {
  const userName = params.userName || 'Unknown User';
  const busterUrl = await getSecret(SERVER_KEYS.BUSTER_URL);
  const chatUrl = `${busterUrl}/app/chats/${params.chatId}`;

  // Case 1: Formatted message from workflow (highest priority)
  if (params.formattedMessage) {
    const converted = convertMarkdownToSlack(params.formattedMessage);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Flagged a chat for review:\n*<${chatUrl}|${userName}>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.formattedMessage,
            verbatim: false,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Open in Buster',
                emoji: false,
              },
              url: chatUrl,
            },
          ],
        },
      ],
    };
  }

  // Case 2: Summary notification (summaryTitle and summaryMessage present)
  if (params.summaryTitle && params.summaryMessage) {
    const converted = convertMarkdownToSlack(params.summaryMessage);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Flagged a chat for review:\n*<${chatUrl}|${userName} - ${params.summaryTitle}>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.summaryMessage,
            verbatim: false,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Open in Buster',
                emoji: false,
              },
              url: chatUrl,
            },
          ],
        },
      ],
    };
  }

  // Case 3: Flagged chat notification (toolCalled is 'flagChat' and message present)
  if (params.toolCalled === 'flagChat' && params.message) {
    const converted = convertMarkdownToSlack(params.message);
    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Flagged a chat for review:\n*<${chatUrl}|${userName} - Flagged Chat>*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: converted.text || params.message,
            verbatim: false,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Open in Buster',
                emoji: false,
              },
              url: chatUrl,
            },
          ],
        },
      ],
    };
  }

  // This shouldn't happen if shouldSendSlackNotification is working correctly
  throw new Error(
    `Invalid notification parameters: Missing required fields. Requires either formattedMessage, summaryTitle with summaryMessage, or toolCalled="flagChat" with message. Received: formattedMessage=${!!params.formattedMessage}, summaryTitle=${!!params.summaryTitle}, summaryMessage=${!!params.summaryMessage}, toolCalled="${
      params.toolCalled
    }", message=${!!params.message}`
  );
}

/**
 * Send a message to Slack using the Web API
 */
async function sendSlackMessage(
  accessToken: string,
  channelId: string,
  message: SlackMessage,
  threadTs?: string
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
        ...(threadTs && { thread_ts: threadTs }),
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

/**
 * Track a sent Slack notification in the database
 */
export async function trackSlackNotification(params: {
  messageId: string;
  integrationId: string;
  channelId: string;
  messageTs: string;
  threadTs?: string;
  userName: string | null;
  chatId: string;
  summaryTitle?: string;
  summaryMessage?: string;
  slackBlocks?: SlackBlock[];
}): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Insert into slack_message_tracking
      const [slackMessage] = await tx
        .insert(slackMessageTracking)
        .values({
          integrationId: params.integrationId,
          internalMessageId: params.messageId,
          slackChannelId: params.channelId,
          slackMessageTs: params.messageTs,
          slackThreadTs: params.threadTs || null,
          messageType: SlackMessageSource.ANALYST_MESSAGE_POST_PROCESSING,
          content: params.slackBlocks
            ? JSON.stringify({ blocks: params.slackBlocks })
            : params.summaryTitle && params.summaryMessage
              ? `${params.summaryTitle}\n\n${params.summaryMessage}`
              : 'Notification sent',
          senderInfo: {
            sentBy: 'buster-post-processing',
            userName: params.userName,
            chatId: params.chatId,
          },
          sentAt: new Date().toISOString(),
        })
        .returning();

      // Create association in messages_to_slack_messages
      if (slackMessage) {
        await tx.insert(messagesToSlackMessages).values({
          messageId: params.messageId,
          slackMessageId: slackMessage.id,
        });
      }
    });

    logger.log('Successfully tracked Slack notification', {
      messageId: params.messageId,
      integrationId: params.integrationId,
    });
  } catch (error) {
    // Log but don't throw - tracking failure shouldn't break the flow
    logger.error('Failed to track Slack notification', {
      messageId: params.messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
