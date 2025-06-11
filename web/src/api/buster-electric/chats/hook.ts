import { useShape, useShapeStream } from '../instances';
import { useMemo, useRef } from 'react';
import { chatShape, type BusterChatWithoutMessages } from './shapes';
import last from 'lodash/last';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { useMemoizedFn } from '@/hooks';

export const useGetChat = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => chatShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<`insert` | `update` | `delete`> = ['update'];

export const useTrackAndUpdateChatChanges = (
  {
    chatId
  }: {
    chatId: string | undefined;
  },
  callback?: (chat: BusterChatWithoutMessages) => void
) => {
  const iteration = useRef(0);
  const { onUpdateChat } = useChatUpdate();
  const shape = useMemo(() => chatShape({ chatId: chatId || '' }), [chatId]);
  const subscribe = !!chatId;

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((chat) => {
      if (chat && chat.value) {
        iteration.current++;
        if (iteration.current > 0) {
          callback?.(chat.value);
          onUpdateChat(chat.value);
        }
      }
    }),
    subscribe
  );
};
