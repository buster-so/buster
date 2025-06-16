import {
  type User,
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
import type {
  ChatCreateHandlerRequest,
  ChatMessage,
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
  ChatWithMessages,
} from '../../../../types/chat-types';
import {
  ChatError,
  ChatErrorCode,
  ReasoningMessageSchema,
  ResponseMessageSchema,
} from '../../../../types/chat-types';

const buildResponseMessages = (responseMessages: unknown): ChatMessage['response_messages'] => {
  if (!responseMessages) {
    return {};
  }

  if (typeof responseMessages === 'string') {
    const parsed: unknown[] = JSON.parse(responseMessages);
    const validated: ChatMessageResponseMessage[] = parsed.map((item) =>
      ResponseMessageSchema.parse(item)
    );

    return validated.reduce<Record<string, ChatMessageResponseMessage>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  return {};
};

const buildReasoningMessages = (reasoningMessages: unknown): ChatMessage['reasoning_messages'] => {
  if (!reasoningMessages) {
    return {};
  }

  if (typeof reasoningMessages === 'string') {
    const parsed: unknown[] = JSON.parse(reasoningMessages);
    const validated: ChatMessageReasoningMessage[] = parsed.map((item) =>
      ReasoningMessageSchema.parse(item)
    );
    return validated.reduce<Record<string, ChatMessageReasoningMessage>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  return {};
};

/**
 * Build a ChatWithMessages object from database entities
 */
export function buildChatWithMessages(
  chat: Chat,
  messages: Message[],
  user: User | null,
  isFavorited = false
): ChatWithMessages {
  const messageMap: Record<string, ChatMessage> = {};
  const messageIds: string[] = [];

  // Convert database messages to ChatMessage format
  for (const msg of messages) {
    const responseMessages = buildResponseMessages(msg.responseMessages);
    const reasoningMessages = buildReasoningMessages(msg.reasoning);
    const chatMessage: ChatMessage = {
      id: msg.id,
      created_at: msg.createdAt,
      updated_at: msg.updatedAt,
      request_message: {
        request: msg.requestMessage || '',
        sender_id: msg.createdBy,
        sender_name: user?.name || 'Unknown User',
        sender_avatar: user?.avatarUrl || undefined,
      },
      response_messages: responseMessages,
      response_message_ids: Object.keys(responseMessages),
      reasoning_message_ids: Object.keys(reasoningMessages),
      reasoning_messages: reasoningMessages,
      final_reasoning_message: msg.finalReasoningMessage || null,
      feedback: msg.feedback ? (msg.feedback as 'negative') : null,
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
    created_by_name: user?.name || 'Unknown User',
    created_by_avatar: user?.avatarUrl || null,
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
 * Handle initialization of an existing chat
 */
export async function handleExistingChat(
  chatId: string,
  messageId: string,
  prompt: string | undefined,
  user: User
): Promise<{
  chatId: string;
  messageId: string;
  chat: ChatWithMessages;
}> {
  // Check if chat exists and get details
  const chatDetails = await getChatWithDetails({
    chatId,
    userId: user.id,
  });

  if (!chatDetails) {
    throw new ChatError(ChatErrorCode.CHAT_NOT_FOUND, 'Chat not found', 404);
  }

  const hasPermission = await checkChatPermission(chatId, user.id);
  if (!hasPermission) {
    throw new ChatError(
      ChatErrorCode.PERMISSION_DENIED,
      'You do not have permission to access this chat',
      403
    );
  }

  // Create new message and fetch existing messages concurrently
  const [newMessage, existingMessages] = await Promise.all([
    prompt
      ? createMessage({
          chatId,
          content: prompt,
          userId: user.id,
          messageId,
        })
      : Promise.resolve(null),
    getMessagesForChat(chatId),
  ]);

  // Combine messages
  const allMessages = newMessage ? [...existingMessages, newMessage] : existingMessages;

  // Build chat with messages
  const chatWithMessages = buildChatWithMessages(
    chatDetails.chat,
    allMessages,
    chatDetails.user,
    chatDetails.isFavorited
  );

  return {
    chatId,
    messageId,
    chat: chatWithMessages,
  };
}

/**
 * Handle initialization of a new chat
 */
export async function handleNewChat({
  title,
  messageId,
  prompt,
  user,
  organizationId,
}: {
  title: string;
  messageId: string;
  prompt: string | undefined;
  user: User;
  organizationId: string;
}): Promise<{
  chatId: string;
  messageId: string;
  chat: ChatWithMessages;
}> {
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
    if (prompt) {
      const [newMessage] = await tx
        .insert(messages)
        .values({
          id: messageId,
          chatId: newChat.id,
          createdBy: user.id,
          requestMessage: prompt,
          responseMessages: {},
          reasoning: {},
          title: prompt,
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
    false
  );

  return {
    chatId: result.chat.id,
    messageId,
    chat: chatWithMessages,
  };
}

/**
 * Handle asset-based chat initialization
 */
export async function handleAssetChat(
  chatId: string,
  _messageId: string,
  assetId: string,
  assetType: 'metric_file' | 'dashboard_file',
  user: User,
  chat: ChatWithMessages
): Promise<ChatWithMessages> {
  const userId = user.id;
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
        created_at: msg.createdAt,
        updated_at: msg.updatedAt,
        request_message: {
          request: msg.requestMessage || '',
          sender_id: msg.createdBy,
          sender_name: chat.created_by_name,
          sender_avatar: chat.created_by_avatar || undefined,
        },
        response_messages: {},
        response_message_ids: [],
        reasoning_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: null,
        feedback: null,
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
