import type { ChatCreateRequest } from '@buster/server-shared/chats';
import { useBusterApiContextSelector } from '@/context/BusterReactQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatToIChat } from '@/lib/chat';
import { useMemoizedFn } from '@/hooks';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';

export const useStartNewChat = () => {
  const queryClient = useQueryClient();
  const { onUpdateChat } = useChatUpdate();
  const honoInstance = useBusterApiContextSelector((state) => state.honoInstance);

  const saveAllChatMessages = useMemoizedFn((iChatMessages: Record<string, BusterChatMessage>) => {
    for (const message of Object.values(iChatMessages)) {
      const options = chatQueryKeys.chatsMessages(message.id);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, message);
    }
  });

  return useMutation({
    mutationFn: async (props: ChatCreateRequest) => {
      const res = await honoInstance.api.v2.chats.$post({ json: props });
      return await res.json();
    },
    onSuccess: (data) => {
      const { iChat, iChatMessages } = updateChatToIChat(data);
      saveAllChatMessages(iChatMessages);
      onUpdateChat(iChat);
    }
  });
};

export const useStopChat = () => {
  const honoInstance = useBusterApiContextSelector((state) => state.honoInstance);

  return useMutation({
    mutationFn: (chatId: string) =>
      honoInstance.api.v2.chats[':chat_id'].$patch({
        param: { chat_id: chatId },
        json: { stop: true }
      })
  });
};
