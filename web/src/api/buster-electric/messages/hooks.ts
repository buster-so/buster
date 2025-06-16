import { useMemo, useRef } from 'react';
import { type BusterChatMessageShape, messageShape, messagesShape } from './shapes';
import { useShape, useShapeStream } from '../instances';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { updateMessageShapeToIChatMessage } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { useBusterNewChatContextSelector } from '@/context/Chats';

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
  callback?: (message: ReturnType<typeof updateMessageShapeToIChatMessage>) => void
) => {
  const iteration = useRef(0);
  const { onUpdateChatMessage } = useChatUpdate();
  const shape = useMemo(
    () => messageShape({ chatId: chatId || '', messageId }),
    [chatId, messageId]
  );

  const subscribe = !!chatId && !!messageId && messageId !== 'undefined';

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((message) => {
      if (message && message.value) {
        //I set it back to 0 in case they navigate away from the chat and come back
        if (iteration.current > 0) {
          const iChatMessage = updateMessageShapeToIChatMessage(message.value);
          callback?.(iChatMessage);
          onUpdateChatMessage(iChatMessage);
        }
        iteration.current++; //I not sure why... but electric sends 2 message when we first connect
      }
    }),
    subscribe
  );
};
