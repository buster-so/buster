import type { CoreMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';

// Helper function to get chatId from messageId
async function getChatIdFromMessage(messageId: string): Promise<string> {
  let messageResult: Array<{ chatId: string }>;
  try {
    messageResult = await db
      .select({
        chatId: messages.chatId,
      })
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);
  } catch (dbError) {
    throw new Error(
      `Database query failed while finding message: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`
    );
  }

  const messageRow = messageResult[0];
  if (!messageRow) {
    throw new Error('Message not found or has been deleted');
  }

  return messageRow.chatId;
}

// Helper function to get all messages for a chat
async function getAllMessagesForChat(chatId: string): Promise<
  Array<{
    id: string;
    rawLlmMessages: unknown;
    createdAt: string;
  }>
> {
  let chatMessages: Array<{
    id: string;
    rawLlmMessages: unknown;
    createdAt: string;
  }>;
  try {
    chatMessages = await db
      .select({
        id: messages.id,
        rawLlmMessages: messages.rawLlmMessages,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
      .orderBy(messages.createdAt);
  } catch (dbError) {
    throw new Error(
      `Database query failed while loading chat messages: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`
    );
  }

  return chatMessages;
}

// Helper function to combine raw LLM messages
function combineRawLlmMessages(chatMessages: Array<{ rawLlmMessages: unknown }>): CoreMessage[] {
  const conversationHistory: CoreMessage[] = [];

  try {
    for (const message of chatMessages) {
      if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
        conversationHistory.push(...(message.rawLlmMessages as CoreMessage[]));
      }
    }
  } catch (processingError) {
    throw new Error(
      `Failed to process conversation history: ${processingError instanceof Error ? processingError.message : 'Unknown processing error'}`
    );
  }

  return conversationHistory;
}

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
export async function getChatConversationHistory(
  input: ChatConversationHistoryInput
): Promise<ChatConversationHistoryOutput> {
  try {
    // Validate input
    const validatedInput = ChatConversationHistoryInputSchema.parse(input);

    // Get chatId from messageId
    const chatId = await getChatIdFromMessage(validatedInput.messageId);

    // Get all messages for this chat
    const chatMessages = await getAllMessagesForChat(chatId);

    // Combine all rawLlmMessages into conversation history
    const conversationHistory = combineRawLlmMessages(chatMessages);

    // Validate output
    try {
      return ChatConversationHistoryOutputSchema.parse(conversationHistory);
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
      : new Error(`Failed to get chat conversation history: ${String(error)}`);
  }
}
