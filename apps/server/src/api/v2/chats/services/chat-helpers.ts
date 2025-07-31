import { canUserAccessChatCached } from '@buster/access-controls';
import {
  type User,
  chats,
  createMessage,
  db,
  generateAssetMessages,
  getChatWithDetails,
  getMessagesForChat,
  messages,
} from '@buster/database';
import type { Chat, Message } from '@buster/database';
import type {
  ChatAssetType,
  ChatMessage,
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
  ChatWithMessages,
} from '@buster/server-shared/chats';
import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';
import { PostProcessingMessageSchema } from '@buster/server-shared/message';
import { and, eq, gte, isNull } from 'drizzle-orm';
import type { z } from 'zod';
import { convertChatAssetTypeToDatabaseAssetType } from './server-asset-conversion';

/**
 * Validates a nullable JSONB field against a Zod schema
 * Returns undefined for null, empty objects, or invalid data
 * Returns the validated typed object for valid data
 */
function validateNullableJsonb<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): z.infer<T> | undefined {
  // Handle null/undefined
  if (data == null) return undefined;

  // Handle empty objects
  if (typeof data === 'object' && Object.keys(data).length === 0) return undefined;

  // Validate with schema
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

// Optimized: Generic function to handle both response and reasoning messages
function buildMessages<T extends { id: string }>(
  messages: unknown,
  isValidMessage: (item: unknown) => item is T
): Record<string, T> {
  if (!messages) {
    return {};
  }

  let parsedMessages = messages;

  // Handle string format (shouldn't happen with JSONB, but kept for safety)
  if (typeof messages === 'string') {
    try {
      parsedMessages = JSON.parse(messages);
    } catch {
      return {};
    }
  }

  // Handle array format (new format from generateAssetMessages)
  if (Array.isArray(parsedMessages)) {
    const result: Record<string, T> = {};
    for (let i = 0; i < parsedMessages.length; i++) {
      const item = parsedMessages[i];
      if (item && typeof item === 'object' && 'id' in item && isValidMessage(item)) {
        result[item.id] = item;
      }
    }
    return result;
  }

  // Handle object format (legacy format with IDs as keys)
  if (parsedMessages && typeof parsedMessages === 'object' && !Array.isArray(parsedMessages)) {
    return parsedMessages as Record<string, T>;
  }

  return {};
}

// Type guards for better performance
const isResponseMessage = (item: unknown): item is ChatMessageResponseMessage => {
  return item !== null && typeof item === 'object' && 'id' in item && 'type' in item;
};

const isReasoningMessage = (item: unknown): item is ChatMessageReasoningMessage => {
  return item !== null && typeof item === 'object' && 'id' in item && 'type' in item;
};

const buildResponseMessages = (responseMessages: unknown): ChatMessage['response_messages'] => {
  return buildMessages(responseMessages, isResponseMessage);
};

const buildReasoningMessages = (reasoningMessages: unknown): ChatMessage['reasoning_messages'] => {
  return buildMessages(reasoningMessages, isReasoningMessage);
};

/**
 * Build a ChatWithMessages object from database entities
 * Optimized for performance with pre-allocated objects and minimal iterations
 */
export function buildChatWithMessages(
  chat: Chat,
  messages: Message[],
  user: User | null,
  isFavorited = false
): ChatWithMessages {
  // Pre-allocate collections with known size
  const messageCount = messages.length;
  const messageMap: Record<string, ChatMessage> = {};
  const messageIds: string[] = new Array(messageCount);

  // Cache user info to avoid repeated property access
  const userName = user?.name || user?.email || 'Unknown User';
  const userAvatar = user?.avatarUrl || undefined;

  // Single iteration with optimized object creation
  for (let i = 0; i < messageCount; i++) {
    const msg = messages[i];
    if (!msg) continue; // Skip if somehow undefined

    const responseMessages = buildResponseMessages(msg.responseMessages);
    const reasoningMessages = buildReasoningMessages(msg.reasoning);

    // Pre-compute arrays to avoid Object.keys() calls
    const responseMessageIds = Object.keys(responseMessages);
    const reasoningMessageIds = Object.keys(reasoningMessages);

    const requestMessage = msg.requestMessage
      ? {
          request: msg.requestMessage,
          sender_id: msg.createdBy,
          sender_name: userName,
          sender_avatar: userAvatar,
        }
      : null;

    const chatMessage: ChatMessage = {
      id: msg.id,
      created_at: msg.createdAt,
      updated_at: msg.updatedAt,
      request_message: requestMessage,
      response_messages: responseMessages,
      response_message_ids: responseMessageIds,
      reasoning_message_ids: reasoningMessageIds,
      reasoning_messages: reasoningMessages,
      final_reasoning_message: msg.finalReasoningMessage || null,
      feedback: msg.feedback ? (msg.feedback as 'negative') : null,
      is_completed: msg.isCompleted || false,
      post_processing_message: validateNullableJsonb(
        msg.postProcessingMessage,
        PostProcessingMessageSchema
      ),
    };

    messageIds[i] = msg.id;
    messageMap[msg.id] = chatMessage;
  }

  // Ensure message_ids array has no duplicates
  const uniqueMessageIds = [...new Set(messageIds)];

  // Reverse the array to go from oldest to newest
  // (messages come from DB in desc order, but we want asc in response)
  const reversedMessageIds = uniqueMessageIds.reverse();

  return {
    id: chat.id,
    title: chat.title,
    is_favorited: isFavorited,
    message_ids: reversedMessageIds,
    messages: messageMap,
    created_at: chat.createdAt,
    updated_at: chat.updatedAt,
    created_by: chat.createdBy,
    created_by_id: chat.createdBy,
    created_by_name: userName,
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
  user: User,
  redoFromMessageId?: string
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

  const hasPermission = await canUserAccessChatCached({
    userId: user.id,
    chatId,
  });
  if (!hasPermission) {
    throw new ChatError(
      ChatErrorCode.PERMISSION_DENIED,
      'You do not have permission to access this chat',
      403
    );
  }

  // Handle redo logic if redoFromMessageId is provided
  if (redoFromMessageId) {
    // Validate that the message belongs to this chat
    const messageToRedo = await db
      .select({ chatId: messages.chatId })
      .from(messages)
      .where(eq(messages.id, redoFromMessageId))
      .limit(1);

    if (!messageToRedo.length || messageToRedo[0]?.chatId !== chatId) {
      throw new ChatError(
        ChatErrorCode.INVALID_REQUEST,
        'Message does not belong to this chat',
        400
      );
    }

    // Soft delete from this point forward
    await softDeleteMessagesFromPoint(redoFromMessageId);
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

  // Combine messages - prepend new message to maintain descending order (newest first)
  const allMessages = newMessage ? [newMessage, ...existingMessages] : existingMessages;

  // Build chat with messages
  const chatWithMessages: ChatWithMessages = buildChatWithMessages(
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
  chatAssetType: ChatAssetType,
  user: User,
  chat: ChatWithMessages
): Promise<ChatWithMessages> {
  const userId = user.id;
  try {
    // Generate asset messages
    const assetType = convertChatAssetTypeToDatabaseAssetType(chatAssetType);
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
      // Build response messages from the database message
      const responseMessages = buildResponseMessages(msg.responseMessages);
      const responseMessageIds = Object.keys(responseMessages);

      const chatMessage: ChatMessage = {
        id: msg.id,
        created_at: msg.createdAt,
        updated_at: msg.updatedAt,
        request_message: msg.requestMessage
          ? {
              request: msg.requestMessage,
              sender_id: msg.createdBy,
              sender_name: chat.created_by_name,
              sender_avatar: chat.created_by_avatar || undefined,
            }
          : null,
        response_messages: responseMessages,
        response_message_ids: responseMessageIds,
        reasoning_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: msg.finalReasoningMessage || null,
        feedback: null,
        is_completed: msg.isCompleted || false,
        post_processing_message: validateNullableJsonb(
          msg.postProcessingMessage,
          PostProcessingMessageSchema
        ),
      };

      // Only add message ID if it doesn't already exist
      if (!chat.message_ids.includes(msg.id)) {
        chat.message_ids.push(msg.id);
      }
      chat.messages[msg.id] = chatMessage;
    }

    // Update the chat with most recent file information and title (matching Rust behavior)
    const fileType = chatAssetType === 'metric' ? 'metric' : 'dashboard';

    // Get the asset name from the first message
    const assetName = assetMessages[0]?.title || '';

    await db
      .update(chats)
      .set({
        title: assetName, // Set chat title to asset name
        mostRecentFileId: assetId,
        mostRecentFileType: fileType,
        mostRecentVersionNumber: 1, // Asset imports always start at version 1
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chats.id, chatId));

    // Update the chat object with the new title
    chat.title = assetName;

    return chat;
  } catch (error) {
    console.error('Failed to handle asset chat:', {
      chatId,
      assetId,
      chatAssetType,
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

/**
 * Handle asset-based chat initialization with a prompt
 * This creates an import message for the asset, then adds the user's prompt as a follow-up
 */
export async function handleAssetChatWithPrompt(
  chatId: string,
  _messageId: string, // Initial message ID (not used since we create two messages)
  assetId: string,
  chatAssetType: ChatAssetType,
  prompt: string,
  user: User,
  chat: ChatWithMessages
): Promise<ChatWithMessages> {
  const userId = user.id;
  try {
    // First, use the exact same logic as handleAssetChat to import the asset
    // This ensures we get dashboard metrics and proper formatting
    const assetType = convertChatAssetTypeToDatabaseAssetType(chatAssetType);
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
      // Still create the user message with prompt
      const userMessageId = crypto.randomUUID();
      const userMessage = await createMessage({
        messageId: userMessageId,
        chatId,
        content: prompt,
        userId: user.id,
      });

      // Add to chat
      const chatMessage: ChatMessage = {
        id: userMessage.id,
        created_at: userMessage.createdAt,
        updated_at: userMessage.updatedAt,
        request_message: {
          request: prompt,
          sender_id: user.id,
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
        post_processing_message: undefined,
      };

      if (!chat.message_ids.includes(userMessage.id)) {
        chat.message_ids.push(userMessage.id);
      }
      chat.messages[userMessage.id] = chatMessage;

      return chat;
    }

    // Add the import message to chat (exact same logic as handleAssetChat)
    for (const msg of assetMessages) {
      // Build response messages from the database message
      const responseMessages = buildResponseMessages(msg.responseMessages);
      const responseMessageIds = Object.keys(responseMessages);

      const chatMessage: ChatMessage = {
        id: msg.id,
        created_at: msg.createdAt,
        updated_at: msg.updatedAt,
        request_message: msg.requestMessage
          ? {
              request: msg.requestMessage,
              sender_id: msg.createdBy,
              sender_name: chat.created_by_name,
              sender_avatar: chat.created_by_avatar || undefined,
            }
          : null,
        response_messages: responseMessages,
        response_message_ids: responseMessageIds,
        reasoning_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: msg.finalReasoningMessage || null,
        feedback: null,
        is_completed: msg.isCompleted || false,
        post_processing_message: validateNullableJsonb(
          msg.postProcessingMessage,
          PostProcessingMessageSchema
        ),
      };

      // Only add message ID if it doesn't already exist
      if (!chat.message_ids.includes(msg.id)) {
        chat.message_ids.push(msg.id);
      }
      chat.messages[msg.id] = chatMessage;
    }

    // Update the chat with most recent file information and title (matching handleAssetChat)
    const fileType = chatAssetType === 'metric' ? 'metric' : 'dashboard';
    const assetName = assetMessages[0]?.title || '';

    await db
      .update(chats)
      .set({
        title: assetName, // Set chat title to asset name
        mostRecentFileId: assetId,
        mostRecentFileType: fileType,
        mostRecentVersionNumber: 1, // Asset imports always start at version 1
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chats.id, chatId));

    // Update the chat object with the new title
    chat.title = assetName;

    // Then, create the user's prompt message as a follow-up
    const userMessageId = crypto.randomUUID();
    const userMessage = await createMessage({
      messageId: userMessageId,
      chatId,
      content: prompt,
      userId: user.id,
    });

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: userMessage.id,
      created_at: userMessage.createdAt,
      updated_at: userMessage.updatedAt,
      request_message: {
        request: prompt,
        sender_id: user.id,
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
      post_processing_message: undefined,
    };

    if (!chat.message_ids.includes(userMessage.id)) {
      chat.message_ids.push(userMessage.id);
    }
    chat.messages[userMessage.id] = userChatMessage;

    return chat;
  } catch (error) {
    console.error('Failed to handle asset chat with prompt:', {
      chatId,
      assetId,
      chatAssetType,
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

    // Don't fail the entire request, create the user message anyway
    const userMessageId = crypto.randomUUID();
    const userMessage = await createMessage({
      messageId: userMessageId,
      chatId,
      content: prompt,
      userId: user.id,
    });

    const chatMessage: ChatMessage = {
      id: userMessage.id,
      created_at: userMessage.createdAt,
      updated_at: userMessage.updatedAt,
      request_message: {
        request: prompt,
        sender_id: user.id,
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
      post_processing_message: undefined,
    };

    if (!chat.message_ids.includes(userMessage.id)) {
      chat.message_ids.push(userMessage.id);
    }
    chat.messages[userMessage.id] = chatMessage;

    return chat;
  }
}

/**
 * Soft delete a message and all subsequent messages in the same chat
 * Used for "redo from this point" functionality
 */
export async function softDeleteMessagesFromPoint(messageId: string): Promise<void> {
  // Get the message to find its chat and timestamp
  const targetMessage = await db
    .select({ chatId: messages.chatId, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!targetMessage.length || !targetMessage[0]) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const { chatId, createdAt } = targetMessage[0];

  // Soft delete this message and all messages created after it in the same chat
  await db
    .update(messages)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(
        eq(messages.chatId, chatId),
        gte(messages.createdAt, createdAt),
        isNull(messages.deletedAt)
      )
    );
}
