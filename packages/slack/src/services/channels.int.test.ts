import { SLACK_KEYS, getSecret } from '@buster/secrets';
import { beforeAll, describe, expect, it } from 'vitest';
import { SlackChannelService } from './channels';

// Only run if environment is configured
let runIntegrationTests: boolean;

const describeIntegration = runIntegrationTests ? describe : describe.skip;

describeIntegration('SlackChannelService Integration', () => {
  let channelService: SlackChannelService;
  let botToken: string;
  let channelId: string;

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
    channelService = new SlackChannelService();
  });

  describe('Channel Listing', () => {
    it('should fetch available public channels', async () => {
      const channels = await channelService.getAvailableChannels(botToken);

      expect(Array.isArray(channels)).toBe(true);
      expect(channels.length).toBeGreaterThan(0);

      // Check channel structure
      const firstChannel = channels[0];
      expect(firstChannel).toHaveProperty('id');
      expect(firstChannel).toHaveProperty('name');
      expect(firstChannel).toHaveProperty('is_private');
      expect(firstChannel).toHaveProperty('is_archived');
      expect(firstChannel).toHaveProperty('is_member');

      // Should be sorted alphabetically
      for (let i = 1; i < channels.length; i++) {
        expect(channels[i].name >= channels[i - 1].name).toBe(true);
      }
    });

    it('should exclude archived channels by default', async () => {
      const channels = await channelService.getAvailableChannels(botToken);

      const archivedChannels = channels.filter((ch) => ch.is_archived);
      expect(archivedChannels.length).toBe(0);
    });

    it('should include archived channels when requested', async () => {
      const allChannels = await channelService.getAvailableChannels(botToken, true);
      const activeChannels = await channelService.getAvailableChannels(botToken, false);

      // Might have more channels when including archived
      expect(allChannels.length).toBeGreaterThanOrEqual(activeChannels.length);
    });
  });

  describe('Channel Validation', () => {
    it('should validate access to configured channel', async () => {
      const channel = await channelService.validateChannelAccess(botToken, channelId);

      expect(channel).toBeTruthy();
      expect(channel.id).toBe(channelId);
      expect(channel.name).toBeTruthy();
      expect(channel.is_archived).toBe(false);
    });

    it('should fail validation for non-existent channel', async () => {
      await expect(
        channelService.validateChannelAccess(botToken, 'C_INVALID_CHANNEL')
      ).rejects.toThrow('Channel does not exist or bot cannot access it');
    });

    it('should fail validation with invalid token', async () => {
      await expect(
        channelService.validateChannelAccess('xoxb-invalid-token', channelId)
      ).rejects.toThrow('Invalid or expired access token');
    });
  });

  describe('Channel Membership', () => {
    it('should check if bot is member of configured channel', async () => {
      const channel = await channelService.validateChannelAccess(botToken, channelId);

      // The bot might not be a member of the channel yet
      // This is informational - not a hard requirement
      if (!channel.is_member) {
        console.log(
          `Bot is not a member of channel ${channelId}. Consider inviting the bot with /invite @YourBotName`
        );
      }

      // Just verify we got valid channel info
      expect(channel.id).toBe(channelId);
      expect(channel.name).toBeTruthy();
    });

    it('should join a public channel successfully', async () => {
      // This test is a bit tricky - we need a channel we're not in
      // For safety, we'll skip the actual join unless a test channel is provided
      let testChannelId: string | undefined;
      try {
        testChannelId = await getSecret(SLACK_KEYS.SLACK_TEST_JOIN_CHANNEL_ID);
      } catch {
        testChannelId = undefined;
      }

      if (!testChannelId) {
        console.log('Skipping join test - set SLACK_TEST_JOIN_CHANNEL_ID to test');
        return;
      }

      const result = await channelService.joinChannel(botToken, testChannelId);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle join errors gracefully', async () => {
      // Try to join a private channel (should fail)
      const result = await channelService.joinChannel(botToken, 'C_PRIVATE_CHANNEL');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should leave a channel successfully', async () => {
      // Skip destructive test unless explicitly enabled
      let skipLeaveTests: string | undefined;
      try {
        skipLeaveTests = await getSecret(SLACK_KEYS.SLACK_SKIP_LEAVE_TESTS);
      } catch {
        skipLeaveTests = undefined;
      }

      if (skipLeaveTests === 'true') {
        console.log('Skipping leave test - destructive action');
        return;
      }

      let testChannelId: string | undefined;
      try {
        testChannelId = await getSecret(SLACK_KEYS.SLACK_TEST_LEAVE_CHANNEL_ID);
      } catch {
        testChannelId = undefined;
      }
      if (!testChannelId) {
        console.log('Skipping leave test - set SLACK_TEST_LEAVE_CHANNEL_ID to test');
        return;
      }

      const result = await channelService.leaveChannel(botToken, testChannelId);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting gracefully', async () => {
      // Make rapid requests to potentially trigger rate limit
      const promises = Array.from({ length: 20 }, () =>
        channelService.getAvailableChannels(botToken).catch((e) => e)
      );

      const results = await Promise.all(promises);

      // All should either succeed or fail with rate limit error
      for (const result of results) {
        if (result instanceof Error) {
          expect(result.message).toMatch(/rate limit|too many requests/i);
        } else {
          expect(Array.isArray(result)).toBe(true);
        }
      }
    });

    it('should provide clear error messages', async () => {
      try {
        await channelService.validateChannelAccess('', channelId);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toHaveProperty('message', 'Access token is required');
      }

      try {
        await channelService.validateChannelAccess(botToken, '');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toHaveProperty('message', 'Channel ID is required');
      }
    });
  });

  describe('Performance', () => {
    it('should fetch channels efficiently with pagination', async () => {
      const startTime = Date.now();
      const channels = await channelService.getAvailableChannels(botToken);
      const duration = Date.now() - startTime;

      // Should complete reasonably quickly even with many channels
      expect(duration).toBeLessThan(10000); // 10 seconds max

      // Should have fetched channels
      expect(channels.length).toBeGreaterThan(0);
    });
  });
});
