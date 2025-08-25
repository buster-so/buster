import { useShape, useShapeStream } from '../instances';
import { useMemo, useRef } from 'react';
import { chatShape, type BusterChatWithoutMessages } from './shapes';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { useMemoizedFn } from '@/hooks';

export const useGetChat = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => chatShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<`insert` | `update` | `delete`> = ['update'];

export const useTrackAndUpdateChatChanges = (
  {
    chatId,
    isStreamingMessage
  }: {
    chatId: string | undefined;
    isStreamingMessage: boolean;
  },
  callback?: (chat: BusterChatWithoutMessages) => void
) => {
  const { onUpdateChat } = useChatUpdate();
  const shape = useMemo(() => chatShape({ chatId: chatId || '' }), [chatId]);
  const subscribe = !!chatId;

  return useShapeStream(
    shape,
    updateOperations,
    (chat) => {
      if (chat && chat.value) {
        callback?.(chat.value);
        onUpdateChat(chat.value);
      }
    },
    subscribe
  );
};
