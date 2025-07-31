import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { slackMessageTracking } from '../../schema';

// Type inference from schema
export type SlackMessageTracking = InferSelectModel<typeof slackMessageTracking>;

/**
 * Input schema for creating Slack message tracking
 */
export const CreateSlackMessageTrackingInputSchema = z.object({
  integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  internalMessageId: z.string().uuid('Internal message ID must be a valid UUID'),
  slackChannelId: z.string().min(1, 'Slack channel ID is required'),
  slackMessageTs: z.string().min(1, 'Slack message timestamp is required'),
  slackThreadTs: z.string().optional(),
  messageType: z.string().min(1, 'Message type is required'),
  content: z.string().optional(),
  senderInfo: z
    .object({
      sentBy: z.string(),
      organizationId: z.string().uuid(),
      organizationName: z.string().optional(),
    })
    .optional(),
  sentAt: z.string().datetime().optional(),
});

export type CreateSlackMessageTrackingInput = z.infer<typeof CreateSlackMessageTrackingInputSchema>;

/**
 * Create a Slack message tracking record
 * Used to track messages sent to Slack for schema sync notifications
 */
export async function createSlackMessageTracking(
  params: CreateSlackMessageTrackingInput
): Promise<SlackMessageTracking> {
  try {
    const validated = CreateSlackMessageTrackingInputSchema.parse(params);

    const [created] = await db
      .insert(slackMessageTracking)
      .values({
        integrationId: validated.integrationId,
        internalMessageId: validated.internalMessageId,
        slackChannelId: validated.slackChannelId,
        slackMessageTs: validated.slackMessageTs,
        slackThreadTs: validated.slackThreadTs || null,
        messageType: validated.messageType,
        content: validated.content || null,
        senderInfo: validated.senderInfo || null,
        sentAt: validated.sentAt || new Date().toISOString(),
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create Slack message tracking');
    }

    return created;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid input for createSlackMessageTracking: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }

    console.error('Error creating Slack message tracking:', {
      params,
      error: error instanceof Error ? error.message : error,
    });

    throw error;
  }
}
