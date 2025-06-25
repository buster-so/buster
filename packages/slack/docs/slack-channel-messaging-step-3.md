# Slack Messaging - Product Requirements Document

## Overview

This PRD defines the implementation of Slack messaging capabilities for Buster. Users can select one notification channel within their connected Slack workspace, and the system can send messages to that channel via background jobs or triggered events. Additionally, the system can reply to previously sent messages using Slack's threading feature. This builds on the OAuth integration from the previous PRD.

## User Journey

### Channel Selection Flow
1. User connects Slack workspace (via OAuth)
2. User accesses channel configuration in Buster dashboard
3. System displays dropdown of available public channels
4. User selects ONE channel as their notification channel
5. Configuration is saved and ready for message sending

### Message Sending Flow (Background)
1. Buster triggers a message send via background job or webhook
2. System retrieves user's integration and notification channel
3. System fetches access token from token storage
4. Message is sent to the configured Slack channel
5. Message timestamp and metadata are stored for potential replies
6. Success/failure is logged for monitoring

### Message Reply Flow (Background)
1. Buster needs to reply to a previously sent message
2. System looks up original message using internal message ID
3. System sends reply using Slack's `thread_ts` parameter
4. Reply appears as threaded response in Slack channel

## Technical Implementation

### 1. Message Tracking Database Schema

#### `message_slack_mapping` Table
```typescript
import { z } from 'zod';

// Zod schema for validation
export const MessageSlackMappingSchema = z.object({
  id: z.string().uuid(),
  internalMessageId: z.string(), // Your internal message/notification ID
  slackIntegrationId: z.string().uuid(),
  slackChannelId: z.string(),
  slackMessageTs: z.string(), // Slack's message timestamp for threading
  messageType: z.string().optional(), // e.g., 'deployment', 'alert', 'notification'
  sentAt: z.date(),
});

export type MessageSlackMapping = z.infer<typeof MessageSlackMappingSchema>;

// Database table definition
export const messageSlackMapping = pgTable('message_slack_mapping', {
  id: uuid('id').primaryKey().defaultRandom(),
  internalMessageId: varchar('internal_message_id', { length: 255 }).notNull(),
  slackIntegrationId: uuid('slack_integration_id').notNull()
    .references(() => slackIntegrations.id, { onDelete: 'cascade' }),
  slackChannelId: varchar('slack_channel_id', { length: 50 }).notNull(),
  slackMessageTs: varchar('slack_message_ts', { length: 50 }).notNull(),
  messageType: varchar('message_type', { length: 50 }),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
});

// Indexes and constraints
CREATE UNIQUE INDEX idx_message_slack_mapping_internal_integration 
  ON message_slack_mapping(internal_message_id, slack_integration_id);
CREATE INDEX idx_message_slack_mapping_internal_id ON message_slack_mapping(internal_message_id);
CREATE INDEX idx_message_slack_mapping_slack_ts ON message_slack_mapping(slack_message_ts);
```

### 2. Channel Selection Service (`packages/slack-integration/src/services/channels.ts`)

```typescript
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { SlackTokenManager } from '../utils/supabase';
import type { SlackChannel } from '../types/slack-api';

export class SlackChannelService {
  private slackClient: WebClient;
  private tokenManager: SlackTokenManager;

  constructor(
    private db: Database,
    private supabase: SupabaseClient
  ) {
    this.slackClient = new WebClient();
    this.tokenManager = new SlackTokenManager(supabase);
  }

  /**
   * Fetch available channels for user's integration
   */
  async getAvailableChannels(userId: string): Promise<SlackChannel[]> {
    // Get user's integration
    const integration = await this.getUserIntegration(userId);
    if (!integration) {
      throw new Error('No Slack integration found for user');
    }

    // Get access token
    const accessToken = await this.tokenManager.getToken(integration.id);
    if (!accessToken) {
      throw new Error('Access token not found - integration may need reconnection');
    }

    // Fetch public channels only
    const channels = await this.fetchPublicChannels(accessToken);
    
    return channels;
  }

  /**
   * Set user's notification channel
   */
  async setNotificationChannel(
    userId: string, 
    channelId: string, 
    channelName: string
  ): Promise<void> {
    // Get user's integration
    const integration = await this.getUserIntegration(userId);
    if (!integration) {
      throw new Error('No Slack integration found for user');
    }

    // Validate channel exists and is accessible
    await this.validateChannelAccess(integration.id, channelId);

    // Update integration with selected channel
    await this.db
      .update(slackIntegrations)
      .set({
        notificationChannelId: channelId,
        notificationChannelName: channelName,
        updatedAt: new Date(),
      })
      .where(eq(slackIntegrations.id, integration.id));
  }

  /**
   * Get user's current notification channel configuration
   */
  async getNotificationChannel(userId: string): Promise<{
    channelId: string;
    channelName: string;
  } | null> {
    const integration = await this.getUserIntegration(userId);
    
    if (!integration?.notificationChannelId) {
      return null;
    }

    return {
      channelId: integration.notificationChannelId,
      channelName: integration.notificationChannelName || 'Unknown Channel',
    };
  }

  private async fetchPublicChannels(accessToken: string): Promise<SlackChannel[]> {
    const channels: SlackChannel[] = [];
    let cursor: string | undefined;

    try {
      do {
        const response = await this.slackClient.conversations.list({
          token: accessToken,
          types: 'public_channel', // Only public channels
          exclude_archived: true,   // No archived channels
          limit: 200,
          cursor,
        });

        if (response.ok && response.channels) {
          // Filter out channels where bot is not a member (if needed)
          const accessibleChannels = response.channels.filter(channel => 
            !channel.is_archived && 
            (channel.is_member || !channel.is_private)
          );
          
          channels.push(...accessibleChannels);
          cursor = response.response_metadata?.next_cursor;
        } else {
          throw new Error(`Failed to fetch channels: ${response.error}`);
        }
      } while (cursor);

      // Sort channels alphabetically
      return channels.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Error fetching channels: ${error.message}`);
    }
  }

  private async validateChannelAccess(integrationId: string, channelId: string): Promise<void> {
    const accessToken = await this.tokenManager.getToken(integrationId);
    if (!accessToken) {
      throw new Error('Access token not found');
    }

    try {
      // Try to get channel info to validate access
      const response = await this.slackClient.conversations.info({
        token: accessToken,
        channel: channelId,
      });

      if (!response.ok) {
        throw new Error(`Channel validation failed: ${response.error}`);
      }

      if (response.channel?.is_archived) {
        throw new Error('Cannot select archived channel');
      }

      if (response.channel?.is_private && !response.channel?.is_member) {
        throw new Error('Bot is not a member of this private channel');
      }
    } catch (error) {
      throw new Error(`Channel access validation failed: ${error.message}`);
    }
  }

}
```

### 3. Enhanced Message Sending Service (`packages/slack-integration/src/services/messaging.ts`)

```typescript
import { z } from 'zod';
import { WebClient } from '@slack/web-api';
import { SlackMessageSchema } from '../types';
import { SlackTokenManager } from '../utils/token-storage';

