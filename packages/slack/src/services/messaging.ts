import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { type SendMessageResult, type SlackMessage, SlackMessageSchema } from '../types';
import { SlackIntegrationError } from '../types/errors';
import { validateWithSchema } from '../utils/validation-helpers';

export class SlackMessagingService {
  private slackClient: WebClient;

  constructor(client?: WebClient) {
    this.slackClient = client || new WebClient();
  }

  /**
   * Send a message to a Slack channel
   * @param accessToken The Slack access token
   * @param channelId The channel ID to send to
   * @param message The message to send
   * @returns Result with success status and message timestamp
   */
  async sendMessage(
    accessToken: string,
    channelId: string,
    message: SlackMessage
  ): Promise<SendMessageResult> {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
      }

      if (!channelId) {
        throw new SlackIntegrationError('CHANNEL_NOT_FOUND', 'Channel ID is required');
      }

      // Validate message
      const validatedMessage = validateWithSchema(
        SlackMessageSchema,
        message,
        'Invalid message format'
      );

      // Send message to Slack
      const baseParams = {
        token: accessToken,
        channel: channelId,
        text: validatedMessage.text || (validatedMessage.blocks ? ' ' : ' '),
      };

      const messageParams = validatedMessage.blocks
        ? {
            ...baseParams,
            blocks: validatedMessage.blocks,
            ...(validatedMessage.attachments && { attachments: validatedMessage.attachments }),
            ...(validatedMessage.thread_ts && { thread_ts: validatedMessage.thread_ts }),
            ...(validatedMessage.unfurl_links !== undefined && {
              unfurl_links: validatedMessage.unfurl_links,
            }),
            ...(validatedMessage.unfurl_media !== undefined && {
              unfurl_media: validatedMessage.unfurl_media,
            }),
          }
        : validatedMessage.attachments
          ? {
              ...baseParams,
              attachments: validatedMessage.attachments,
              ...(validatedMessage.thread_ts && { thread_ts: validatedMessage.thread_ts }),
              ...(validatedMessage.unfurl_links !== undefined && {
                unfurl_links: validatedMessage.unfurl_links,
              }),
              ...(validatedMessage.unfurl_media !== undefined && {
                unfurl_media: validatedMessage.unfurl_media,
              }),
            }
          : {
              ...baseParams,
              ...(validatedMessage.thread_ts && { thread_ts: validatedMessage.thread_ts }),
              ...(validatedMessage.unfurl_links !== undefined && {
                unfurl_links: validatedMessage.unfurl_links,
              }),
              ...(validatedMessage.unfurl_media !== undefined && {
                unfurl_media: validatedMessage.unfurl_media,
              }),
            };

      const response = await this.slackClient.chat.postMessage(
        messageParams as Parameters<typeof this.slackClient.chat.postMessage>[0]
      );

