import type { ChatCreateRequest } from '@server/types/chat-types';
import { useBusterApiContextSelector } from '@/context/BusterReactQuery';
import { useMutation } from '@tanstack/react-query';

export const useStartNewChat = () => {
  const honoInstance = useBusterApiContextSelector((state) => state.honoInstance);

  return useMutation({
    mutationFn: (props: ChatCreateRequest) =>
      honoInstance.api.v2.chats.$post({ json: props }).then((res) => res.json())
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
