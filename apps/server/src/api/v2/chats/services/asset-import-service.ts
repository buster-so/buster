import type { User } from '@buster/database';
import {
  type AssetDetailsResult,
  type Message,
  chats,
  createMessage,
  createMessageFileAssociation,
  db,
  getAssetDetailsById,
} from '@buster/database';
import type {
  ChatAssetType,
  ChatMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import { eq } from 'drizzle-orm';
import { convertChatAssetTypeToDatabaseAssetType } from './server-asset-conversion';

/**
 * Creates an import message for an asset
 * This message represents the initial import of the asset into the chat
 */
export async function createAssetImportMessage(
  chatId: string,
  messageId: string,
  assetId: string,
  assetType: ChatAssetType,
  assetDetails: AssetDetailsResult,
  user: User
): Promise<Message> {
  // Create the import message content
  const importContent = `Imported ${assetType === 'metric' ? 'metric' : 'dashboard'} "${
    assetDetails.name
  }"`;

  // Create the message in the database
  const message = await createMessage({
    messageId,
    chatId,
    content: importContent,
    userId: user.id,
  });

  // Update the message to include response and mark as completed
  const { updateMessage } = await import('@buster/database');
  await updateMessage(messageId, {
    isCompleted: true,
    responseMessages: [
      {
        id: assetId,
        type: 'file',
        file_type: assetType === 'metric' ? 'metric' : 'dashboard',
        file_name: assetDetails.name,
        version_number: assetDetails.versionNumber,
      },
    ],
  });

  // Create the file association
  const dbAssetType = convertChatAssetTypeToDatabaseAssetType(assetType);
  await createMessageFileAssociation({
    messageId,
    fileId: assetId,
    fileType: dbAssetType,
    version: assetDetails.versionNumber,
  });

  // Update the chat with most recent file information and title (matching Rust behavior)
  const fileType = assetType === 'metric' ? 'metric' : 'dashboard';
  await db
    .update(chats)
    .set({
      title: assetDetails.name, // Set chat title to asset name
      mostRecentFileId: assetId,
      mostRecentFileType: fileType,
      mostRecentVersionNumber: assetDetails.versionNumber,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chats.id, chatId));

  // Return the message with the updated fields
  return {
    ...message,
    isCompleted: true,
    responseMessages: [
      {
        id: assetId,
        type: 'file',
        file_type: assetType === 'metric' ? 'metric' : 'dashboard',
        file_name: assetDetails.name,
        version_number: assetDetails.versionNumber,
      },
    ],
  };
}

/**
 * Builds a ChatMessage from a database Message for an asset import
 */
export function buildAssetImportChatMessage(message: Message, user: User): ChatMessage {
  const responseMessages: Record<string, ChatMessageResponseMessage> = {};

  // Parse response messages if they exist
  if (Array.isArray(message.responseMessages)) {
    for (const resp of message.responseMessages as ChatMessageResponseMessage[]) {
      if ('id' in resp && resp.id) {
        responseMessages[resp.id] = resp;
      }
    }
  }

  return {
    id: message.id,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
    request_message: message.requestMessage
      ? {
          request: message.requestMessage,
          sender_id: user.id,
          sender_name: user.name || user.email || 'Unknown User',
          sender_avatar: user.avatarUrl || undefined,
        }
      : null,
    response_messages: responseMessages,
    response_message_ids: Object.keys(responseMessages),
    reasoning_messages: {},
    reasoning_message_ids: [],
    final_reasoning_message: null,
    feedback: null,
    is_completed: true,
    post_processing_message: undefined,
  };
}
