import { useMemo, useRef } from 'react';
import { type BusterChatMessageShape, messageShape, messagesShape } from './shapes';
import { useShape, useShapeStream } from '../instances';
import first from 'lodash/first';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { updateMessageShapeToIChatMessage } from './helpers';
import { useMemoizedFn } from '@/hooks';

export const useGetMessage = ({ chatId, messageId }: { chatId: string; messageId: string }) => {
  const shape = useMemo(() => messageShape({ chatId, messageId }), [chatId, messageId]);
  return useShape(shape);
};

export const useGetMessages = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => messagesShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<`insert` | `update` | `delete`> = ['update'];

export const useTrackAndUpdateMessageChanges = (
  {
    chatId,
    messageId
  }: {
    chatId: string | undefined;
    messageId: string;
  },
  callback?: (message: BusterChatMessageShape) => void
) => {
  const iteration = useRef(0);
  const { onUpdateChatMessage } = useChatUpdate();
  const shape = useMemo(
    () => messageShape({ chatId: chatId || '', messageId }),
    [chatId, messageId]
  );

  const subscribe = !!chatId && !!messageId;

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((rows) => {
      const message = first(rows);
      if (message && message.value) {
        iteration.current++; //I not sure why... but electric sends 2 message when we first connect
        if (iteration.current > 2) {
          console.log('message', message.value);
          const iChatMessage = updateMessageShapeToIChatMessage(message.value);
          console.log('iChatMessage', iChatMessage.response_messages);
          callback?.(message.value);
          onUpdateChatMessage(iChatMessage);
        }
      }
    }),
    subscribe
  );
};
