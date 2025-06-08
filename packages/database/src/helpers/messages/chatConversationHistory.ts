import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { CoreMessage } from 'ai';

// Zod schemas for validation
export const ChatConversationHistoryInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

export const ChatConversationHistoryOutputSchema = z.array(z.any()); // CoreMessage[] but allowing any for flexibility

export type ChatConversationHistoryInput = z.infer<typeof ChatConversationHistoryInputSchema>;
export type ChatConversationHistoryOutput = z.infer<typeof ChatConversationHistoryOutputSchema>;

/**
 * Get complete conversation history for a chat from any message in that chat
 * Finds the chat from the given messageId, then loads ALL rawLlmMessages from ALL messages in that chat
 */
export async function getChatConversationHistory(input: ChatConversationHistoryInput): Promise<ChatConversationHistoryOutput> {
  // Validate input
  const validatedInput = ChatConversationHistoryInputSchema.parse(input);
  
  // First, get the chatId from the given messageId
  const messageResult = await db
    .select({
      chatId: messages.chatId,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, validatedInput.messageId),
        isNull(messages.deletedAt)
      )
    )
    .limit(1);
  
  const messageRow = messageResult[0];
  if (!messageRow) {
    throw new Error('Message not found or has been deleted');
  }
  
  // Get all messages for this chat, ordered by creation time
  const chatMessages = await db
    .select({
      id: messages.id,
      rawLlmMessages: messages.rawLlmMessages,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, messageRow.chatId),
        isNull(messages.deletedAt)
      )
    )
    .orderBy(messages.createdAt);
  
  // Combine all rawLlmMessages into a single conversation history
  const conversationHistory: CoreMessage[] = [];
  
  for (const message of chatMessages) {
    if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
      // Add all messages from this message's rawLlmMessages
      conversationHistory.push(...(message.rawLlmMessages as CoreMessage[]));
    }
  }
  
  // Validate output
  return ChatConversationHistoryOutputSchema.parse(conversationHistory);
}