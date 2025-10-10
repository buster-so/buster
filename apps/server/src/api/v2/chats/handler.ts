import { analyst_agent_task_keys } from '@buster-app/trigger/task-keys';
import type { AnalystAgentTaskInput } from '@buster-app/trigger/task-schemas';
import { getUserOrganizationId, updateUserLastUsedShortcuts } from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import {
  type ChatCreateHandlerRequest,
  ChatError,
  ChatErrorCode,
  type ChatWithMessages,
} from '@buster/server-shared/chats';
import { tasks } from '@trigger.dev/sdk';
import type { Context } from 'hono';
import { handleAssetChat, handleAssetChatWithPrompt } from './services/chat-helpers';
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
  user: User,
  context: Context
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

    // Set message_analysis_mode if not provided (from staging)
    if (request.prompt && !request.message_analysis_mode) {
      request.message_analysis_mode = 'auto';
    }

    // Update request with message_analysis_mode
    const processedRequest = { ...request };
    // Initialize chat (new or existing)
    // When we have both asset and prompt, we'll skip creating the initial message
    // since handleAssetChatWithPrompt will create both the import and prompt messages
    const shouldCreateInitialMessage = !(
      processedRequest.asset_id &&
      processedRequest.asset_type &&
      processedRequest.prompt
    );
    const modifiedRequest = shouldCreateInitialMessage
      ? processedRequest
      : { ...processedRequest, prompt: undefined, message_analysis_mode: undefined };

    const { chatId, messageId, chat } = await initializeChat(modifiedRequest, user, organizationId);

    // Update user's last used shortcuts if any were provided in metadata
    if (
      processedRequest.metadata?.shortcutIds &&
      processedRequest.metadata.shortcutIds.length > 0
    ) {
      try {
        await updateUserLastUsedShortcuts({
          userId: user.id,
          shortcutIds: processedRequest.metadata.shortcutIds,
        });
      } catch (error) {
        // Log the error but don't fail the chat creation
        console.warn('Failed to update user last used shortcuts:', {
          userId: user.id,
          shortcutIds: processedRequest.metadata.shortcutIds,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Handle asset-based chat if needed
    let finalChat: ChatWithMessages = chat;
    let actualMessageId = messageId; // Track the actual message ID to use for triggering
    let shouldTriggerAnalyst = true; // Flag to control whether to trigger analyst task

    if (processedRequest.asset_id && processedRequest.asset_type) {
      if (!processedRequest.prompt) {
        // Original flow: just import the asset without a prompt
        finalChat = await handleAssetChat(
          chatId,
          messageId,
          processedRequest.asset_id,
          processedRequest.asset_type,
          user,
          chat
        );
        // For asset-only chats, don't trigger analyst task - just return the chat with asset
        shouldTriggerAnalyst = false;
      } else {
        // New flow: import asset then process the prompt
        finalChat = await handleAssetChatWithPrompt(
          chatId,
          messageId,
          processedRequest.asset_id,
          processedRequest.asset_type,
          processedRequest.prompt,
          processedRequest.message_analysis_mode,
          user,
          chat
        );
        // For asset+prompt chats, use the last message ID (the user's prompt message)
        const lastMessageId = finalChat.message_ids[finalChat.message_ids.length - 1];
        if (lastMessageId) {
          actualMessageId = lastMessageId;
        }
      }
    }

    // Trigger background analysis only if we have a prompt or it's not an asset-only request
    if (shouldTriggerAnalyst && (processedRequest.prompt || !processedRequest.asset_id)) {
      try {
        // Just queue the background job - should be <100ms
        const taskHandle = await tasks.trigger(
          analyst_agent_task_keys.analyst_agent_task,
          {
            message_id: actualMessageId,
            access_token: context.get('accessToken'),
          } satisfies AnalystAgentTaskInput,
          {
            concurrencyKey: chatId, // Ensure sequential processing per chat
          }
        );

        // Health check: Verify trigger service received the task
        // The presence of taskHandle.id confirms Trigger.dev accepted our request
        if (!taskHandle.id) {
          // This would indicate a serious issue with Trigger.dev service
          throw new Error('Trigger service returned invalid handle');
        }

        // Update the message with the trigger run ID
        const { updateMessage } = await import('@buster/database/queries');
        await updateMessage(actualMessageId, {
          triggerRunId: taskHandle.id,
        });

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
        hasPrompt: !!processedRequest.prompt,
        hasAsset: !!processedRequest.asset_id,
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
