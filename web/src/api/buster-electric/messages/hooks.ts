import { useMemo, useRef } from 'react';
import { messageShape, messagesShape } from './shapes';
import { useShape, useShapeStream } from '../instances';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { updateMessageShapeToIChatMessage } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { useGetChatMemoized } from '@/api/buster_rest/chats';
import uniq from 'lodash/uniq';

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
  const { onUpdateChatMessage, onUpdateChat } = useChatUpdate();
  const getChatMemoized = useGetChatMemoized();
  const shape = useMemo(
    () => messageShape({ chatId: chatId || '', messageId }),
    [chatId, messageId]
  );

  const subscribe = !!chatId && !!messageId && messageId !== 'undefined';

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((message) => {
      if (message && message.value && chatId) {
        console.log('message', message);
        const iChatMessage = updateMessageShapeToIChatMessage(message.value);
        const chat = getChatMemoized(chatId);
        if (chat) {
          //ADD NEW MESSAGE ID TO CHAT
          const currentMessageIds = chat.message_ids;
          const allMessageIds = uniq([...currentMessageIds, messageId]);
          if (currentMessageIds.length !== allMessageIds.length) {
            console.log('added message id to chat', messageId);
            onUpdateChat({
              ...chat,
              message_ids: allMessageIds
            });
          }
        }
        callback?.(iChatMessage);
        onUpdateChatMessage(iChatMessage);
      }
    }),
    subscribe
  );
};
