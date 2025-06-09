import { BusterChat } from '@/api/asset_interfaces/chat';
import { type ElectricShapeOptions, useShape } from '../instances';
import { useMemo } from 'react';

type BusterChatWithoutMessages = Omit<BusterChat, 'messages' | 'message_ids'>;

const chatShape = ({
  chatId
}: {
  chatId: string;
}): ElectricShapeOptions<BusterChatWithoutMessages> => {
  return {
    params: { table: 'chats', where: `id='${chatId}'` }
  };
};

export const useGetChat = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => chatShape({ chatId }), [chatId]);
  return useShape<BusterChatWithoutMessages>(shape);
};