      if (!response.ok) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          `Slack API error: ${response.error || 'Unknown error'}`
        );
      }

      return {
        success: true,
        messageTs: response.ts,
        channelId: response.channel,
      };
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        const errorMessage = this.mapSlackError(errorWithData.data?.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Reply to a message in a thread
   * @param accessToken The Slack access token
   * @param channelId The channel ID
   * @param threadTs The timestamp of the parent message
   * @param replyMessage The reply message
   * @returns Result with success status and message timestamp
   */
  async replyToMessage(
    accessToken: string,
    channelId: string,
    threadTs: string,
    replyMessage: SlackMessage
  ): Promise<SendMessageResult> {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
      }

      if (!channelId || !threadTs) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          'Channel ID and thread timestamp are required for replies'
        );
      }

      // Validate message
      const validatedMessage = validateWithSchema(
        SlackMessageSchema,
        replyMessage,
        'Invalid reply message format'
      );

      // Send threaded reply
      const baseReplyParams = {
        token: accessToken,
        channel: channelId,
        thread_ts: threadTs,
        text: validatedMessage.text || (validatedMessage.blocks ? ' ' : ' '),
      };

      const replyParams = validatedMessage.blocks
        ? {
            ...baseReplyParams,
            blocks: validatedMessage.blocks,
            ...(validatedMessage.attachments && { attachments: validatedMessage.attachments }),
            ...(validatedMessage.unfurl_links !== undefined && {
              unfurl_links: validatedMessage.unfurl_links,
            }),
            ...(validatedMessage.unfurl_media !== undefined && {
              unfurl_media: validatedMessage.unfurl_media,
            }),
          }
        : validatedMessage.attachments
          ? {
              ...baseReplyParams,
              attachments: validatedMessage.attachments,
              ...(validatedMessage.unfurl_links !== undefined && {
                unfurl_links: validatedMessage.unfurl_links,
              }),
              ...(validatedMessage.unfurl_media !== undefined && {
                unfurl_media: validatedMessage.unfurl_media,
              }),
            }
          : {
              ...baseReplyParams,
              ...(validatedMessage.unfurl_links !== undefined && {
                unfurl_links: validatedMessage.unfurl_links,
              }),
              ...(validatedMessage.unfurl_media !== undefined && {
                unfurl_media: validatedMessage.unfurl_media,
              }),
            };

      const response = await this.slackClient.chat.postMessage(
        replyParams as Parameters<typeof this.slackClient.chat.postMessage>[0]
      );

      if (!response.ok) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          `Failed to send reply: ${response.error || 'Unknown error'}`
        );
      }

      return {
        success: true,
        messageTs: response.ts,
        channelId: response.channel,
      };
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        const errorMessage = this.mapSlackError(errorWithData.data?.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reply',
      };
    }
  }

  /**
   * Send a message with automatic retry on failure
   * @param accessToken The Slack access token
   * @param channelId The channel ID
   * @param message The message to send
   * @param maxRetries Maximum number of retry attempts (default: 3)
   * @returns Result with success status, message timestamp, and retry count
   */
  async sendMessageWithRetry(
    accessToken: string,
    channelId: string,
    message: SlackMessage,
    maxRetries = 3
  ): Promise<SendMessageResult & { retryCount?: number }> {
    let lastError = 'Unknown error';
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.sendMessage(accessToken, channelId, message);

      if (result.success) {
        return {
          ...result,
          retryCount,
        };
      }

      lastError = result.error || 'Unknown error';

      // Don't retry certain errors
      if (!this.isRetryableError(lastError)) {
        return {
          ...result,
          retryCount,
        };
      }

      retryCount++;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * 2 ** attempt, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError,
      retryCount,
    };
  }

  /**
   * Update an existing message
   * @param accessToken The Slack access token
   * @param channelId The channel ID
   * @param messageTs The timestamp of the message to update
   * @param updatedMessage The updated message content
   * @returns Result with success status
   */
  async updateMessage(
    accessToken: string,
    channelId: string,
    messageTs: string,
    updatedMessage: SlackMessage
  ): Promise<SendMessageResult> {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
      }

      if (!channelId || !messageTs) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          'Channel ID and message timestamp are required'
        );
      }

      // Validate message
      const validatedMessage = validateWithSchema(
        SlackMessageSchema,
        updatedMessage,
        'Invalid message format'
      );

      // Update message
      const baseUpdateParams = {
        token: accessToken,
        channel: channelId,
        ts: messageTs,
        text: validatedMessage.text || (validatedMessage.blocks ? ' ' : ' '),
      };

      const updateParams = validatedMessage.blocks
        ? {
            ...baseUpdateParams,
            blocks: validatedMessage.blocks,
            ...(validatedMessage.attachments && { attachments: validatedMessage.attachments }),
          }
        : validatedMessage.attachments
          ? {
              ...baseUpdateParams,
              attachments: validatedMessage.attachments,
            }
          : baseUpdateParams;

      const response = await this.slackClient.chat.update(
        updateParams as Parameters<typeof this.slackClient.chat.update>[0]
      );

      if (!response.ok) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          `Failed to update message: ${response.error || 'Unknown error'}`
        );
      }

      return {
        success: true,
        messageTs: response.ts,
        channelId: response.channel,
      };
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        const errorMessage = this.mapSlackError(errorWithData.data?.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update message',
      };
    }
  }

  /**
   * Delete a message
   * @param accessToken The Slack access token
   * @param channelId The channel ID
   * @param messageTs The timestamp of the message to delete
   * @returns Result with success status
   */
  async deleteMessage(
    accessToken: string,
    channelId: string,
    messageTs: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
      }

      if (!channelId || !messageTs) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          'Channel ID and message timestamp are required'
        );
      }

      // Delete message
      const response = await this.slackClient.chat.delete({
        token: accessToken,
        channel: channelId,
        ts: messageTs,
      });

      if (!response.ok) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          `Failed to delete message: ${response.error || 'Unknown error'}`
        );
      }

      return { success: true };
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        const errorMessage = this.mapSlackError(errorWithData.data?.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete message',
      };
    }
  }

  /**
   * Get replies to a message thread
   * @param accessToken The Slack access token
   * @param channelId The channel ID
   * @param threadTs The timestamp of the parent message
   * @returns List of messages in the thread
   */
  async getThreadReplies(
    accessToken: string,
    channelId: string,
    threadTs: string
  ): Promise<{
    success: boolean;
    messages?: Array<{
      ts: string;
      text?: string;
      user?: string;
      thread_ts?: string;
    }>;
    error?: string;
  }> {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
      }

      if (!channelId || !threadTs) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          'Channel ID and thread timestamp are required'
        );
      }

      const response = await this.slackClient.conversations.replies({
        token: accessToken,
        channel: channelId,
        ts: threadTs,
      });

      if (!response.ok) {
        throw new SlackIntegrationError(
          'UNKNOWN_ERROR',
          `Failed to get thread replies: ${response.error || 'Unknown error'}`
        );
      }

      // Transform messages to ensure required properties
      const messages = (response.messages || []).map((msg) => {
        const message: {
          ts: string;
          text?: string;
          user?: string;
          thread_ts?: string;
        } = {
          ts: msg.ts || '',
        };

        if (msg.text !== undefined) {
          message.text = msg.text;
        }
        if (msg.user !== undefined) {
          message.user = msg.user;
        }
        if (msg.thread_ts !== undefined) {
          message.thread_ts = msg.thread_ts;
        }

        return message;
      });

      return {
        success: true,
        messages,
      };
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        const errorMessage = this.mapSlackError(errorWithData.data?.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get thread replies',
      };
    }
  }

  /**
   * Test if the bot can send messages with the given token
   * @param accessToken The Slack access token
   * @returns Validation result
   */
  async validateMessagingCapability(accessToken: string): Promise<{
    canSend: boolean;
    error?: string;
    botId?: string;
    teamId?: string;
  }> {
    try {
      if (!accessToken) {
        return {
          canSend: false,
          error: 'Access token is required',
        };
      }

      // Test API connectivity and permissions
      const authTest = await this.slackClient.auth.test({
        token: accessToken,
      });

      if (!authTest.ok) {
        return {
          canSend: false,
          error: 'Invalid access token',
        };
      }

      return {
        canSend: true,
        ...(authTest.bot_id && { botId: authTest.bot_id }),
        ...(authTest.team_id && { teamId: authTest.team_id }),
      };
    } catch (error) {
      if (error instanceof Error && 'data' in error) {
        const errorWithData = error as Error & { data: { error?: string } };
        return {
          canSend: false,
          error: this.mapSlackError(errorWithData.data?.error),
        };
      }

      return {
        canSend: false,
        error: error instanceof Error ? error.message : 'Failed to validate token',
      };
    }
  }

  /**
   * Map Slack API errors to user-friendly messages
   */
  private mapSlackError(slackError?: string): string {
    if (!slackError) return 'Unknown Slack API error';

    switch (slackError) {
      case 'channel_not_found':
        return 'Channel not found or bot cannot access it';
      case 'not_in_channel':
        return 'Bot is not a member of this channel';
      case 'rate_limited':
        return 'Rate limit exceeded. Please try again later.';
      case 'invalid_auth':
      case 'token_revoked':
        return 'Invalid or expired access token';
      case 'channel_archived':
        return 'Cannot send messages to archived channels';
      case 'msg_too_long':
        return 'Message is too long';
      case 'no_text':
        return 'Message text is required';
      case 'restricted_action':
        return 'Bot does not have permission to perform this action';
      case 'message_not_found':
        return 'Message not found';
      case 'cant_update_message':
        return 'Cannot update this message';
      case 'edit_window_closed':
        return 'Message is too old to edit';
      default:
        return `Slack API error: ${slackError}`;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      'rate_limited',
      'rate limit',
      'timeout',
      'server_error',
      'service_unavailable',
      'network',
      'temporarily_unavailable',
    ];

    const lowerError = errorMessage.toLowerCase();
    return retryablePatterns.some((pattern) => lowerError.includes(pattern));
  }
}