export class SlackMessagingService {
  private slackClient: WebClient;
  private tokenManager: SlackTokenManager;

  constructor(
    private db: Database
  ) {
    this.slackClient = new WebClient();
    this.tokenManager = new SlackTokenManager();
  }

  /**
   * Send notification to user's configured channel with message tracking
   */
  async sendNotificationWithTracking(
    userId: string, 
    message: SlackMessage,
    internalMessageId: string,
    messageType?: string
  ): Promise<{
    success: boolean;
    messageTs?: string;
    error?: string;
  }> {
    try {
      // Send the message first
      const result = await this.sendNotification(userId, message);
      
      if (result.success && result.messageTs) {
        // Get user's integration for tracking
        const integration = await this.getUserIntegration(userId);
        
        if (integration?.notificationChannelId) {
          // Store the message mapping for future replies
          await this.db.insert(messageSlackMapping).values({
            id: crypto.randomUUID(),
            internalMessageId,
            slackIntegrationId: integration.id,
            slackChannelId: integration.notificationChannelId,
            slackMessageTs: result.messageTs,
            messageType,
            sentAt: new Date(),
          });
        }
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reply to a previously sent message using Slack threading
   */
  async replyToMessage(
    internalMessageId: string,
    replyMessage: SlackMessage
  ): Promise<{
    success: boolean;
    messageTs?: string;
    error?: string;
  }> {
    try {
      // Find the original message mapping
      const [mapping] = await this.db
        .select()
        .from(messageSlackMapping)
        .where(eq(messageSlackMapping.internalMessageId, internalMessageId))
        .limit(1);

      if (!mapping) {
        return {
          success: false,
          error: 'Original message not found - cannot reply to unmapped message',
        };
      }

      // Get access token for the integration
      const accessToken = await this.tokenManager.getToken(mapping.slackIntegrationId);
      if (!accessToken) {
        return {
          success: false,
          error: 'Access token not found - integration may need reconnection',
        };
      }

      // Send reply message with thread_ts to create threaded reply
      const response = await this.slackClient.chat.postMessage({
        token: accessToken,
        channel: mapping.slackChannelId,
        thread_ts: mapping.slackMessageTs, // This makes it a threaded reply
        ...replyMessage,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      return {
        success: true,
        messageTs: response.ts,
      };

    } catch (error) {
      console.error('Failed to reply to message:', error);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get thread history for a message (for debugging/monitoring)
   */
  async getMessageThread(internalMessageId: string): Promise<{
    success: boolean;
    messages?: any[];
    error?: string;
  }> {
    try {
      const [mapping] = await this.db
        .select()
        .from(messageSlackMapping)
        .where(eq(messageSlackMapping.internalMessageId, internalMessageId))
        .limit(1);

      if (!mapping) {
        return {
          success: false,
          error: 'Message mapping not found',
        };
      }

      const accessToken = await this.tokenManager.getToken(mapping.slackIntegrationId);
      if (!accessToken) {
        return {
          success: false,
          error: 'Access token not found',
        };
      }

      const response = await this.slackClient.conversations.replies({
        token: accessToken,
        channel: mapping.slackChannelId,
        ts: mapping.slackMessageTs,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      return {
        success: true,
        messages: response.messages || [],
      };

    } catch (error) {
      console.error('Failed to get message thread:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send notification to user's configured channel
   */
  async sendNotification(userId: string, message: SlackMessage): Promise<{
    success: boolean;
    messageTs?: string;
    error?: string;
  }> {
    try {
      // Validate message
      const validatedMessage = SlackMessageSchema.parse(message);

      // Get user's integration and notification channel
      const integration = await this.getUserIntegration(userId);
      if (!integration) {
        throw new Error('No Slack integration found for user');
      }

      if (!integration.notificationChannelId) {
        throw new Error('No notification channel configured');
      }

      // Get access token
      const accessToken = await this.tokenManager.getToken(integration.id);
      if (!accessToken) {
        throw new Error('Access token not found - integration may need reconnection');
      }

      // Send message to Slack
      const response = await this.slackClient.chat.postMessage({
        token: accessToken,
        channel: integration.notificationChannelId,
        ...validatedMessage,
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.error}`);
      }

      return {
        success: true,
        messageTs: response.ts,
      };

    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send notification with automatic retry
   */
  async sendNotificationWithRetry(
    userId: string, 
    message: SlackMessage, 
    maxRetries: number = 3
  ): Promise<{
    success: boolean;
    messageTs?: string;
    error?: string;
    retryCount: number;
  }> {
    let lastError: Error;
    let retryCount = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendNotification(userId, message);
        
        if (result.success) {
          return {
            ...result,
            retryCount,
          };
        } else {
          lastError = new Error(result.error);
          
          // Don't retry certain errors
          if (!this.isRetryableError(result.error || '')) {
            break;
          }
        }
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryableError(error.message)) {
          break;
        }
      }

      retryCount++;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      retryCount,
    };
  }

  /**
   * Validate that user can send messages (integration health check)
   */
  async validateMessagingCapability(userId: string): Promise<{
    canSend: boolean;
    error?: string;
    channelConfigured: boolean;
    integrationActive: boolean;
  }> {
    try {
      const integration = await this.getUserIntegration(userId);
      
      if (!integration) {
        return {
          canSend: false,
          error: 'No Slack integration found',
          channelConfigured: false,
          integrationActive: false,
        };
      }

      if (!integration.notificationChannelId) {
        return {
          canSend: false,
          error: 'No notification channel configured',
          channelConfigured: false,
          integrationActive: true,
        };
      }

      // Test access token
      const accessToken = await this.tokenManager.getToken(integration.id);
      if (!accessToken) {
        return {
          canSend: false,
          error: 'Access token not found',
          channelConfigured: true,
          integrationActive: false,
        };
      }

      // Test API connectivity
      const authTest = await this.slackClient.auth.test({
        token: accessToken,
      });

      if (!authTest.ok) {
        return {
          canSend: false,
          error: 'Invalid access token',
          channelConfigured: true,
          integrationActive: false,
        };
      }

      return {
        canSend: true,
        channelConfigured: true,
        integrationActive: true,
      };

    } catch (error) {
      return {
        canSend: false,
        error: error.message,
        channelConfigured: false,
        integrationActive: false,
      };
    }
  }

  /**
   * Send message to multiple users (batch operation)
   */
  async sendBulkNotifications(
    notifications: Array<{ userId: string; message: SlackMessage }>,
    options?: { concurrency?: number; continueOnError?: boolean }
  ): Promise<{
    successful: Array<{ userId: string; messageTs: string }>;
    failed: Array<{ userId: string; error: string }>;
    totalSent: number;
    totalFailed: number;
  }> {
    const successful: Array<{ userId: string; messageTs: string }> = [];
    const failed: Array<{ userId: string; error: string }> = [];
    
    const concurrency = options?.concurrency || 5;
    const continueOnError = options?.continueOnError ?? true;

    // Process in chunks to respect concurrency limits
    const chunks = this.chunkArray(notifications, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async ({ userId, message }) => {
        try {
          const result = await this.sendNotification(userId, message);
          
          if (result.success && result.messageTs) {
            successful.push({ userId, messageTs: result.messageTs });
          } else {
            failed.push({ userId, error: result.error || 'Unknown error' });
          }
        } catch (error) {
          failed.push({ userId, error: error.message });
          
          if (!continueOnError) {
            throw error;
          }
        }
      });

      await Promise.allSettled(promises);
    }

    return {
      successful,
      failed,
      totalSent: successful.length,
      totalFailed: failed.length,
    };
  }

  private isRetryableError(errorMessage: string): boolean {
    const retryableErrors = [
      'rate_limited',
      'timeout',
      'server_error',
      'service_unavailable',
      'network',
    ];

    return retryableErrors.some(error => 
      errorMessage.toLowerCase().includes(error)
    );
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

}
```

### 4. API Endpoints (`hono-app/routes/slack-channels.ts`)

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { 
  SlackChannelService,
  ChannelSelectionSchema
} from '@buster/slack-integration';
import { createClient } from '@supabase/supabase-js';

const slackChannels = new Hono();

// Get available channels for user's integration
slackChannels.get('/integration/channels', async (c) => {
  try {
    const userId = c.get('userId');
    
    const channelService = new SlackChannelService(c.get('db'));
    
    const channels = await channelService.getAvailableChannels(userId);
    
    // Format for dropdown
    const formattedChannels = channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      purpose: channel.purpose?.value || null,
      memberCount: channel.num_members || null,
      isMember: channel.is_member || false,
    }));

    return c.json({ channels: formattedChannels });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

// Set notification channel
slackChannels.put('/integration/channel',
  zValidator('json', ChannelSelectionSchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      const { channelId, channelName } = c.req.valid('json');

      const channelService = new SlackChannelService(c.get('db'));
      
      await channelService.setNotificationChannel(userId, channelId, channelName);

      return c.json({ 
        success: true,
        message: `Notification channel set to #${channelName}`
      });
    } catch (error) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// Get current notification channel
slackChannels.get('/integration/channel', async (c) => {
  try {
    const userId = c.get('userId');

    const supabase = createClient(
      c.env.SUPABASE_URL, 
      c.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const channelService = new SlackChannelService(c.get('db'), supabase);
    
    const notificationChannel = await channelService.getNotificationChannel(userId);

    return c.json({ notificationChannel });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

export { slackChannels };
```

### 5. Background Job Examples with Message Tracking

```typescript
// For use in Trigger.dev jobs or similar background processing
import { SlackMessagingService, SlackMessageSchema } from '@buster/slack-integration';

// Example job for sending tracked notifications
export const sendSlackNotificationWithTracking = defineJob({
  id: "send-slack-notification-tracked",
  name: "Send Tracked Slack Notification",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "notification.slack.send.tracked",
  }),
  run: async (payload, io) => {
    const { userId, message, internalMessageId, messageType } = payload;
    
    // Validate payload
    const validatedMessage = SlackMessageSchema.parse(message);
    
    await io.logger.info("Sending tracked Slack notification", { 
      userId, 
      internalMessageId,
      messageType 
    });

    try {
      const messagingService = new SlackMessagingService(db);
      const result = await messagingService.sendNotificationWithTracking(
        userId,
        validatedMessage,
        internalMessageId,
        messageType
      );

      if (result.success) {
        await io.logger.info("Tracked Slack notification sent successfully", { 
          userId,
          internalMessageId,
          messageTs: result.messageTs
        });
      } else {
        await io.logger.error("Failed to send tracked Slack notification", { 
          userId,
          internalMessageId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      await io.logger.error("Slack notification job failed", { 
        error: error.message,
        userId,
        internalMessageId
      });
      throw error;
    }
  },
});

// Example job for sending replies to previous messages
export const replyToSlackMessage = defineJob({
  id: "reply-to-slack-message",
  name: "Reply to Slack Message",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "notification.slack.reply",
  }),
  run: async (payload, io) => {
    const { internalMessageId, replyMessage } = payload;
    
    // Validate payload
    const validatedReply = SlackMessageSchema.parse(replyMessage);
    
    await io.logger.info("Sending Slack reply", { 
      internalMessageId 
    });

    try {
      const messagingService = new SlackMessagingService(db);
      const result = await messagingService.replyToMessage(
        internalMessageId,
        validatedReply
      );

      if (result.success) {
        await io.logger.info("Slack reply sent successfully", { 
          internalMessageId,
          replyMessageTs: result.messageTs
        });
      } else {
        await io.logger.error("Failed to send Slack reply", { 
          internalMessageId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      await io.logger.error("Slack reply job failed", { 
        error: error.message,
        internalMessageId
      });
      throw error;
    }
  },
});

// Example deployment notification with follow-up
export const deploymentNotificationFlow = defineJob({
  id: "deployment-notification-flow",
  name: "Deployment Notification Flow",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "deployment.started",
  }),
  run: async (payload, io) => {
    const { userId, deploymentId, projectName } = payload;
    
    // Send initial deployment started message
    const initialMessage = {
      text: `🚀 Deployment started for ${projectName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🚀 *Deployment Started*\nProject: ${projectName}\nDeployment ID: ${deploymentId}`,
          },
        },
      ],
    };

    const messagingService = new SlackMessagingService(db);
    
    const result = await messagingService.sendNotificationWithTracking(
      userId,
      initialMessage,
      `deployment-${deploymentId}`,
      'deployment'
    );

    if (result.success) {
      await io.logger.info("Deployment notification sent", { 
        deploymentId,
        messageTs: result.messageTs 
      });

      // Set up listener for deployment completion (example)
      await io.sendEvent("deployment.track", { 
        deploymentId,
        userId,
        originalMessageId: `deployment-${deploymentId}`
      });
    }

    return result;
  },
});

// Follow-up job for deployment completion
export const deploymentCompletionNotification = defineJob({
  id: "deployment-completion-notification",
  name: "Deployment Completion Notification", 
  version: "1.0.0",
  trigger: eventTrigger({
    name: "deployment.completed",
  }),
  run: async (payload, io) => {
    const { deploymentId, success, duration, error } = payload;
    
    const replyMessage = success
      ? {
          text: `✅ Deployment completed successfully in ${duration}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Deployment Completed*\nStatus: Success\nDuration: ${duration}`,
              },
            },
          ],
        }
      : {
          text: `❌ Deployment failed: ${error}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `❌ *Deployment Failed*\nError: ${error}`,
              },
            },
          ],
        };

    const messagingService = new SlackMessagingService(db);
    
    const result = await messagingService.replyToMessage(
      `deployment-${deploymentId}`,
      replyMessage
    );

    await io.logger.info("Deployment completion reply sent", { 
      deploymentId,
      success: result.success 
    });

    return result;
  },
});
```

```typescript
// For use in Trigger.dev jobs or similar background processing
import { SlackMessagingService, SlackMessageSchema } from '@buster/slack-integration';

// Example job for sending notifications
export const sendSlackNotification = defineJob({
  id: "send-slack-notification",
  name: "Send Slack Notification",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "notification.slack.send",
  }),
  run: async (payload, io) => {
    const { userId, message } = payload;
    
    // Validate payload
    const validatedMessage = SlackMessageSchema.parse(message);
    
    await io.logger.info("Sending Slack notification", { userId });

    try {
      const messagingService = new SlackMessagingService(db);
      const result = await messagingService.sendNotificationWithRetry(
        userId,
        validatedMessage,
        3 // max retries
      );

      if (result.success) {
        await io.logger.info("Slack notification sent successfully", { 
          userId,
          messageTs: result.messageTs,
          retryCount: result.retryCount
        });
      } else {
        await io.logger.error("Failed to send Slack notification", { 
          userId,
          error: result.error,
          retryCount: result.retryCount
        });
      }

      return result;
    } catch (error) {
      await io.logger.error("Slack notification job failed", { 
        error: error.message,
        userId
      });
      throw error;
    }
  },
});
```

### 6. Migration Script for Message Tracking

```sql
-- Migration: Add Message Slack Mapping Table
-- Version: 002_add_message_slack_mapping

BEGIN;

-- Create message_slack_mapping table
CREATE TABLE message_slack_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_message_id VARCHAR(255) NOT NULL,
    slack_integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,
    slack_channel_id VARCHAR(50) NOT NULL,
    slack_message_ts VARCHAR(50) NOT NULL,
    message_type VARCHAR(50),
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_message_slack_mapping_internal_integration 
  ON message_slack_mapping(internal_message_id, slack_integration_id);
CREATE INDEX idx_message_slack_mapping_internal_id ON message_slack_mapping(internal_message_id);
CREATE INDEX idx_message_slack_mapping_slack_ts ON message_slack_mapping(slack_message_ts);
CREATE INDEX idx_message_slack_mapping_integration_id ON message_slack_mapping(slack_integration_id);

COMMIT;
```

### 7. Usage Examples

```typescript
// Example: Send deployment notification with tracking
import { SlackMessagingService, SlackMessageFormatter } from '@buster/slack-integration';

async function notifyDeploymentStart(userId: string, deploymentData: any) {
  const messagingService = new SlackMessagingService(db);
  
  const message = SlackMessageFormatter.createEventNotification('deployment', {
    project: deploymentData.projectName,
    environment: deploymentData.environment,
    version: deploymentData.version,
  });

  // Send with tracking for future replies
  const result = await messagingService.sendNotificationWithTracking(
    userId, 
    message,
    `deployment-${deploymentData.deploymentId}`, // Internal message ID
    'deployment'
  );
  
  if (!result.success) {
    console.error('Failed to send deployment notification:', result.error);
  }
  
  return result;
}

// Example: Send deployment completion reply
async function notifyDeploymentComplete(deploymentId: string, success: boolean, details?: string) {
  const messagingService = new SlackMessagingService(db);
  
  const replyMessage = success
    ? SlackMessageFormatter.createSimpleNotification(
        'Deployment Complete', 
        `✅ Deployment completed successfully. ${details || ''}`,
        'info'
      )
    : SlackMessageFormatter.createSimpleNotification(
        'Deployment Failed',
        `❌ Deployment failed. ${details || ''}`,
        'error'
      );

  // Reply to original message using threading
  const result = await messagingService.replyToMessage(
    `deployment-${deploymentId}`,
    replyMessage
  );
  
  return result;
}

// Example: Alert with follow-up
async function sendAlertWithFollowup(userId: string, alertId: string, alertData: any) {
  const messagingService = new SlackMessagingService(db);
  
  // Initial alert
  const alertMessage = SlackMessageFormatter.createEventNotification('alert', {
    message: alertData.message,
    severity: alertData.severity,
    source: alertData.source,
  });

  await messagingService.sendNotificationWithTracking(
    userId,
    alertMessage,
    `alert-${alertId}`,
    'alert'
  );

  // Later, when alert is resolved...
  setTimeout(async () => {
    await messagingService.replyToMessage(
      `alert-${alertId}`,
      { text: '✅ Alert resolved automatically' }
    );
  }, 300000); // 5 minutes later
}

// Example: Get thread history for debugging
async function debugMessageThread(internalMessageId: string) {
  const messagingService = new SlackMessagingService(db);
  
  const thread = await messagingService.getMessageThread(internalMessageId);
  
  if (thread.success) {
    console.log(`Thread for ${internalMessageId}:`, thread.messages);
  } else {
    console.error('Failed to get thread:', thread.error);
  }
}
```

```typescript
// packages/slack-integration/src/utils/templates.ts
import { z } from 'zod';

export const MessageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  template: z.object({
    text: z.string().optional(),
    blocks: z.array(z.any()).optional(),
  }),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
  })),
});

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;

export class SlackMessageFormatter {
  /**
   * Create a simple text notification
   */
  static createSimpleNotification(
    title: string, 
    message: string, 
    level: 'info' | 'warning' | 'error' = 'info'
  ): { text: string } {
    const emoji = level === 'error' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
    
    return {
      text: `${emoji} *${title}*\n${message}`,
    };
  }

  /**
   * Create a rich notification with blocks
   */
  static createRichNotification(
    title: string,
    message: string,
    fields?: Array<{ title: string; value: string }>,
    actions?: Array<{ text: string; url: string; style?: 'primary' | 'danger' }>
  ): { blocks: any[] } {
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${title}*\n${message}`,
        },
      },
    ];

    // Add fields if provided
    if (fields && fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      });
    }

    // Add actions if provided
    if (actions && actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
          },
          url: action.url,
          style: action.style,
        })),
      });
    }

    return { blocks };
  }

  /**
   * Format a message using variables
   */
  static formatMessage(
    template: string,
    variables: Record<string, any>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      if (value === undefined) {
        return match; // Keep placeholder if variable not found
      }
      return String(value);
    });
  }

  /**
   * Create notification for common Buster events
   */
  static createEventNotification(
    eventType: 'deployment' | 'alert' | 'update' | 'error',
    data: Record<string, any>
  ): { text?: string; blocks?: any[] } {
    switch (eventType) {
      case 'deployment':
        return this.createRichNotification(
          '🚀 Deployment Complete',
          `Deployment of ${data.project} was successful`,
          [
            { title: 'Environment', value: data.environment || 'production' },
            { title: 'Version', value: data.version || 'latest' },
            { title: 'Duration', value: data.duration || 'N/A' },
          ],
          data.url ? [{ text: 'View Details', url: data.url, style: 'primary' }] : undefined
        );

      case 'alert':
        return this.createRichNotification(
          '⚠️ Alert Triggered',
          data.message || 'An alert has been triggered',
          [
            { title: 'Severity', value: data.severity || 'medium' },
            { title: 'Source', value: data.source || 'system' },
            { title: 'Time', value: new Date().toLocaleString() },
          ]
        );

      case 'error':
        return this.createRichNotification(
          '🚨 Error Detected',
          data.message || 'An error has occurred',
          [
            { title: 'Service', value: data.service || 'unknown' },
            { title: 'Error Code', value: data.code || 'N/A' },
            { title: 'Time', value: new Date().toLocaleString() },
          ]
        );

      case 'update':
        return this.createSimpleNotification(
          '📢 Update Available',
          data.message || 'A new update is available',
          'info'
        );

      default:
        return this.createSimpleNotification(
          '📢 Notification',
          data.message || 'You have a new notification',
          'info'
        );
    }
  }
}

// Predefined common templates
export const COMMON_TEMPLATES = {
  DEPLOYMENT_SUCCESS: {
    text: '🚀 *Deployment Successful*\nProject: {{project}}\nEnvironment: {{environment}}\nVersion: {{version}}',
  },
  ALERT_TRIGGERED: {
    text: '⚠️ *Alert: {{title}}*\n{{message}}\nSeverity: {{severity}}',
  },
  ERROR_OCCURRED: {
    text: '🚨 *Error in {{service}}*\n{{message}}\nCode: {{code}}',
  },
  SYSTEM_UPDATE: {
    text: '📢 *System Update*\n{{message}}',
  },
} as const;
```

### 8. Message Templates and Formatting

```typescript
// packages/slack-integration/src/utils/error-handling.ts
import { z } from 'zod';

export const SlackErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  warning: z.string().optional(),
});

export type SlackErrorResponse = z.infer<typeof SlackErrorResponseSchema>;

export class SlackErrorHandler {
  static handleSlackApiError(error: any): never {
    if (error.data && !error.data.ok) {
      const slackError = SlackErrorResponseSchema.parse(error.data);
      
      switch (slackError.error) {
        case 'channel_not_found':
        case 'channel_not_found':
          throw new SlackMessagingError(
            'CHANNEL_NOT_FOUND',
            'The notification channel is no longer available. Please reconfigure your channel selection.',
            { originalError: slackError.error },
            false
          );
          
        case 'not_in_channel':
          throw new SlackMessagingError(
            'NOT_IN_CHANNEL',
            'Buster bot is not a member of the notification channel. Please invite the bot or select a different channel.',
            { originalError: slackError.error },
            false
          );
          
        case 'rate_limited':
          throw new SlackMessagingError(
            'RATE_LIMITED',
            'Rate limit exceeded. Message will be retried automatically.',
            { originalError: slackError.error },
            true
          );
          
        case 'invalid_auth':
        case 'token_revoked':
          throw new SlackMessagingError(
            'INVALID_AUTH',
            'Slack integration has been disconnected. Please reconnect your workspace.',
            { originalError: slackError.error },
            false
          );
          
        case 'channel_archived':
          throw new SlackMessagingError(
            'CHANNEL_ARCHIVED',
            'The notification channel has been archived. Please select a new channel.',
            { originalError: slackError.error },
            false
          );
          
        default:
          throw new SlackMessagingError(
            'SLACK_API_ERROR',
            `Slack API error: ${slackError.error}`,
            { originalError: slackError.error },
            false
          );
      }
    }
    
    // Handle network/timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new SlackMessagingError(
        'NETWORK_ERROR',
        'Network error occurred while sending message. Will retry automatically.',
        { originalError: error.message },
        true
      );
    }
    
    // Generic error
    throw new SlackMessagingError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred while sending message',
      { originalError: error },
      false
    );
  }

  static isRetryableError(error: SlackMessagingError): boolean {
    return error.retryable;
  }

  static shouldReconnectIntegration(error: SlackMessagingError): boolean {
    return [
      'INVALID_AUTH',
      'TOKEN_REVOKED',
    ].includes(error.errorType);
  }

  static shouldReconfigureChannel(error: SlackMessagingError): boolean {
    return [
      'CHANNEL_NOT_FOUND',
      'CHANNEL_ARCHIVED',
      'NOT_IN_CHANNEL',
    ].includes(error.errorType);
  }
}

