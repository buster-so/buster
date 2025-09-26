import { db } from '@buster/database/connection';
import { getSecretByName } from '@buster/database/queries';
import { chats, slackIntegrations } from '@buster/database/schema';
import type { SlackEventsResponse } from '@buster/server-shared/slack';
import {
  SlackMessagingService,
  type SlackWebhookPayload,
  addReaction,
  isAppMentionEvent,
  isEventCallback,
  isMessageImEvent,
} from '@buster/slack';
import { tasks } from '@trigger.dev/sdk';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import {
  type SlackAuthenticationResult,
  authenticateSlackUser,
  getUserIdFromAuthResult,
} from './services/slack-authentication';

/**
 * Helper function to get Slack access token from vault
 */
async function getSlackAccessToken(
  teamId: string,
  organizationId?: string
): Promise<string | null> {
  const filters = [eq(slackIntegrations.teamId, teamId), eq(slackIntegrations.status, 'active')];
  if (organizationId) {
    filters.push(eq(slackIntegrations.organizationId, organizationId));
  }

  try {
    // Fetch Slack integration to get token vault key
    const slackIntegration = await db
      .select({
        tokenVaultKey: slackIntegrations.tokenVaultKey,
      })
      .from(slackIntegrations)
      .where(and(...filters))
      .limit(1);

    if (slackIntegration.length > 0 && slackIntegration[0]?.tokenVaultKey) {
      // Get the access token from vault
      const vaultSecret = await getSecretByName(slackIntegration[0].tokenVaultKey);
      return vaultSecret?.secret || null;
    }

    return null;
  } catch (error) {
    console.error('Failed to get Slack access token from vault:', error);
    return null;
  }
}

/**
 * Map authentication result type to database enum value
 */
function mapAuthResultToDbEnum(
  authType: SlackAuthenticationResult['type']
): 'unauthorized' | 'authorized' | 'auto_added' {
  switch (authType) {
    case 'unauthorized':
      return 'unauthorized';
    case 'authorized':
      return 'authorized';
    case 'auto_added':
      return 'auto_added';
    default:
      return 'unauthorized';
  }
}

/**
 * Find or create a chat for a Slack thread
 */
export async function findOrCreateSlackChat({
  threadTs,
  channelId,
  organizationId,
  userId,
  slackChatAuthorization,
  teamId,
  isDM = false,
}: {
  threadTs: string;
  channelId: string;
  organizationId: string;
  userId: string;
  slackChatAuthorization: 'unauthorized' | 'authorized' | 'auto_added';
  teamId: string;
  isDM?: boolean;
}): Promise<string> {
  // Run both queries concurrently for better performance
  const [existingChat, slackIntegration] = await Promise.all([
    // Find existing chat
    db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.slackThreadTs, threadTs),
          eq(chats.slackChannelId, channelId),
          eq(chats.organizationId, organizationId)
        )
      )
      .limit(1),
    // Fetch Slack integration settings if we have an organization
    organizationId
      ? db
          .select({ defaultSharingPermissions: slackIntegrations.defaultSharingPermissions })
          .from(slackIntegrations)
          .where(
            and(
              eq(slackIntegrations.organizationId, organizationId),
              eq(slackIntegrations.teamId, teamId),
              eq(slackIntegrations.status, 'active')
            )
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  if (existingChat.length > 0) {
    const chat = existingChat[0];
    if (!chat) {
      throw new Error('Chat data is missing');
    }
    return chat.id;
  }

  // Extract default sharing permissions
  const defaultSharingPermissions =
    slackIntegration.length > 0 && slackIntegration[0]
      ? slackIntegration[0].defaultSharingPermissions
      : undefined;

  // Create new chat
  const newChat = await db
    .insert(chats)
    .values({
      title: '',
      organizationId,
      createdBy: userId,
      updatedBy: userId,
      slackChatAuthorization,
      slackThreadTs: threadTs,
      slackChannelId: channelId,
      // DM chats are NEVER shared with workspace, regardless of settings
      workspaceSharing: isDM
        ? 'none'
        : defaultSharingPermissions === 'shareWithWorkspace'
          ? 'can_view'
          : 'none',
      workspaceSharingEnabledBy: isDM
        ? null
        : defaultSharingPermissions === 'shareWithWorkspace'
          ? userId
          : null,
      workspaceSharingEnabledAt: isDM
        ? null
        : defaultSharingPermissions === 'shareWithWorkspace'
          ? new Date().toISOString()
          : null,
    })
    .returning();

  const chat = newChat[0];
  if (!chat) {
    throw new Error('Failed to create chat');
  }
  return chat.id;
}

