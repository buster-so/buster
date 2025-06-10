import type { User } from '@supabase/supabase-js';
import { tasks } from '@trigger.dev/sdk/v3';
import type { ChatCreateHandlerRequest, ChatCreateResponse } from '../../../types/chat.types';
import { ChatError, ChatErrorCode } from '../../../types/chat-errors.types';
import { initializeChat, handleAssetChat } from './services/chat-service';
import { getUserOrganizationId } from '@buster/database';

/**
 * Handler function for creating a new chat.
 * Returns a complete ChatWithMessages object and triggers background processing.
 */
export async function createChatHandler(
  request: ChatCreateHandlerRequest,
  user: User
): Promise<ChatCreateResponse> {
  const startTime = Date.now();
  
  try {
    // Extract organization ID from user metadata
    const userOrg = await getUserOrganizationId(user.id);

    if (!userOrg) {
      throw new ChatError(
        ChatErrorCode.MISSING_ORGANIZATION,
        'User is not associated with an organization',
        400
      );
    }

    const { organizationId, role: _role } = userOrg;

    // Validate asset parameters
    if (request.asset_id && !request.asset_type) {
      throw new ChatError(
        ChatErrorCode.INVALID_REQUEST,
        'asset_type is required when asset_id is provided',
        400
      );
    }

    // Initialize chat (new or existing)
    const { chatId, messageId, chat } = await initializeChat(
      request,
      user,
      organizationId
    );

    // Handle asset-based chat if needed
    let finalChat = chat;
    if (request.asset_id && request.asset_type && !request.prompt) {
      finalChat = await handleAssetChat(
        chatId,
        messageId,
        request.asset_id,
        request.asset_type,
        user.id,
        chat
      );
    }

    // Trigger background analysis if we have content
    if (request.prompt || request.asset_id) {
      try {
        await tasks.trigger('analyst-agent-task', {
          message_id: messageId,
        });
      } catch (triggerError) {
        // Log but don't fail the request - chat is already created
        console.error('Failed to trigger analyst agent task:', triggerError);
      }
    }

    // Log performance metrics
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.warn('Slow chat creation', {
        duration,
        userId: user.id,
        chatId,
        hasPrompt: !!request.prompt,
        hasAsset: !!request.asset_id,
      });
    }

    return finalChat;
  } catch (error) {
    // Log error with context
    console.error('Chat creation failed:', {
      userId: user.id,
      duration: Date.now() - startTime,
      request: {
        hasPrompt: !!request.prompt,
        hasChatId: !!request.chat_id,
        hasAssetId: !!request.asset_id,
        assetType: request.asset_type,
      },
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    });

    // Re-throw ChatError instances
    if (error instanceof ChatError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new ChatError(
      ChatErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred while creating the chat',
      500,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}