import { z } from 'zod';
import { db } from '../../connection';
import { messages, chats } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';

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
  // Validate input
  const validatedInput = MessageContextInputSchema.parse(input);
  
  const result = await db
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

  // Validate output
  return MessageContextOutputSchema.parse(output);
}