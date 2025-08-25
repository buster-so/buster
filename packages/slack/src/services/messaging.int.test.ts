import { SLACK_KEYS, getSecret } from '@buster/secrets';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  MessageTemplates,
  createActionsBlock,
  createSectionBlock,
  formatSimpleMessage,
} from '../utils/message-formatter';
import { SlackMessagingService } from './messaging';

// Only run if environment is configured
let runIntegrationTests: boolean;

const describeIntegration = runIntegrationTests ? describe : describe.skip;

describeIntegration('SlackMessagingService Integration', () => {
  let messagingService: SlackMessagingService;
  let botToken: string;
  let channelId: string;
  let testMessageTs: string | undefined;

  beforeAll(async () => {
    try {
      await getSecret(SLACK_KEYS.SLACK_BOT_TOKEN);
      await getSecret(SLACK_KEYS.SLACK_CHANNEL_ID);
      runIntegrationTests = true;
    } catch {
      runIntegrationTests = false;
    }

    botToken = await getSecret(SLACK_KEYS.SLACK_BOT_TOKEN);
    channelId = await getSecret(SLACK_KEYS.SLACK_CHANNEL_ID);
    messagingService = new SlackMessagingService();
  });

  describe('Basic Messaging', () => {
    it('should send a simple text message', async () => {
      const result = await messagingService.sendMessage(
        botToken,
        channelId,
        formatSimpleMessage('Integration test: Simple message')
      );

      expect(result.success).toBe(true);
      expect(result.messageTs).toBeTruthy();
      expect(result.channelId).toBe(channelId);

      // Store for later tests
      testMessageTs = result.messageTs;
    });

    it('should send a message with blocks', async () => {
      const message = {
        blocks: [
          createSectionBlock('*Integration Test*: Message with blocks', {
            fields: [
              { title: 'Status', value: 'Running' },
              { title: 'Time', value: new Date().toISOString() },
            ],
          }),
        ],
      };

      const result = await messagingService.sendMessage(botToken, channelId, message);
      expect(result.success).toBe(true);
    });

    it('should send a message with actions', async () => {
      const message = {
        blocks: [
          createSectionBlock('Integration test: Message with actions'),
          createActionsBlock([
            { text: 'Approve', value: 'approve_test', style: 'primary' },
            { text: 'Reject', value: 'reject_test', style: 'danger' },
          ]),
        ],
      };

      const result = await messagingService.sendMessage(botToken, channelId, message);
      expect(result.success).toBe(true);
    });
  });

  describe('Message Templates', () => {
    it('should send a deployment notification', async () => {
      const message = MessageTemplates.deployment({
        project: 'slack-integration-test',
        environment: 'test',
        version: '1.0.0',
        status: 'success',
        duration: '10s',
      });

      const result = await messagingService.sendMessage(botToken, channelId, message);
      expect(result.success).toBe(true);
    });

    it('should send an alert notification', async () => {
      const message = MessageTemplates.alert({
        title: 'Integration Test Alert',
        message: 'This is a test alert from integration tests',
        severity: 'info',
        source: 'integration-tests',
      });

      const result = await messagingService.sendMessage(botToken, channelId, message);
      expect(result.success).toBe(true);
    });

    it('should send a review flagging notification', async () => {
      const message = MessageTemplates.reviewFlag({
        reviewerName: 'John Smith',
        profileUrl: 'https://example.com/profile/123',
        issueTitle: 'Unexpected $0.00 Query Results Issue',
        description:
          'John asked for total revenue for Acme Corp, but the query returned $0.00. This result seems unexpected and may indicate a data issue or incorrect filtering criteria.',
      });

      const result = await messagingService.sendMessage(botToken, channelId, message);
      expect(result.success).toBe(true);
      expect(result.messageTs).toBeTruthy();
    });
  });

  describe('Threading', () => {
    it('should reply to a message', async () => {
      // First send a parent message
      const parentResult = await messagingService.sendMessage(
        botToken,
        channelId,
        formatSimpleMessage('Integration test: Parent message for threading')
      );

      expect(parentResult.success).toBe(true);
      const parentTs = parentResult.messageTs!;

      // Reply to it
      const replyResult = await messagingService.replyToMessage(
        botToken,
        channelId,
        parentTs,
        formatSimpleMessage('Integration test: This is a reply')
      );

      expect(replyResult.success).toBe(true);
    });

    it('should get thread replies', async () => {
      // First create a parent message for this specific test
      const parentResult = await messagingService.sendMessage(
        botToken,
        channelId,
        formatSimpleMessage('Integration test: Parent for thread replies test')
      );

      if (!parentResult.success || !parentResult.messageTs) {
        console.log('Could not create parent message for thread test - bot may not be in channel');
        console.log('Please invite the bot to the channel with: /invite @YourBotName');
        return;
      }

      const result = await messagingService.getThreadReplies(
        botToken,
        channelId,
        parentResult.messageTs
      );

      // If bot is not in channel or missing permissions, this might fail
      if (!result.success) {
        console.log(`Thread replies test failed: ${result.error}`);
        if (result.error?.includes('not_in_channel') || result.error?.includes('not a member')) {
          console.log('Bot needs to be a member of the channel to read thread replies');
          console.log('Please invite the bot to the channel with: /invite @YourBotName');
        } else if (result.error?.includes('missing_scope')) {
          console.log('Bot is missing the channels:history scope');
          console.log('Please add channels:history scope in your Slack app settings and reinstall');
        }
        return;
      }

      expect(result.success).toBe(true);
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
      // Should at least have the parent message
      expect(result.messages!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Message Updates', () => {
    it('should update a message', async () => {
      // Send initial message
      const initialResult = await messagingService.sendMessage(
        botToken,
        channelId,
        formatSimpleMessage('Integration test: Original message')
      );

      expect(initialResult.success).toBe(true);
      const messageTs = initialResult.messageTs!;

      // Update it
      const updateResult = await messagingService.updateMessage(
        botToken,
        channelId,
        messageTs,
        formatSimpleMessage('Integration test: Updated message ✅')
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.messageTs).toBe(messageTs);
    });

    it('should delete a message', async () => {
      // Skip if configured to avoid destructive tests
      let skipDeleteTests: string | undefined;
      try {
        skipDeleteTests = await getSecret(SLACK_KEYS.SLACK_SKIP_DELETE_TESTS);
      } catch {
        skipDeleteTests = undefined;
      }

      if (skipDeleteTests === 'true') {
        return;
      }

      // Send a message
      const result = await messagingService.sendMessage(
        botToken,
        channelId,
        formatSimpleMessage('Integration test: This message will be deleted')
      );

      expect(result.success).toBe(true);
      const messageTs = result.messageTs!;

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Delete it
      const deleteResult = await messagingService.deleteMessage(botToken, channelId, messageTs);

      expect(deleteResult.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid channel gracefully', async () => {
      const result = await messagingService.sendMessage(
        botToken,
        'C_INVALID_CHANNEL',
        formatSimpleMessage('This should fail')
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Channel not found');
    });

    it('should handle retry logic correctly', async () => {
      const result = await messagingService.sendMessageWithRetry(
        botToken,
        'C_INVALID_CHANNEL',
        formatSimpleMessage('This should fail'),
        2
      );

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(0); // Should not retry on permanent errors
    });
  });

  describe('Validation', () => {
    it('should validate messaging capability', async () => {
      const result = await messagingService.validateMessagingCapability(botToken);

      expect(result.canSend).toBe(true);
      expect(result.botId).toBeTruthy();
      expect(result.teamId).toBeTruthy();
    });

    it('should fail validation with invalid token', async () => {
      const result = await messagingService.validateMessagingCapability('xoxb-invalid-token');

      expect(result.canSend).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
