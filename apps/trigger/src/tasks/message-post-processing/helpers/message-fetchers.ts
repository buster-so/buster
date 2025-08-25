import { getPermissionedDatasets } from '@buster/access-controls';
import {
  and,
  chats,
  dbInitialized,
  eq,
  getChatConversationHistory,
  isNotNull,
  isNull,
  lte,
  messages,
  users,
} from '@buster/database';
import type { CoreMessage } from 'ai';
import {
  DataFetchError,
  type MessageContext,
  MessageNotFoundError,
  type PostProcessingResult,
} from '../types';

/**
 * Fetch current message with user and chat info
 */
export async function fetchMessageWithContext(messageId: string): Promise<MessageContext> {
  const db = await dbInitialized;

  try {
    const result = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        createdBy: messages.createdBy,
        createdAt: messages.createdAt,
        rawLlmMessages: messages.rawLlmMessages,
        userName: users.name,
        userEmail: users.email,
        organizationId: chats.organizationId,
      })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .leftJoin(users, eq(messages.createdBy, users.id))
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);

    const messageData = result[0];
    if (!messageData) {
      throw new MessageNotFoundError(messageId);
    }

    // Get the complete conversation history using the fixed helper
    // This ensures we get the most recent completed message with valid rawLlmMessages
    let conversationHistory: CoreMessage[] = [];
    try {
      conversationHistory = await getChatConversationHistory({ messageId });
    } catch (_error) {
      // If we can't get conversation history, fall back to the current message's rawLlmMessages
      // This handles edge cases where there are no completed messages yet
      if (messageData.rawLlmMessages && Array.isArray(messageData.rawLlmMessages)) {
        conversationHistory = messageData.rawLlmMessages as CoreMessage[];
      }
    }

    return {
      id: messageData.id,
      chatId: messageData.chatId,
      createdBy: messageData.createdBy,
      createdAt: new Date(messageData.createdAt),
      rawLlmMessages: conversationHistory,
      userName: messageData.userName ?? messageData.userEmail ?? 'Unknown',
      organizationId: messageData.organizationId,
    };
  } catch (error) {
    if (error instanceof MessageNotFoundError) {
      throw error;
    }
    throw new DataFetchError(
      `Failed to fetch message context for ${messageId}`,
      error instanceof Error ? { cause: error } : undefined
    );
  }
}

/**
 * Fetch previous post-processing results
 */
export async function fetchPreviousPostProcessingMessages(
  chatId: string,
  beforeTimestamp: Date
): Promise<PostProcessingResult[]> {
  const db = await dbInitialized;

  try {
    const result = await db
      .select({
        postProcessingMessage: messages.postProcessingMessage,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chatId),
          isNotNull(messages.postProcessingMessage),
          isNull(messages.deletedAt),
          lte(messages.createdAt, beforeTimestamp.toISOString())
        )
      )
      .orderBy(messages.createdAt);

    return result.map((msg) => ({
      postProcessingMessage: msg.postProcessingMessage as Record<string, unknown>,
      createdAt: new Date(msg.createdAt),
    }));
  } catch (error) {
    throw new DataFetchError(
      `Failed to fetch previous post-processing messages for chat ${chatId}`,
      error instanceof Error ? { cause: error } : undefined
    );
  }
}

/**
 * Fetch user's permissioned datasets
 */
export async function fetchUserDatasets(userId: string) {
  try {
    // Using the existing access control function
    const datasetResults = await getPermissionedDatasets({ userId, page: 0, pageSize: 1000 });
    return datasetResults;
  } catch (error) {
    throw new DataFetchError(
      `Failed to fetch datasets for user ${userId}`,
      error instanceof Error ? { cause: error } : undefined
    );
  }
}
