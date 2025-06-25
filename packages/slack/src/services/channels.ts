import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { type SlackChannel, SlackChannelSchema } from '../types';
import { SlackIntegrationError } from '../types/errors';
import { validateWithSchema } from '../utils/validation-helpers';

export class SlackChannelService {
  private slackClient: WebClient;

  constructor() {
    this.slackClient = new WebClient();
  }

  /**
   * Fetch available public channels for a given access token
   * @param accessToken The Slack access token
   * @param includeArchived Whether to include archived channels (default: false)
   * @returns List of public channels the bot can access
   */
  async getAvailableChannels(
    accessToken: string,
    includeArchived = false
  ): Promise<SlackChannel[]> {
    if (!accessToken) {
      throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
    }

    const channels: SlackChannel[] = [];
    let cursor: string | undefined;

    try {
      do {
        const params: any = {
          token: accessToken,
          types: 'public_channel', // Only public channels
          exclude_archived: !includeArchived,
          limit: 200,
        };

        if (cursor) {
          params.cursor = cursor;
        }

        const response = await this.slackClient.conversations.list(params);

        if (response.ok && response.channels) {
          // Filter and transform channels
          const validChannels = response.channels
            .filter((channel) => !channel.is_archived || includeArchived)
            .map((channel) => ({
              id: channel.id!,
              name: channel.name!,
              is_private: channel.is_private || false,
              is_archived: channel.is_archived || false,
              is_member: channel.is_member || false,
            }));

          // Validate each channel
          const parsedChannels = validChannels.map((ch) =>
            validateWithSchema(SlackChannelSchema, ch, 'Invalid channel data')
          );

          channels.push(...parsedChannels);
          cursor = response.response_metadata?.next_cursor;
        } else {
          throw new SlackIntegrationError(
            'UNKNOWN_ERROR',
            `Failed to fetch channels: ${response.error || 'Unknown error'}`
          );
        }
      } while (cursor);

      // Sort channels alphabetically
      return channels.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const slackError = (error as any).data;
        if (slackError?.error === 'invalid_auth') {
          throw new SlackIntegrationError('INVALID_TOKEN', 'Invalid or expired access token');
        } else if (slackError?.error === 'rate_limited') {
          throw new SlackIntegrationError(
            'RATE_LIMITED',
            'Rate limit exceeded. Please try again later.',
            true
          );
        }
      }

      throw new SlackIntegrationError(
        'NETWORK_ERROR',
        `Error fetching channels: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Validate that a channel exists and the bot has access
   * @param accessToken The Slack access token
   * @param channelId The channel ID to validate
   * @returns Channel info if valid
   * @throws SlackIntegrationError if channel is invalid or inaccessible
   */
  async validateChannelAccess(accessToken: string, channelId: string): Promise<SlackChannel> {
    if (!accessToken) {
      throw new SlackIntegrationError('INVALID_TOKEN', 'Access token is required');
    }

    if (!channelId) {
      throw new SlackIntegrationError('CHANNEL_NOT_FOUND', 'Channel ID is required');
    }

    try {
      // Try to get channel info to validate access
      const response = await this.slackClient.conversations.info({
        token: accessToken,
        channel: channelId,
      });

      if (!response.ok || !response.channel) {
        throw new SlackIntegrationError(
          'CHANNEL_NOT_FOUND',
          `Channel validation failed: ${response.error || 'Channel not found'}`
        );
      }

      const channel = response.channel;

      if (channel.is_archived) {
        throw new SlackIntegrationError('CHANNEL_NOT_FOUND', 'Cannot use archived channel');
      }

      if (channel.is_private && !channel.is_member) {
        throw new SlackIntegrationError(
          'NOT_IN_CHANNEL',
          'Bot is not a member of this private channel'
        );
      }

      // Transform to our channel type
      const validatedChannel: SlackChannel = {
        id: channel.id!,
        name: channel.name!,
        is_private: channel.is_private || false,
        is_archived: channel.is_archived || false,
        is_member: channel.is_member || false,
      };

      return validateWithSchema(SlackChannelSchema, validatedChannel, 'Invalid channel data');
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      // Handle specific Slack API errors
      if (error instanceof Error && 'data' in error) {
        const slackError = (error as any).data;
        if (slackError?.error === 'channel_not_found') {
          throw new SlackIntegrationError(
            'CHANNEL_NOT_FOUND',
            'Channel does not exist or bot cannot access it'
          );
        } else if (slackError?.error === 'invalid_auth') {
          throw new SlackIntegrationError('INVALID_TOKEN', 'Invalid or expired access token');
        }
      }

      throw new SlackIntegrationError(
        'UNKNOWN_ERROR',
        `Channel access validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Join a public channel
   * @param accessToken The Slack access token
   * @param channelId The channel ID to join
   * @returns Success status
   */
  async joinChannel(
    accessToken: string,
    channelId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!accessToken || !channelId) {
      return {
        success: false,
        error: 'Access token and channel ID are required',
      };
    }

    try {
      const response = await this.slackClient.conversations.join({
        token: accessToken,
        channel: channelId,
      });

      if (!response.ok) {
        return {
          success: false,
          error: response.error || 'Failed to join channel',
        };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && 'data' in error) {
        const slackError = (error as any).data;
        return {
          success: false,
          error: slackError?.error || error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Leave a channel
   * @param accessToken The Slack access token
   * @param channelId The channel ID to leave
   * @returns Success status
   */
  async leaveChannel(
    accessToken: string,
    channelId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!accessToken || !channelId) {
      return {
        success: false,
        error: 'Access token and channel ID are required',
      };
    }

    try {
      const response = await this.slackClient.conversations.leave({
        token: accessToken,
        channel: channelId,
      });

      if (!response.ok) {
        return {
          success: false,
          error: response.error || 'Failed to leave channel',
        };
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && 'data' in error) {
        const slackError = (error as any).data;
        return {
          success: false,
          error: slackError?.error || error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
