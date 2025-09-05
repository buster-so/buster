import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import {
  RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
  type RespondWithoutAssetCreationState,
} from '../respond-without-asset-creation-tool';

export function createRespondWithoutAssetCreationResponseMessage(
  state: RespondWithoutAssetCreationState,
  toolCallId: string
): ChatMessageResponseMessage | undefined {
  if (!state.final_response) {
    return undefined;
  }

  return {
    id: toolCallId,
    type: 'text',
    message: state.final_response,
    is_final_message: true,
  };
}

export function createRespondWithoutAssetCreationRawLlmMessageEntry(
  state: RespondWithoutAssetCreationState,
  toolCallId: string
): ModelMessage | undefined {
  // Follow the same pattern as done-tool - use the extracted value, not raw args
  if (!state.final_response) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId,
        toolName: RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
        input: { final_response: state.final_response },
      },
    ],
  };
}
