import { getUserOrganizationId } from '@buster/database';
import type { User } from '@buster/database';
import {
  type ChatCreateHandlerRequest,
  ChatError,
  ChatErrorCode,
  type ChatWithMessages,
} from '@buster/server-shared/chats';
import { tasks } from '@trigger.dev/sdk/v3';
import { handleAssetChat } from './services/chat-helpers';
import { initializeChat } from './services/chat-service';

/**
 * Handler function for creating a new chat.
 *
 * PERFORMANCE TARGET: <500ms total response time
 *
 * Flow:
 * 1. Create/update chat and message objects in database (~100-200ms)
 * 2. Queue background analyst job (NOT wait for completion) (~100ms)
 * 3. Return ChatWithMessages object immediately (~50ms)
 *
 * The analyst-agent-task runs in background and can take minutes.
 * Users get their chat object immediately without waiting.
 */
export async function createChatHandler(
  request: ChatCreateHandlerRequest,
  user: User
): Promise<ChatWithMessages> {
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

    if (!request.prompt && !request.asset_id) {
      throw new ChatError(ChatErrorCode.INVALID_REQUEST, 'prompt or asset_id is required', 400);
    }

    // Initialize chat (new or existing)
    const { chatId, messageId, chat } = await initializeChat(request, user, organizationId);

    // Handle asset-based chat if needed
    let finalChat: ChatWithMessages = chat;
    if (request.asset_id && request.asset_type && !request.prompt) {
      finalChat = await handleAssetChat(
        chatId,
        messageId,
        request.asset_id,
        request.asset_type,
        user,
        chat
      );
    }

    // Trigger background analysis if we have content
    // This should be very fast (just queuing the job, not waiting for completion)
    if (request.prompt || request.asset_id) {
      try {
        // Just queue the background job - should be <100ms
        const taskHandle = await tasks.trigger('analyst-agent-task', {
          message_id: messageId,
        });

        // Health check: Verify trigger service received the task
        // The presence of taskHandle.id confirms Trigger.dev accepted our request
        if (!taskHandle.id) {
          // This would indicate a serious issue with Trigger.dev service
          throw new Error('Trigger service returned invalid handle');
        }

        // Task was successfully queued - background analysis will proceed
      } catch (triggerError) {
        console.error('Failed to trigger analyst agent task:', triggerError);
        throw triggerError;
      }
    }

    // Log performance metrics - target is <500ms total
    const duration = Date.now() - startTime;

    if (duration > 500) {
      console.warn('Slow chat creation detected:', {
        duration: `${duration}ms`,
        target: '500ms',
        user,
        chatId,
        hasPrompt: !!request.prompt,
        hasAsset: !!request.asset_id,
        suggestion: 'Check database performance and trigger service',
      });
    }

    return finalChat;
  } catch (error) {
    // Log error with context
    console.error('Chat creation failed:', {
      user,
      duration: Date.now() - startTime,
      request: {
        hasPrompt: !!request.prompt,
        hasChatId: !!request.chat_id,
        hasAssetId: !!request.asset_id,
        assetType: request.asset_type,
      },
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
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
      {
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
