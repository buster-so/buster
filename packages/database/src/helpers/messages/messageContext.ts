import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { chats, messages } from '../../schema';

// Zod schemas for validation
export const MessageContextInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

export const MessageContextOutputSchema = z.object({
  messageId: z.string(),
  userId: z.string(),
  chatId: z.string(),
  organizationId: z.string(),
  requestMessage: z.string(),
});

export type MessageContextInput = z.infer<typeof MessageContextInputSchema>;
export type MessageContextOutput = z.infer<typeof MessageContextOutputSchema>;

/**
 * Get message context for runtime setup
 * Returns the essential IDs needed for analyst workflow
 */
export async function getMessageContext(input: MessageContextInput): Promise<MessageContextOutput> {
  try {
    // Validate input
    const validatedInput = MessageContextInputSchema.parse(input);

    // Database query with error handling
    let result: Array<{
      messageId: string;
      requestMessage: string | null;
      chatId: string;
      userId: string;
      organizationId: string | null;
    }>;
    try {
      result = await db
        .select({
          messageId: messages.id,
          requestMessage: messages.requestMessage,
          chatId: messages.chatId,
          userId: messages.createdBy,
          organizationId: chats.organizationId,
        })
        .from(messages)
        .leftJoin(chats, eq(messages.chatId, chats.id))
        .where(
          and(
            eq(messages.id, validatedInput.messageId),
            isNull(messages.deletedAt),
            isNull(chats.deletedAt)
          )
        )
        .limit(1);
    } catch (dbError) {
      throw new Error(
        `Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`
      );
    }

    const row = result[0];
    if (!row) {
      throw new Error('Message not found or has been deleted');
    }

    if (!row.requestMessage) {
      throw new Error('Message is missing required prompt content');
    }

    if (!row.organizationId) {
      throw new Error('Message chat context or organization not found');
    }

    const output = {
      messageId: row.messageId,
      userId: row.userId,
      chatId: row.chatId,
      organizationId: row.organizationId,
      requestMessage: row.requestMessage,
    };

    // Validate output with error handling
    try {
      return MessageContextOutputSchema.parse(output);
    } catch (validationError) {
      throw new Error(
        `Output validation failed: ${validationError instanceof Error ? validationError.message : 'Invalid output format'}`
      );
    }
  } catch (error) {
    // Handle Zod input validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }

    // Re-throw other errors with context
    throw error instanceof Error
      ? error
      : new Error(`Failed to get message context: ${String(error)}`);
  }
}
