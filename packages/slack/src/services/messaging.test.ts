import type { WebClient } from '@slack/web-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWebClient, type MockWebClient } from '../mocks';
import { SlackMessagingService } from './messaging';

describe('SlackMessagingService', () => {
  let messagingService: SlackMessagingService;
  let mockSlackClient: MockWebClient;

  beforeEach(() => {
    mockSlackClient = createMockWebClient();
    messagingService = new SlackMessagingService(mockSlackClient as unknown as WebClient);
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
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
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

    it('should preserve blocks when both text and blocks are provided', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const message = {
        text: '## Dashboard Created\nI created a dashboard for you.',
        blocks: [
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: '*Dashboard Created*\nI created a dashboard for you.',
            },
          },
          {
            type: 'actions' as const,
            elements: [
              {
                type: 'button' as const,
                text: {
                  type: 'plain_text' as const,
                  text: 'Open in Buster',
                  emoji: false,
                },
                url: 'https://platform.buster.so/app/chats/123/dashboards/456',
              },
            ],
          },
        ],
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);

      // Verify the exact blocks were preserved
      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];
      expect(callArgs.blocks).toEqual(message.blocks);
      expect(callArgs.blocks).toHaveLength(2);
      expect(callArgs.blocks[1].type).toBe('actions');
      expect(callArgs.blocks[1].elements[0].text.text).toBe('Open in Buster');
    });

    it('should convert markdown when only text is provided', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      const message = {
        text: '## Dashboard Created\nI created a **dashboard** for you.',
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);

      // Should have converted markdown to blocks
      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];
      expect(callArgs.blocks).toBeDefined();
      expect(callArgs.blocks).toHaveLength(2);
      expect(callArgs.blocks[0].text.text).toBe('*Dashboard Created*');
      expect(callArgs.blocks[1].text.text).toContain('*dashboard*');
    });

    it('should handle dashboard response with button at the bottom', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
        channel: 'C123',
      });

      // Simulate a real dashboard response scenario
      const dashboardResponse = `I've created a comprehensive sales rep performance analysis that addresses all aspects of your request. Here's what I found and built for you:

## Key Performance Insights

### Top Performers by Revenue:
• Linda Mitchell leads with $10.37M in total sales
• Jillian Carson follows closely with $10.07M
• Michael Blythe rounds out the top 3 with $9.29M

### Volume vs Efficiency Leaders:
• Jillian Carson processed the most orders (473 total)
• Pamela Ansman-Wolfe is the most efficient with a productivity score of 35,001`;

      const message = {
        text: dashboardResponse,
        thread_ts: '1234567890.000001',
        blocks: [
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: `I've created a comprehensive sales rep performance analysis that addresses all aspects of your request. Here's what I found and built for you:`,
            },
          },
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: '*Key Performance Insights*',
            },
          },
          {
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: `*Top Performers by Revenue:*
• Linda Mitchell leads with $10.37M in total sales
• Jillian Carson follows closely with $10.07M
• Michael Blythe rounds out the top 3 with $9.29M

*Volume vs Efficiency Leaders:*
• Jillian Carson processed the most orders (473 total)
• Pamela Ansman-Wolfe is the most efficient with a productivity score of 35,001`,
            },
          },
          {
            type: 'actions' as const,
            elements: [
              {
                type: 'button' as const,
                text: {
                  type: 'plain_text' as const,
                  text: 'Open in Buster',
                  emoji: false,
                },
                url: 'https://platform.buster.so/app/chats/123/dashboards/456?dashboard_version_number=1',
              },
            ],
          },
        ],
      };

      const result = await messagingService.sendMessage('xoxb-test-token', 'C123', message);

      expect(result.success).toBe(true);

      // Verify blocks were preserved exactly as provided
      const callArgs = mockSlackClient.chat.postMessage.mock.calls[0][0];
      expect(callArgs.blocks).toEqual(message.blocks);
      expect(callArgs.blocks).toHaveLength(4);

      // Verify button is at the bottom
      const lastBlock = callArgs.blocks[callArgs.blocks.length - 1];
      expect(lastBlock.type).toBe('actions');
      expect(lastBlock.elements[0].type).toBe('button');
      expect(lastBlock.elements[0].text.text).toBe('Open in Buster');
      expect(lastBlock.elements[0].url).toContain('/dashboards/');
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
