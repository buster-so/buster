import type { ElectricShapeOptions } from '../instances';
import type {
  BusterChatMessage,
  BusterChatMessageReasoning,
  BusterChatMessageRequest,
  BusterChatMessageResponse
} from '@/api/asset_interfaces/chat';

export type BusterChatMessageShape = {
  id: string;
  request_message: string | BusterChatMessageRequest;
  response_messages: string | BusterChatMessageResponse[];
  reasoning: string | BusterChatMessageReasoning[];
  created_at: BusterChatMessage['created_at'];
  final_reasoning_message: BusterChatMessage['final_reasoning_message'];
  feedback: BusterChatMessage['feedback'];
};

const columns: (keyof BusterChatMessageShape)[] = [
  'id',
  'request_message',
  'response_messages',
  'reasoning',
  'created_at',
  'final_reasoning_message',
  'feedback'
];

export const messageShape = ({
  chatId,
  messageId
}: {
  chatId: string;
  messageId: string;
}): ElectricShapeOptions<BusterChatMessageShape> => {
  return {
    params: {
      table: 'messages',
      where: `chat_id='${chatId}' AND id='${messageId}'`,
      columns
    }
  };
};

export const messagesShape = ({
  chatId
}: {
  chatId: string;
}): ElectricShapeOptions<BusterChatMessageShape> => {
  return {
    params: { table: 'messages', where: `chat_id='${chatId}'`, columns }
  };
};
