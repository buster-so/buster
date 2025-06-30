import type { ChatCreateRequest } from '@buster/server-shared/chats';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatToIChat } from '@/lib/chat';
import { useMemoizedFn } from '@/hooks';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { useChatUpdate } from '@/context/Chats/useChatUpdate';
import { createNewChat, stopChat } from './requestsV2';

export const useStartNewChat = () => {
  const queryClient = useQueryClient();
  const { onUpdateChat } = useChatUpdate();

  const saveAllChatMessages = useMemoizedFn((iChatMessages: Record<string, BusterChatMessage>) => {
    for (const message of Object.values(iChatMessages)) {
      const options = chatQueryKeys.chatsMessages(message.id);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, message);
    }
  });

  return useMutation({
    mutationFn: async (props: ChatCreateRequest) => {
      //I opted to not use honoInstance to take better advantage of caching
      //  const res = await honoInstance.api.v2.chats.$post({ json: props });
      return await createNewChat(props);
    },
    onSuccess: (data) => {
      const { iChat, iChatMessages } = updateChatToIChat(data);
      console.log('iChat', iChat);
      console.log('iChatMessages', iChatMessages);
      saveAllChatMessages(iChatMessages);
      onUpdateChat(iChat);
    }
  });
};

export const useStopChat = () => {
  return useMutation({
    mutationFn: (chatId: string) => stopChat({ chatId })
  });
};