export class SlackMessagingError extends Error {
  constructor(
    public errorType: string,
    message: string,
    public details?: Record<string, any>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SlackMessagingError';
  }
}
```

### 9. Error Handling and Monitoring

```typescript
// packages/slack-integration/src/services/monitoring.ts
export class SlackMonitoringService {
  constructor(
    private db: Database
  ) {}

  /**
   * Check health of all active integrations
   */
  async checkAllIntegrations(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    details: Array<{
      userId: string;
      teamName: string;
      status: 'healthy' | 'unhealthy';
      error?: string;
    }>;
  }> {
    const integrations = await this.db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.isActive, true));

    const results = await Promise.allSettled(
      integrations.map(async (integration) => {
        const isHealthy = await this.checkIntegrationHealth(integration.id);
        return {
          userId: integration.userId,
          teamName: integration.teamName,
          status: isHealthy ? 'healthy' : 'unhealthy',
          error: !isHealthy ? 'Token validation failed' : undefined,
        };
      })
    );

    const details = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    const healthy = details.filter(d => d.status === 'healthy').length;
    const unhealthy = details.filter(d => d.status === 'unhealthy').length;

    return {
      total: integrations.length,
      healthy,
      unhealthy,
      details,
    };
  }

  /**
   * Get messaging statistics
   */
  async getMessagingStats(timeframe: { start: Date; end: Date }): Promise<{
    totalAttempts: number;
    successful: number;
    failed: number;
    retryRate: number;
    commonErrors: Array<{ error: string; count: number }>;
  }> {
    // This would require adding a message log table if you want detailed stats
    // For now, return placeholder implementation
    return {
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      retryRate: 0,
      commonErrors: [],
    };
  }

  private async checkIntegrationHealth(integrationId: string): Promise<boolean> {
    try {
      const tokenManager = new SlackTokenManager();
      const accessToken = await tokenManager.getToken(integrationId);
      
      if (!accessToken) {
        return false;
      }

      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      return false;
    }
  }
}
```

## Usage Examples

### 8. Common Usage Patterns

```typescript
// Example: Send deployment notification
import { SlackMessagingService, SlackMessageFormatter } from '@buster/slack-integration';

