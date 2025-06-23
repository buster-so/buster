import type {
  BusterChatMessageReasoning,
  BusterChatMessageResponse,
  BusterChatMessage
} from '@/api/asset_interfaces/chat';
import type { BusterChatMessageShape } from './shapes';

export const updateMessageShapeToIChatMessage = (
  message: Partial<BusterChatMessageShape> & { id: string }
): Partial<BusterChatMessage> & { id: string } => {
  // Extract response_message_ids and convert array to record
  const responseMessageIds = parseResponseMessages(message.response_messages);
  const responseMessagesRecord = responseMessageIds.reduce(
    (acc, msg) => {
      acc[msg.id] = msg;
      return acc;
    },
    {} as Record<string, BusterChatMessageResponse>
  );

  // Extract reasoning_message_ids and convert array to record
  const reasoningMessages = parseReasoningMessages(message.reasoning);
  const reasoningMessageIds = reasoningMessages.map((msg) => msg.id);
  const reasoningMessagesRecord = reasoningMessages.reduce(
    (acc, msg) => {
      acc[msg.id] = msg;
      return acc;
    },
    {} as Record<string, BusterChatMessageReasoning>
  );

  // Parse request message

  // Build the converted message by only including fields that exist in both types
  const convertedMessage: Partial<BusterChatMessage> & { id: string } = {
    id: message.id,
    ...(message.response_messages !== undefined && {
      response_message_ids: responseMessageIds.map((msg) => msg.id),
      response_messages: responseMessagesRecord
    }),
    ...(message.reasoning !== undefined && {
      reasoning_message_ids: reasoningMessageIds,
      reasoning_messages: reasoningMessagesRecord
    }),
    ...(message.created_at !== undefined && { created_at: message.created_at }),
    ...(message.final_reasoning_message !== undefined && {
      final_reasoning_message: message.final_reasoning_message
    }),
    ...(message.feedback !== undefined && { feedback: message.feedback }),
    ...(message.is_completed !== undefined && { is_completed: message.is_completed })
  };

  return convertedMessage;
};

const parseResponseMessages = (
  responseMessages: string | BusterChatMessageResponse[] | undefined
): BusterChatMessageResponse[] => {
  try {
    if (typeof responseMessages === 'object') return responseMessages;
    if (!responseMessages) return [];
    return JSON.parse(responseMessages);
  } catch (error) {
    return [];
  }
};

const parseReasoningMessages = (
  reasoningMessages: string | BusterChatMessageReasoning[] | undefined
): BusterChatMessageReasoning[] => {
  try {
    if (typeof reasoningMessages === 'object') return reasoningMessages;
    if (!reasoningMessages) return [];
    return JSON.parse(reasoningMessages);
  } catch (error) {
    return [];
  }
};
