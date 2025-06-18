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
  const hasSeenInitialUpdate = useRef(false);
  const shape = useMemo(() => chatShape({ chatId: chatId || '' }), [chatId]);
  const subscribe = !!chatId;

  return useShapeStream(
    shape,
    updateOperations,
    useMemoizedFn((chat) => {
      if (chat && chat.value) {
        const killUpdate = isStreamingMessage ? false : !hasSeenInitialUpdate.current;

        hasSeenInitialUpdate.current = true;

        if (killUpdate) {
          return;
        }

        callback?.(chat.value);
        onUpdateChat(chat.value);
      }
    }),
    subscribe
  );
};