async function notifyDeployment(userId: string, deploymentData: any) {
  const messagingService = new SlackMessagingService(db, supabase);
  
  const message = SlackMessageFormatter.createEventNotification('deployment', {
    project: deploymentData.projectName,
    environment: deploymentData.environment,
    version: deploymentData.version,
    duration: deploymentData.duration,
    url: deploymentData.detailsUrl,
  });

  const result = await messagingService.sendNotificationWithRetry(userId, message);
  
  if (!result.success) {
    console.error('Failed to send deployment notification:', result.error);
  }
}

// Example: Send simple alert
async function sendAlert(userId: string, alertMessage: string) {
  const messagingService = new SlackMessagingService(db, supabase);
  
  const message = SlackMessageFormatter.createSimpleNotification(
    'System Alert',
    alertMessage,
    'warning'
  );

  await messagingService.sendNotification(userId, message);
}

// Example: Validate before sending
async function sendNotificationSafely(userId: string, message: any) {
  const messagingService = new SlackMessagingService(db, supabase);
  
  // Check if user can receive notifications
  const validation = await messagingService.validateMessagingCapability(userId);
  
  if (!validation.canSend) {
    console.warn(`Cannot send notification to user ${userId}: ${validation.error}`);
    return false;
  }

  const result = await messagingService.sendNotification(userId, message);
  return result.success;
}
```

## Testing Strategy

### 9. Unit Tests

```typescript
// packages/slack-integration/src/services/__tests__/messaging.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlackMessagingService } from '../messaging';

