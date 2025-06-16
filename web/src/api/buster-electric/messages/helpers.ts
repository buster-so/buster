import type { IBusterChatMessage } from '@/api/asset_interfaces/chat';
import type { BusterChatMessageShape } from './shapes';

export const updateMessageShapeToIChatMessage = (
  message: Partial<BusterChatMessageShape> & { id: string }
): Partial<IBusterChatMessage> & { id: string } => {
  // Extract response_message_ids and convert array to record
  const responseMessageIds = message.response_messages?.map((msg) => msg.id) ?? [];
  const responseMessagesRecord =
    message.response_messages?.reduce(
      (acc, msg) => {
        acc[msg.id] = msg;
        return acc;
      },
      {} as Record<string, (typeof message.response_messages)[0]>
    ) ?? {};

  // Extract reasoning_message_ids and convert array to record
  const reasoningMessageIds = message.reasoning?.map((msg) => msg.id) ?? [];
  const reasoningMessagesRecord =
    message.reasoning?.reduce(
      (acc, msg) => {
        acc[msg.id] = msg;
        return acc;
      },
      {} as Record<string, (typeof message.reasoning)[0]>
    ) ?? {};

  // Build the converted message by only including fields that exist in both types
  const convertedMessage: Partial<IBusterChatMessage> & { id: string } = {
    id: message.id,
    ...(message.request_message !== undefined && { request_message: message.request_message }),
    ...(message.response_messages !== undefined && {
      response_message_ids: responseMessageIds,
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
