import { useEffect, useMemo } from 'react';
import { type ElectricShapeOptions, useShape, useShapeStream } from '../instances';
import { type BusterChatMessage } from '@/api/asset_interfaces/chat';
import { ShapeStream } from '@electric-sql/client';

const messageShape = ({ chatId }: { chatId: string }): ElectricShapeOptions<BusterChatMessage> => {
  return {
    params: { table: 'messages', where: `chat_id='${chatId}'` }
  };
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messageShape({ chatId }), [chatId]);

  useShapeStream(shape);

  // return useShape<BusterChatMessage>(shape);
};
