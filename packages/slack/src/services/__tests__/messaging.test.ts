import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SlackMessagingService } from '../messaging';

describe('SlackMessagingService', () => {
  let messagingService: SlackMessagingService;
  let mockSlackClient: any;

  beforeEach(() => {
    messagingService = new SlackMessagingService();

    // Mock the slack client
    mockSlackClient = {
      chat: {
        postMessage: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      conversations: {
        replies: vi.fn(),
      },
      auth: {
        test: vi.fn(),
      },
    };

    (messagingService as any).slackClient = mockSlackClient;
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', {
        text: 'Hello, Slack!',
      });

      expect(result).toEqual({
        success: true,
        messageTs: '1234567890.123456',
        channelId: 'C123',
      });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        token: 'xoxb-test-token',
        channel: 'C123',
        text: 'Hello, Slack!',
      });
    });

    it('should handle message with blocks', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const message = {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Bold text*',
            },
          },
        ],
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          blocks: message.blocks,
        })
      );
    });

    it('should return error for missing token', async () => {
      const result = await messagingService.sendMessage('', 'C123', { text: 'Hello' });

      expect(result).toEqual({
        success: false,
        error: 'Access token is required',
      });
    });

    it('should return error for missing channel', async () => {
      const result = await messagingService.sendMessage('xoxb-test-token', '', { text: 'Hello' });

      expect(result).toEqual({
        success: false,
        error: 'Channel ID is required',
      });
    });
  });

  describe('replyToMessage', () => {
    it('should send threaded reply successfully', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.654321',
        channel: 'C123',
      });

      const result = await messagingService.replyToMessage(
        'xoxb-test-token',
        'C123',
        '1234567890.123456',
        { text: 'This is a reply' }
      );

      expect(result).toEqual({
        success: true,
        messageTs: '1234567890.654321',
        channelId: 'C123',
      });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        token: 'xoxb-test-token',
        channel: 'C123',
        thread_ts: '1234567890.123456',
        text: 'This is a reply',
      });
    });

    it('should return error for missing thread timestamp', async () => {
      const result = await messagingService.replyToMessage('xoxb-test-token', 'C123', '', {
        text: 'Reply',
      });

      expect(result).toEqual({
        success: false,
        error: 'Channel ID and thread timestamp are required for replies',
      });
    });
  });

  describe('sendMessageWithRetry', () => {
    it('should retry on rate limit error', async () => {
      // First attempt fails with rate limit
      mockSlackClient.chat.postMessage.mockResolvedValueOnce({
        ok: false,
        error: 'rate_limited',
      });

      // Second attempt succeeds
      mockSlackClient.chat.postMessage.mockResolvedValueOnce({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const result = await messagingService.sendMessageWithRetry(
        'xoxb-test-token',
        'C123',
        { text: 'Hello' },
        2
      );

      expect(result).toEqual({
        success: true,
        messageTs: '1234567890.123456',
        channelId: 'C123',
        retryCount: 1,
      });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: false,
        error: 'channel_not_found',
      });

      const result = await messagingService.sendMessageWithRetry(
        'xoxb-test-token',
        'C123',
        { text: 'Hello' },
        3
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error: channel_not_found');
      expect(result.retryCount).toBe(0);
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateMessagingCapability', () => {
    it('should return canSend true for valid token', async () => {
      mockSlackClient.auth.test.mockResolvedValue({
        ok: true,
        bot_id: 'B123',
        team_id: 'T123',
      });

      const result = await messagingService.validateMessagingCapability('xoxb-test-token');

      expect(result).toEqual({
        canSend: true,
        botId: 'B123',
        teamId: 'T123',
      });
    });

    it('should return canSend false for invalid token', async () => {
      mockSlackClient.auth.test.mockResolvedValue({
        ok: false,
      });

      const result = await messagingService.validateMessagingCapability('xoxb-test-token');

      expect(result).toEqual({
        canSend: false,
        error: 'Invalid access token',
      });
    });
  });
});
