import type { WebClient } from '@slack/web-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWebClient, type MockWebClient } from '../mocks';
import { SlackChannelService } from './channels';

describe('SlackChannelService', () => {
  let channelService: SlackChannelService;
  let mockSlackClient: MockWebClient;

  beforeEach(() => {
    mockSlackClient = createMockWebClient();
    channelService = new SlackChannelService(mockSlackClient as unknown as WebClient);
  });

  describe('getAvailableChannels', () => {
    it('should return list of public channels', async () => {
      mockSlackClient.conversations.list.mockResolvedValue({
        ok: true,
        channels: [
          { id: 'C1', name: 'general', is_private: false, is_archived: false, is_member: true },
          { id: 'C2', name: 'random', is_private: false, is_archived: false, is_member: false },
        ],
      });

      const channels = await channelService.getAvailableChannels('xoxb-test-token');

      expect(channels).toHaveLength(2);
      expect(channels[0]).toMatchObject({
        id: 'C1',
        name: 'general',
        is_private: false,
        is_archived: false,
        is_member: true,
      });

      expect(mockSlackClient.conversations.list).toHaveBeenCalledWith({
        token: 'xoxb-test-token',
        types: 'public_channel',
        exclude_archived: true,
        limit: 200,
      });
    });

    it('should handle pagination', async () => {
      // First page
      mockSlackClient.conversations.list.mockResolvedValueOnce({
        ok: true,
        channels: [{ id: 'C1', name: 'general', is_private: false, is_archived: false }],
        response_metadata: { next_cursor: 'cursor123' },
      });

      // Second page
      mockSlackClient.conversations.list.mockResolvedValueOnce({
        ok: true,
        channels: [{ id: 'C2', name: 'random', is_private: false, is_archived: false }],
      });

      const channels = await channelService.getAvailableChannels('xoxb-test-token');

      expect(channels).toHaveLength(2);
      expect(mockSlackClient.conversations.list).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid token', async () => {
      await expect(channelService.getAvailableChannels('')).rejects.toThrow(
        'Access token is required'
      );
    });
  });

  describe('validateChannelAccess', () => {
    it('should validate accessible channel', async () => {
      mockSlackClient.conversations.info.mockResolvedValue({
        ok: true,
        channel: {
          id: 'C123',
          name: 'general',
          is_private: false,
          is_archived: false,
          is_member: true,
        },
      });

      const channel = await channelService.validateChannelAccess('xoxb-test-token', 'C123');

      expect(channel).toMatchObject({
        id: 'C123',
        name: 'general',
        is_private: false,
      });
    });

    it('should throw error for archived channel', async () => {
      mockSlackClient.conversations.info.mockResolvedValue({
        ok: true,
        channel: {
          id: 'C123',
          name: 'old-channel',
          is_archived: true,
        },
      });

      await expect(channelService.validateChannelAccess('xoxb-test-token', 'C123')).rejects.toThrow(
        'Cannot use archived channel'
      );
    });

    it('should throw error for private channel without membership', async () => {
      mockSlackClient.conversations.info.mockResolvedValue({
        ok: true,
        channel: {
          id: 'C123',
          name: 'private-channel',
          is_private: true,
          is_member: false,
        },
      });

      await expect(channelService.validateChannelAccess('xoxb-test-token', 'C123')).rejects.toThrow(
        'Bot is not a member of this private channel'
      );
    });
  });
});
