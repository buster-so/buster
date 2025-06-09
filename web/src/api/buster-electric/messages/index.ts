import { type BusterChatMessage } from '@/api/asset_interfaces/chat';
import { type ElectricShapeOptions, useShape } from '../instances';
import { useMemo } from 'react';

const messageShape = ({
  chatId,
  messageId
}: {
  chatId: string;
  messageId: string;
}): ElectricShapeOptions<BusterChatMessage> => {
  return {
    params: { table: 'messages', where: `chat_id='${chatId}' AND id='${messageId}'` }
  };
};

export const useGetMessage = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
  const shape = useMemo(() => messageShape({ chatId, messageId }), [chatId, messageId]);
  return useShape<BusterChatMessage>(shape);
};

const messagesShape = ({ chatId }: { chatId: string }): ElectricShapeOptions<BusterChatMessage> => {
  return {
    params: { table: 'messages', where: `chat_id='${chatId}'` }
  };
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messagesShape({ chatId }), [chatId]);
  return useShape<BusterChatMessage>(shape);
};
