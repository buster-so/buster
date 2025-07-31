import { and, eq, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { slackIntegrations } from '../../schema';

// Type inference from schema
export type SlackIntegration = InferSelectModel<typeof slackIntegrations>;

/**
 * Input schema for getting active Slack integration
 */
export const GetActiveSlackIntegrationInputSchema = z.object({
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type GetActiveSlackIntegrationInput = z.infer<typeof GetActiveSlackIntegrationInputSchema>;

/**
 * Get active Slack integration for an organization
 * Returns the integration only if it has a default channel configured
 */
export async function getActiveSlackIntegration(
  params: GetActiveSlackIntegrationInput
): Promise<SlackIntegration | null> {
  try {
    const { organizationId } = GetActiveSlackIntegrationInputSchema.parse(params);

    const result = await db
      .select()
      .from(slackIntegrations)
      .where(
        and(
          eq(slackIntegrations.organizationId, organizationId),
          eq(slackIntegrations.status, 'active'),
          isNull(slackIntegrations.deletedAt)
        )
      )
      .limit(1);

    if (!result.length || !result[0]) {
      return null;
    }

    const integration = result[0];

    // Only return if default channel is configured
    if (!integration.defaultChannel || Object.keys(integration.defaultChannel).length === 0) {
      return null;
    }

    return integration;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid input for getActiveSlackIntegration: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }

    console.error('Error fetching active Slack integration:', {
      organizationId: params.organizationId,
      error: error instanceof Error ? error.message : error,
    });

    throw error;
  }
}
