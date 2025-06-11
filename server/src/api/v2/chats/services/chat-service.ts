import type { ChatCreateHandlerRequest, ChatMessage, ChatWithMessages } from '@/types';
import { ChatError, ChatErrorCode } from '@/types/chat-errors.types';
import {
  chats,
  checkChatPermission,
  createMessage,
  db,
  generateAssetMessages,
  getChatWithDetails,
  getMessagesForChat,
  messages,
} from '@buster/database';
import type { Chat, Message } from '@buster/database/src/helpers/chats';
import type { User } from '@supabase/supabase-js';

/**
 * Build a ChatWithMessages object from database entities
 */
export function buildChatWithMessages(
  chat: Chat,
  messages: Message[],
  _user: User,
  creatorDetails?: { name: string | null; avatarUrl: string | null } | null,
  isFavorited = false
): ChatWithMessages {
  const messageMap: Record<string, ChatMessage> = {};
  const messageIds: string[] = [];

  // Convert database messages to ChatMessage format
  for (const msg of messages) {
    const chatMessage: ChatMessage = {
      id: msg.id,
      role: msg.requestMessage ? 'user' : 'assistant',
      created_at: msg.createdAt,
      updated_at: msg.updatedAt,
      request_message: msg.requestMessage
        ? {
            request: msg.requestMessage,
            sender_id: msg.createdBy,
            sender_name: creatorDetails?.name || 'Unknown User',
            sender_avatar: creatorDetails?.avatarUrl || undefined,
          }
        : undefined,
      //TODO - ask Dallin if this is correct?
      response_message: (msg.responseMessages as { content: string })?.content || undefined,
      reasoning_message: (msg.reasoning as { content: string })?.content || undefined,
      final_reasoning_message: msg.finalReasoningMessage || undefined,
      feedback: msg.feedback ? (msg.feedback as 'positive' | 'negative') : undefined,
      files: undefined, // TODO: Load files from messagesToFiles
      is_completed: msg.isCompleted || false, // Always false for new messages, trigger job sets to true
    };

    messageIds.push(msg.id);
    messageMap[msg.id] = chatMessage;
  }

  return {
    id: chat.id,
    title: chat.title,
    is_favorited: isFavorited,
    message_ids: messageIds,
    messages: messageMap,
    created_at: chat.createdAt,
    updated_at: chat.updatedAt,
    created_by: chat.createdBy,
    created_by_id: chat.createdBy,
    created_by_name: creatorDetails?.name || 'Unknown User',
    created_by_avatar: creatorDetails?.avatarUrl || undefined,
    // Sharing fields - TODO: implement proper sharing logic
    individual_permissions: undefined,
    publicly_accessible: chat.publiclyAccessible || false,
    public_expiry_date: chat.publicExpiryDate || undefined,
    public_enabled_by: chat.publiclyEnabledBy || undefined,
    public_password: undefined, // Don't expose password
    permission: 'owner', // TODO: Implement proper permission checking
  };
}

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
  const messageId = request.message_id || crypto.randomUUID();

  try {
    if (request.chat_id) {
      // Existing chat - check if it exists first, then check permission
      const chatDetails = await getChatWithDetails({
        chatId: request.chat_id,
        userId: user.id,
      });

      if (!chatDetails) {
        throw new ChatError(ChatErrorCode.CHAT_NOT_FOUND, 'Chat not found', 404);
      }

      const hasPermission = await checkChatPermission(request.chat_id, user.id);
      if (!hasPermission) {
        throw new ChatError(
          ChatErrorCode.PERMISSION_DENIED,
          'You do not have permission to access this chat',
          403
        );
      }

      // Create new message and fetch existing messages concurrently
      const [newMessage, existingMessages] = await Promise.all([
        request.prompt
          ? createMessage({
              chatId: request.chat_id,
              content: request.prompt,
              userId: user.id,
              messageId,
            })
          : Promise.resolve(null),
        getMessagesForChat(request.chat_id),
      ]);

      // Combine messages
      const allMessages = newMessage ? [...existingMessages, newMessage] : existingMessages;

      // Build chat with messages
      const chatWithMessages = buildChatWithMessages(
        chatDetails.chat,
        allMessages,
        user,
        chatDetails.user
          ? {
              name: chatDetails.user.name,
              avatarUrl: chatDetails.user.avatarUrl,
            }
          : null,
        chatDetails.isFavorited
      );

      return {
        chatId: request.chat_id,
        messageId,
        chat: chatWithMessages,
      };
    }
    // New chat - use transaction for atomicity
    const title = request.prompt || 'New Chat';

    const result = await db.transaction(async (tx) => {
      // Create chat
      const [newChat] = await tx
        .insert(chats)
        .values({
          title,
          organizationId,
          createdBy: user.id,
          updatedBy: user.id,
          publiclyAccessible: false,
        })
        .returning();

      if (!newChat) {
        throw new Error('Failed to create chat');
      }

      // Create initial message if prompt provided
      let message: Message | null = null;
      if (request.prompt) {
        const [newMessage] = await tx
          .insert(messages)
          .values({
            id: messageId,
            chatId: newChat.id,
            createdBy: user.id,
            requestMessage: request.prompt,
            responseMessages: {},
            reasoning: {},
            title: request.prompt,
            rawLlmMessages: {},
            isCompleted: false,
          })
          .returning();

        if (!newMessage) {
          throw new Error('Failed to create message');
        }
        message = newMessage;
      }

      return { chat: newChat, message };
    });

    // Build chat with messages
    const chatWithMessages = buildChatWithMessages(
      result.chat,
      result.message ? [result.message] : [],
      user,
      {
        name: user.user_metadata?.name || user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      false
    );

    return {
      chatId: result.chat.id,
      messageId,
      chat: chatWithMessages,
    };
  } catch (error) {
    // Log detailed error context
    console.error('Failed to initialize chat:', {
      userId: user.id,
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
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Handle asset-based chat initialization
 */
export async function handleAssetChat(
  chatId: string,
  _messageId: string,
  assetId: string,
  assetType: 'metric_file' | 'dashboard_file',
  userId: string,
  chat: ChatWithMessages
): Promise<ChatWithMessages> {
  try {
    // Generate asset messages
    const assetMessages = await generateAssetMessages({
      assetId,
      assetType,
      userId,
      chatId,
    });

    if (!assetMessages || assetMessages.length === 0) {
      console.warn('No asset messages generated', {
        assetId,
        assetType,
        userId,
        chatId,
      });
      return chat;
    }

    // Convert and add to chat
    for (const msg of assetMessages) {
      const chatMessage: ChatMessage = {
        id: msg.id,
        role: msg.requestMessage ? 'user' : 'assistant',
        created_at: msg.createdAt,
        updated_at: msg.updatedAt,
        request_message: msg.requestMessage
          ? {
              request: msg.requestMessage,
              sender_id: msg.createdBy,
              sender_name: chat.created_by_name,
              sender_avatar: chat.created_by_avatar,
            }
          : undefined,
        //TODO - ask Dallin if this is correct?
        response_message: (msg.responseMessages as { content: string })?.content || undefined,
        feedback: undefined,
        is_completed: false,
      };

      chat.message_ids.push(msg.id);
      chat.messages[msg.id] = chatMessage;
    }

    return chat;
  } catch (error) {
    console.error('Failed to handle asset chat:', {
      chatId,
      assetId,
      assetType,
      userId,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
    });

    // Don't fail the entire request, just return the chat without asset messages
    return chat;
  }
}
