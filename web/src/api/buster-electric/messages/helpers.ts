import type {
  BusterChatMessageReasoning,
  BusterChatMessageResponse,
  IBusterChatMessage,
  BusterChatMessageRequest
} from '@/api/asset_interfaces/chat';
import type { BusterChatMessageShape } from './shapes';

export const updateMessageShapeToIChatMessage = (
  message: Partial<BusterChatMessageShape> & { id: string }
): Partial<IBusterChatMessage> & { id: string } => {
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
  const requestMessage = parseRequestMessage(message.request_message);

  // Build the converted message by only including fields that exist in both types
  const convertedMessage: Partial<IBusterChatMessage> & { id: string } = {
    id: message.id,
    ...(message.request_message !== undefined && { request_message: requestMessage }),
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
    ...(message.feedback !== undefined && { feedback: message.feedback })
  };

  console.log('convertedMessage', convertedMessage);

  return convertedMessage;
};

const parseResponseMessages = (
  responseMessages: string | undefined
): BusterChatMessageResponse[] => {
  try {
    if (!responseMessages) return [];
    return JSON.parse(responseMessages);
  } catch (error) {
    return [];
  }
};

const parseReasoningMessages = (
  reasoningMessages: string | undefined
): BusterChatMessageReasoning[] => {
  try {
    if (!reasoningMessages) return [];
    return JSON.parse(reasoningMessages);
  } catch (error) {
    return [];
  }
};

const parseRequestMessage = (requestMessage: string | undefined): BusterChatMessageRequest => {
  try {
    if (!requestMessage) return null;
    return JSON.parse(requestMessage);
  } catch (error) {
    return null;
  }
};