describe('SlackMessagingService', () => {
  let messagingService: SlackMessagingService;
  let mockDb: any;
  let mockSupabase: any;
  let mockSlackClient: any;

  beforeEach(() => {
    mockSlackClient = {
      chat: {
        postMessage: vi.fn(),
      },
      auth: {
        test: vi.fn(),
      },
    };

    mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'integration-1',
              notificationChannelId: 'C1234567890',
              notificationChannelName: 'general',
            }]),
          }),
        }),
      }),
    };

    mockSupabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { secret: 'mock-access-token' },
        error: null,
      }),
    };

    messagingService = new SlackMessagingService(mockDb);
    (messagingService as any).slackClient = mockSlackClient;
  });

  describe('sendNotification', () => {
    it('should send message successfully', async () => {
      mockSlackClient.chat.postMessage.mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      });

      const result = await messagingService.sendNotification(
        'user-123',
        { text: 'Test message' }
      );

      expect(result.success).toBe(true);
      expect(result.messageTs).toBe('1234567890.123456');
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        token: 'mock-access-token',
        channel: 'C1234567890',
        text: 'Test message',
      });
    });

    it('should handle missing integration', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // No integration found
          }),
        }),
      });

      const result = await messagingService.sendNotification(
        'user-123',
        { text: 'Test message' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No Slack integration found');
    });

    it('should handle missing notification channel', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'integration-1',
              notificationChannelId: null, // No channel configured
            }]),
          }),
        }),
      });

      const result = await messagingService.sendNotification(
        'user-123',
        { text: 'Test message' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No notification channel configured');
    });
  });

  describe('validateMessagingCapability', () => {
    it('should validate healthy integration', async () => {
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const result = await messagingService.validateMessagingCapability('user-123');

      expect(result.canSend).toBe(true);
      expect(result.integrationActive).toBe(true);
      expect(result.channelConfigured).toBe(true);
    });
  });
});
```

## Success Metrics & Monitoring

### 11. Key Performance Indicators

- **Message Delivery Rate**: % of messages successfully delivered to Slack
- **Reply Success Rate**: % of replies successfully threaded to original messages  
- **Channel Configuration Rate**: % of connected users who have configured a notification channel
- **Integration Health**: % of integrations that remain functional over time
- **Thread Engagement**: Average number of replies per tracked message
- **Error Rate by Type**: Breakdown of delivery failures (auth, channel, network, threading, etc.)
- **User Engagement**: Number of notifications sent per active integration
- **Response Time**: Average time to deliver messages to Slack

### 12. Monitoring Queries

```typescript
// Example monitoring service usage with message tracking
export class SlackDashboardService {
  async getDashboardStats(): Promise<{
    totalIntegrations: number;
    configuredChannels: number;
    healthyIntegrations: number;
    messageActivity: {
      messagesLast24h: number;
      repliesLast24h: number;
      threadsLast24h: number;
    };
  }> {
    const monitoringService = new SlackMonitoringService(this.db);
    
    // Get integration counts
    const integrations = await this.db
      .select()
      .from(slackIntegrations)
      .where(eq(slackIntegrations.isActive, true));

    const configuredChannels = integrations.filter(
      i => i.notificationChannelId
    ).length;

    // Check health
    const healthCheck = await monitoringService.checkAllIntegrations();

    // Get message activity
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const messageCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(messageSlackMapping)
      .where(gte(messageSlackMapping.sentAt, last24h));

    // Count threads (messages with replies)
    const threadCount = await this.db
      .select({ count: sql<number>`count(distinct internal_message_id)` })
      .from(messageSlackMapping)
      .where(gte(messageSlackMapping.sentAt, last24h));

    return {
      totalIntegrations: integrations.length,
      configuredChannels,
      healthyIntegrations: healthCheck.healthy,
      messageActivity: {
        messagesLast24h: messageCount[0]?.count || 0,
        repliesLast24h: 0, // Would need additional tracking for this
        threadsLast24h: threadCount[0]?.count || 0,
      },
    };
  }

