import { convertMarkdownToSlack } from '@buster/slack';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SlackNotificationParams, SlackReplyNotificationParams } from './slack-notifier';

// Mock the @buster/slack module
vi.mock('@buster/slack', () => ({
  SlackMessageSource: {
    ANALYST_MESSAGE_POST_PROCESSING: 'ANALYST_MESSAGE_POST_PROCESSING',
  },
  convertMarkdownToSlack: vi.fn(),
}));

// Mock the database
vi.mock('@buster/database', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                id: 'integration-1',
                defaultChannel: { id: 'C123' },
                tokenVaultKey: 'vault-key-1',
                status: 'active',
              },
            ])
          ),
        })),
      })),
    })),
    transaction: vi.fn(),
  },
  getSecretByName: vi.fn(() => Promise.resolve({ secret: 'xoxb-test-token' })),
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
  messages: {},
  messagesToSlackMessages: {},
  slackIntegrations: {},
  slackMessageTracking: {},
}));

// Mock the @buster/secrets module
vi.mock('@buster/secrets', () => ({
  SERVER_KEYS: {
    BUSTER_URL: 'BUSTER_URL',
  },
  SLACK_KEYS: {
    BUSTER_ALERT_CHANNEL_TOKEN: 'BUSTER_ALERT_CHANNEL_TOKEN',
    BUSTER_ALERT_CHANNEL_ID: 'BUSTER_ALERT_CHANNEL_ID',
  },
  getSecret: vi.fn((key) => {
    if (key === 'BUSTER_URL') {
      return Promise.resolve('https://platform.buster.so');
    }
    // Return null for alert channel keys to skip that step in tests
    return Promise.resolve(null);
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('slack-notifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatSlackMessage with markdown conversion', () => {
    it('should convert markdown in formattedMessage', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Kevin requested a "total count of customers".\n\n• I included all customer records in `customers.status`, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count.',
        blocks: [],
      });

      // Mock the sendSlackMessage function's fetch call
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      // Import the actual functions after mocks are set up
      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'Kevin',
        chatId: 'chat-456',
        summaryTitle: 'Customer Count Includes All Statuses',
        summaryMessage:
          'Kevin requested a "total count of customers".\n\n- I included all customer records in `customers.status`, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count.',
        toolCalled: 'generateSummary',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.summaryMessage);

      // Verify the fetch was called with converted text
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.blocks).toContainEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Kevin requested a "total count of customers".\n\n• I included all customer records in `customers.status`, regardless of status (active, inactive, deleted). If incorrect, this likely inflates the count.',
          verbatim: false,
        },
      });
    });

    it('should convert markdown in flagChat message', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'I found no matching records for the request about *recent returns*.',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'Nate',
        chatId: 'chat-789',
        toolCalled: 'flagChat',
        message: 'I found no matching records for the request about **recent returns**.',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.message);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.blocks).toContainEqual({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'I found no matching records for the request about *recent returns*.',
          verbatim: false,
        },
      });
    });

    it('should convert markdown with backticks to Slack code format', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Leslie requested "users and their referral_ids for the Northwest team".\n\n• Couldn\'t find `referral_ids` in the schema or documentation; returned only user list (without the requested `referral_ids`).',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'Leslie',
        chatId: 'chat-999',
        summaryTitle: 'Missing Referral IDs',
        summaryMessage:
          'Leslie requested "users and their referral_ids for the Northwest team".\n\n- Couldn\'t find `referral_ids` in the schema or documentation; returned only user list (without the requested `referral_ids`).',
        toolCalled: 'generateSummary',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.summaryMessage);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.blocks[1].text.text).toContain('`referral_ids`');
    });

    it('should preserve button URL in all message types', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Test message',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'Test User',
        chatId: 'chat-123',
        summaryTitle: 'Test Title',
        summaryMessage: 'Test message',
        toolCalled: 'generateSummary',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      // Check that the button exists and has correct URL
      const actionsBlock = body.blocks.find((block: any) => block.type === 'actions');
      expect(actionsBlock).toBeDefined();
      expect(actionsBlock.elements[0].url).toBe('https://platform.buster.so/app/chats/chat-123');
      expect(actionsBlock.elements[0].text.text).toBe('Open in Buster');
    });
  });

  describe('formatSlackReplyMessage with markdown conversion', () => {
    it('should convert markdown in reply with formattedMessage', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Update: The analysis found *5 major assumptions* that need review.',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackReplyNotification } = await import('./slack-notifier');

      const params: SlackReplyNotificationParams = {
        organizationId: 'org-123',
        userName: 'Kevin',
        chatId: 'chat-456',
        formattedMessage: 'Update: The analysis found **5 major assumptions** that need review.',
        toolCalled: 'generateSummary',
        threadTs: '1234567890.000001',
        channelId: 'C123',
        integrationId: 'integration-1',
        tokenVaultKey: 'vault-key-1',
      };

      const result = await sendSlackReplyNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.formattedMessage);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.thread_ts).toBe('1234567890.000001');
      expect(body.blocks[0].text.text).toBe(
        'Update: The analysis found *5 major assumptions* that need review.'
      );
    });

    it('should convert markdown in reply with summaryMessage', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Found issues with `order_status` field mapping.',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackReplyNotification } = await import('./slack-notifier');

      const params: SlackReplyNotificationParams = {
        organizationId: 'org-123',
        userName: 'User',
        chatId: 'chat-456',
        summaryTitle: 'Field Mapping Issue',
        summaryMessage: 'Found issues with `order_status` field mapping.',
        toolCalled: 'generateSummary',
        threadTs: '1234567890.000001',
        channelId: 'C123',
        integrationId: 'integration-1',
        tokenVaultKey: 'vault-key-1',
      };

      const result = await sendSlackReplyNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.summaryMessage);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.blocks[0].text.text).toContain('`order_status`');
    });

    it('should convert markdown in reply with flagChat message', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Error: Could not process the *dashboard request*.',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackReplyNotification } = await import('./slack-notifier');

      const params: SlackReplyNotificationParams = {
        organizationId: 'org-123',
        userName: 'User',
        chatId: 'chat-456',
        toolCalled: 'flagChat',
        message: 'Error: Could not process the **dashboard request**.',
        threadTs: '1234567890.000001',
        channelId: 'C123',
        integrationId: 'integration-1',
        tokenVaultKey: 'vault-key-1',
      };

      const result = await sendSlackReplyNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(params.message);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.blocks[0].text.text).toBe('Error: Could not process the *dashboard request*.');
    });
  });

  describe('edge cases for markdown conversion', () => {
    it('should handle empty blocks from markdown conversion', async () => {
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Simple text without formatting',
        blocks: [], // Empty blocks array
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'User',
        chatId: 'chat-456',
        summaryTitle: 'Simple Title',
        summaryMessage: 'Simple text without formatting',
        toolCalled: 'generateSummary',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      // Should still have the section block with converted text
      expect(body.blocks).toHaveLength(3); // Header, message, actions
      expect(body.blocks[1].text.text).toBe('Simple text without formatting');
    });

    it('should handle complex markdown with multiple backticks and formatting', async () => {
      const complexMarkdown =
        'Assumed `SUM(subtotal + taxamt + freight)` from `sales_order_header` table for **total sales** calculation.';
      const mockConvertMarkdownToSlack = vi.mocked(convertMarkdownToSlack);
      mockConvertMarkdownToSlack.mockReturnValue({
        text: 'Assumed `SUM(subtotal + taxamt + freight)` from `sales_order_header` table for *total sales* calculation.',
        blocks: [],
      });

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, ts: '1234567890.123456' }),
      } as Response);

      const { sendSlackNotification } = await import('./slack-notifier');

      const params: SlackNotificationParams = {
        organizationId: 'org-123',
        userName: 'Landen',
        chatId: 'chat-456',
        summaryTitle: 'Sales Calculation Assumption',
        summaryMessage: complexMarkdown,
        toolCalled: 'generateSummary',
      };

      const result = await sendSlackNotification(params);

      expect(result.sent).toBe(true);
      expect(mockConvertMarkdownToSlack).toHaveBeenCalledWith(complexMarkdown);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      if (!fetchCall || !fetchCall[1]) {
        throw new Error('Expected fetch to be called');
      }
      const body = JSON.parse(fetchCall[1].body as string);

      const messageBlock = body.blocks[1];
      expect(messageBlock.text.text).toContain('`SUM(subtotal + taxamt + freight)`');
      expect(messageBlock.text.text).toContain('`sales_order_header`');
      expect(messageBlock.text.text).toContain('*total sales*');
    });
  });
});
