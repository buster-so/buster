import { useCallback } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces';
import { useGetChat } from '@/api/buster_rest/chats';
import { useGetChatId } from './useGetChatId';

const stableChatSelector = (state: IBusterChat) => ({
  title: state.title,
  id: state.id,
  message_ids: state.message_ids,
});

export const useGetActiveChat = () => {
  const chatId = useGetChatId();
  const { data: chat } = useGetChat({ id: chatId || '' }, { select: stableChatSelector });
  return chat;
};

export const useGetCurrentMessageId = () => {
  const chatId = useGetChatId();

  const { data: currentMessageId } = useGetChat(
    { id: chatId || '' },
    {
      select: useCallback(
        (data: IBusterChat) => data?.message_ids[data?.message_ids.length - 1],
        []
      ),
    }
  );

  return currentMessageId;
};

const stableChatTitleSelector = (state: IBusterChat) => state.title;
export const useGetActiveChatTitle = () => {
  const chatId = useGetChatId();
  const { data: chatTitle } = useGetChat({ id: chatId || '' }, { select: stableChatTitleSelector });
  return chatTitle;
};

const stableChatMessageIdsSelector = (state: IBusterChat) => state.message_ids;
export const useGetChatMessageIds = (chatId?: string) => {
  const { data: chatMessageIds } = useGetChat(
    { id: chatId || '' },
    { select: stableChatMessageIdsSelector }
  );
  return chatMessageIds;
};