  async getMessageTypeBreakdown(timeframe: { start: Date; end: Date }) {
    const results = await this.db
      .select({
        messageType: messageSlackMapping.messageType,
        count: sql<number>`count(*)`,
      })
      .from(messageSlackMapping)
      .where(
        and(
          gte(messageSlackMapping.sentAt, timeframe.start),
          lte(messageSlackMapping.sentAt, timeframe.end)
        )
      )
      .groupBy(messageSlackMapping.messageType);

    return results;
  }
}
```

## Security & Compliance

### 13. Security Checklist

- ✅ **Message Content Validation**: All messages validated with Zod schemas
- ✅ **Channel Access Control**: Verify bot has access before sending
- ✅ **Token Security**: Access tokens stored securely via your token storage implementation
- ✅ **Error Sanitization**: No sensitive data exposed in error messages
- ✅ **Integration Ownership**: Users can only configure their own integration
- ✅ **Message Ownership**: Users can only view threads for their own messages
- ✅ **Input Sanitization**: Prevent injection attacks in message content
- ✅ **Public Channels Only**: Restrict channel selection to public channels
- ✅ **Single Channel**: Limit to one notification channel per user
- ✅ **Thread Security**: Reply functionality only works with tracked messages

## Rollback Plan

1. **Disable messaging endpoints** via feature flag
2. **Stop background notification jobs** immediately
3. **Preserve channel configurations** and message mappings in database
4. **Notify users** of temporary service interruption
5. **Restore functionality** by re-enabling endpoints
6. **Data recovery** from database backups if corruption occurs

This enhanced messaging PRD provides a complete solution for sending notifications to a single configured Slack channel per user, with full threading/reply capabilities for follow-up messages, proper error handling, monitoring, and security considerations.
  },
});

// Example job for bulk notifications
export const sendBulkSlackNotifications = defineJob({
  id: "send-bulk-slack-notifications", 
  name: "Send Bulk Slack Notifications",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "notification.slack.bulk",
  }),
  run: async (payload, io) => {
    const { notifications } = payload; // Array of { userId, message }
    
    await io.logger.info("Sending bulk Slack notifications", { 
      count: notifications.length 
    });

    try {
      const messagingService = new SlackMessagingService(db);
      const result = await messagingService.sendBulkNotifications(
        notifications,
        { concurrency: 5, continueOnError: true }
      );

      await io.logger.info("Bulk Slack notifications completed", { 
        successful: result.totalSent,
        failed: result.totalFailed 
      });

      return result;
    } catch (error) {
      await io.logger.error("Bulk Slack notification job failed", { 
        error: error.message 
      });
      throw error;
    }