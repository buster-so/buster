import { z } from 'zod';

/**
 * Message tracking data schema
 */
export const MessageTrackingDataSchema = z.object({
  internalMessageId: z.string(),
  slackChannelId: z.string(),
  slackMessageTs: z.string(),
  messageType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sentAt: z.date(),
});

export type MessageTrackingData = z.infer<typeof MessageTrackingDataSchema>;

/**
 * Interface for message tracking storage implementations.
 * Consuming applications must implement this interface
 * to track sent messages for threading/reply functionality.
 */
export interface ISlackMessageTracking {
  /**
   * Store a message tracking record
   * @param trackingData The message tracking data
   */
  storeMessageTracking(trackingData: MessageTrackingData): Promise<void>;

  /**
   * Retrieve message tracking data by internal message ID
   * @param internalMessageId Your application's internal message ID
   * @returns The tracking data or null if not found
   */
  getMessageTracking(internalMessageId: string): Promise<MessageTrackingData | null>;

  /**
   * Delete message tracking data
   * @param internalMessageId Your application's internal message ID
   */
  deleteMessageTracking(internalMessageId: string): Promise<void>;

  /**
   * Get all messages sent to a specific channel
   * @param slackChannelId The Slack channel ID
   * @param options Optional filters
   * @returns List of tracking data
   */
  getChannelMessages(
    slackChannelId: string,
    options?: {
      messageType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<MessageTrackingData[]>;

  /**
   * Check if a message has been tracked
   * @param internalMessageId Your application's internal message ID
   */
  hasMessageTracking(internalMessageId: string): Promise<boolean>;
}
