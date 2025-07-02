import { db, messages } from '@buster/database';
import type { User } from '@buster/database';
import { eq } from 'drizzle-orm';
import type { ChatCreateHandlerRequest, ChatWithMessages } from '@buster/server-shared/chats';
import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';
import { handleExistingChat, handleNewChat } from './chat-helpers';

/**
 * Initialize a chat - create new or add message to existing
 */
export async function initializeChat(
  request: ChatCreateHandlerRequest,
  user: User,
  organizationId: string
): Promise<{
  chatId: string;
  messageId: string;
  chat: ChatWithMessages;
}> {
  // Always generate a new ID for the new message
  const messageId = crypto.randomUUID();
  // Treat provided message_id as the redo point
  const redoFromMessageId = request.message_id;
  const userId = user.id;

  try {
    // If message_id is provided but not chat_id, get the chat_id from the message
    let chatId = request.chat_id;
    if (redoFromMessageId && !chatId) {
      const messageDetails = await db
        .select({ chatId: messages.chatId })
        .from(messages)
        .where(eq(messages.id, redoFromMessageId))
        .limit(1);
      
      if (!messageDetails.length || !messageDetails[0]) {
        throw new ChatError(
          ChatErrorCode.INVALID_REQUEST,
          'Message not found',
          404
        );
      }
      
      chatId = messageDetails[0].chatId;
    }

    if (chatId) {
      return handleExistingChat(chatId, messageId, request.prompt, user, redoFromMessageId);
    }

    const title = '';
    return handleNewChat({
      title,
      messageId,
      prompt: request.prompt,
      user,
      organizationId,
    });
  } catch (error) {
    // Log detailed error context
    console.error('Failed to initialize chat:', {
      userId,
      organizationId,
      chatId: request.chat_id,
      hasPrompt: !!request.prompt,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
    });

    // Re-throw ChatError instances
    if (error instanceof ChatError) {
      throw error;
    }

    // Wrap database errors
    throw new ChatError(
      ChatErrorCode.DATABASE_ERROR,
      'Failed to initialize chat due to database error',
      500,
      {
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
