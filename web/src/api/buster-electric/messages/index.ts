import { useEffect, useMemo } from 'react';
import { type ElectricShapeOptions, useShape, useShapeStream } from '../instances';
import { type BusterChatMessage } from '@/api/asset_interfaces/chat';
import { ShapeStream } from '@electric-sql/client';

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

// export const useGetMessages = ({ chatId }: { chatId: string }) => {
//   const shape = useMemo(() => messageShape({ chatId }), [chatId]);

//   useShapeStream(
//     shape,
//     ['insert', 'update', 'delete'],
//     (rows) => {
//       console.log(rows);
//     },
//     (d) => {
//       return false;
//     }
//   );

//   // return useShape<BusterChatMessage>(shape);
// };
