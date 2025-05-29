import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';

export const useChatUpdate = () => {
  const queryClient = useQueryClient();

  const onUpdateChat = useMemoizedFn(
    async (newChatConfig: Partial<IBusterChat> & { id: string }) => {
      const chatId = newChatConfig.id;
      const options = queryKeys.chatsGetChat(chatId);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData<IBusterChat>(queryKey);
      const iChat = create(currentData || ({} as IBusterChat), (draft) => {
        Object.assign(draft, newChatConfig);
      });
      queryClient.setQueryData(queryKey, iChat);
    }
  );

  const onUpdateChatMessage = useMemoizedFn(
    async (newMessageConfig: Partial<IBusterChatMessage> & { id: string }) => {
      const options = queryKeys.chatsMessages(newMessageConfig.id);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData(queryKey);
      if (currentData) {
        const iChatMessage = create(currentData, (draft) => {
          Object.assign(draft, newMessageConfig);
        });
        queryClient.setQueryData(queryKey, iChatMessage);
      }
    }
  );

  return {
    onUpdateChat,
    onUpdateChatMessage
  };
};