/**
 * Queue slack agent task for processing
 */
export async function queueSlackAgentTask(chatId: string, userId: string): Promise<void> {
  await tasks.trigger('slack-agent-task', {
    chatId,
    userId,
  });
}

/**
 * Handles the /events endpoint for Slack Events API
 * Includes URL verification and event processing
 */
export async function handleSlackEventsEndpoint(c: Context) {
  // Check if this is a URL verification challenge
  const challenge = c.get('slackChallenge');
  if (challenge) {
    return c.text(challenge);
  }

  // Get the validated payload
  const payload = c.get('slackPayload');
  if (!payload) {
    // This shouldn't happen if middleware works correctly
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Process the event
    const response = await eventsHandler(payload);

    // Ensure we never return success: false without throwing
    if (!response.success) {
      throw new Error('Event processing failed');
    }

    return c.json(response);
  } catch (error) {
    // Handle authentication errors with 200 status code to prevent Slack from retrying the webhook
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return c.json({ error: 'Unauthorized' }, 200);
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Handles Slack Events API webhook requests
 * Processes validated webhook payloads
 */
export async function eventsHandler(payload: SlackWebhookPayload): Promise<SlackEventsResponse> {
  try {
    // Handle the event based on type
    if (isEventCallback(payload)) {
      const event = payload.event;

      // Check if this is an app_mention or DM event
      const isAppMention = isAppMentionEvent(event);
      const isDM = isMessageImEvent(event);

      if (isAppMention || isDM) {
        console.info(isDM ? 'DM received:' : 'App mentioned:', {
          team_id: payload.team_id,
          channel: event.channel,
          user: event.user,
          text: event.text,
          event_id: payload.event_id,
          is_dm: isDM,
        });

        // Authenticate the Slack user
        const authResult = await authenticateSlackUser(event.user, payload.team_id);

        if (authResult.type === 'unauthorized') {
          if (authResult.reason.toLowerCase().includes('bot')) {
            return { success: true };
          }

          try {
            const accessToken = await getSlackAccessToken(payload.team_id);
            if (accessToken) {
              const messagingService = new SlackMessagingService();
              const threadTs = event.thread_ts || event.ts;

              await messagingService.sendMessage(accessToken, event.channel, {
                text: 'Sorry, you are unauthorized to chat with Buster. Please contact your Workspace Administrator for access.',
                thread_ts: threadTs,
              });

              console.info('Sent unauthorized message to Slack user', {
                channel: event.channel,
                user: event.user,
                threadTs,
              });
            }
          } catch (error) {
            console.warn('Failed to send unauthorized message to Slack user', {
              error: error instanceof Error ? error.message : 'Unknown error',
              channel: event.channel,
              user: event.user,
              threadTs: event.thread_ts || event.ts,
            });
          }
          throw new Error('Unauthorized: Slack user authentication failed');
        }

        const userId = authResult.user.id;
        const organizationId = authResult.organization.id;

        // Extract thread timestamp - if no thread_ts, this is a new thread so use ts
        const threadTs = event.thread_ts || event.ts;

        // Add hourglass reaction immediately after authentication
        if (organizationId) {
          try {
            const accessToken = await getSlackAccessToken(payload.team_id, organizationId);

            if (accessToken) {
              // Add the hourglass reaction
              await addReaction({
                accessToken,
                channelId: event.channel,
                messageTs: event.ts,
                emoji: 'hourglass_flowing_sand',
              });

              console.info('Added hourglass reaction to app mention', {
                channel: event.channel,
                messageTs: event.ts,
              });
            }
          } catch (error) {
            // Log but don't fail the entire process if reaction fails
            console.warn('Failed to add hourglass reaction', {
              error: error instanceof Error ? error.message : 'Unknown error',
              channel: event.channel,
              messageTs: event.ts,
            });
          }
        }

        // Find or create chat
        const chatId = await findOrCreateSlackChat({
          threadTs,
          channelId: event.channel,
          organizationId,
          userId,
          slackChatAuthorization: mapAuthResultToDbEnum(authResult.type),
          teamId: payload.team_id,
          isDM,
        });

        // Queue the task
        await queueSlackAgentTask(chatId, userId);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to process Slack event:', error);
    throw error;
  }
}
