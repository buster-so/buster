import type { User } from '@buster/database/queries';
import { PublicChatError, PublicChatErrorCode } from '@buster/server-shared';
import type { ChatCreateHandlerRequest, ChatWithMessages } from '@buster/server-shared/chats';
import type { Context } from 'hono';
import { createChatHandler } from '../../../chats/handler';
import { URL_CONFIG } from '../constants';

/**
 * Initializes a chat with the given prompt
 * @param prompt The user's prompt
 * @param user The user creating the chat
 * @param organizationId The organization ID
 * @returns The created chat with messages
 */
export async function initializeChat(
  prompt: string,
  user: User,
  context: Context
): Promise<ChatWithMessages> {
  try {
    // Create the chat request
    const chatRequest: ChatCreateHandlerRequest = {
      prompt,
    };

    // Use the existing chat handler
    const chat = await createChatHandler(chatRequest, user, context);

    return chat;
  } catch (error) {
    console.error('Error initializing chat:', error);
    throw new PublicChatError(
      PublicChatErrorCode.CHAT_CREATION_FAILED,
      'Failed to create chat',
      500
    );
  }
}

/**
 * Builds the chat link for the Buster platform
 * @param chatId The chat ID
 * @param fileId Optional file ID if a file was created
 * @param fileType Optional file type (metric_file, dashboard_file, etc.)
 * @param versionNumber Optional version number
 * @returns The formatted chat link
 */
export function buildChatLink(
  chatId: string,
  fileId?: string | null,
  fileType?: string | null,
  versionNumber?: number | null
): string {
  const baseUrl = process.env.BUSTER_URL || URL_CONFIG.DEFAULT_BASE_URL;

  // If we have file information, build the file-specific URL
  if (fileId && fileType && versionNumber != null) {
    // Convert file type to plural form for URL
    const fileTypePlural = fileType.endsWith('_file')
      ? fileType.replace('_file', '_files')
      : `${fileType}s`;

    return `${baseUrl}/app/chats/${chatId}/${fileTypePlural}/${fileId}?${fileType}_version_number=${versionNumber}`;
  }

  // Otherwise, just return the chat URL
  return `${baseUrl}/app/chats/${chatId}`;
}

/**
 * Extracts the message ID from a chat
 * @param chat The chat with messages
 * @returns The latest message ID
 */
export function extractMessageId(chat: ChatWithMessages): string {
  if (!chat.message_ids || chat.message_ids.length === 0) {
    throw new PublicChatError(
      PublicChatErrorCode.CHAT_CREATION_FAILED,
      'No messages found in chat',
      500
    );
  }

  // Get the last message ID (which should be the user's prompt message)
  const messageId = chat.message_ids[chat.message_ids.length - 1];
  if (!messageId) {
    throw new PublicChatError(PublicChatErrorCode.CHAT_CREATION_FAILED, 'Invalid message ID', 500);
  }

  return messageId;
}

/**
 * Extracts the trigger run ID from a chat's messages
 * This would typically be set by the chat handler after triggering the analyst task
 * @param chat The chat with messages
 * @returns The trigger run ID if available
 */
export function extractTriggerRunId(_chat: ChatWithMessages): string | undefined {
  // The trigger run ID would be stored in the message metadata
  // For now, we'll return undefined and handle this in the polling logic
  return undefined;
}
