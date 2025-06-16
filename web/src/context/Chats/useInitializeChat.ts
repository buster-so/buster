'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { BusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { queryKeys } from '@/api/query_keys';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { updateChatToIChat } from '@/lib/chat';
import { BusterRoutes } from '@/routes';
import { useChatUpdate } from './useChatUpdate';

export const useInitializeChat = () => {
  const queryClient = useQueryClient();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { onUpdateChat } = useChatUpdate();

  const _normalizeChatMessage = useMemoizedFn(
    (iChatMessages: Record<string, IBusterChatMessage>) => {
      for (const message of Object.values(iChatMessages)) {
        const options = queryKeys.chatsMessages(message.id);
        const queryKey = options.queryKey;
        queryClient.setQueryData(queryKey, message);
      }
    }
  );

  const initializeNewChat = useMemoizedFn((d: BusterChat) => {
    const hasMultipleMessages = d.message_ids.length > 1;
    const { iChat, iChatMessages } = updateChatToIChat(d, true);
    _normalizeChatMessage(iChatMessages);
    onUpdateChat(iChat);
    if (!hasMultipleMessages) {
      onChangePage({
        route: BusterRoutes.APP_CHAT_ID,
        chatId: iChat.id
      });
    }
  });

  return {
    initializeNewChat
  };
};
