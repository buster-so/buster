import type { ChatCreateRequest, ChatWithMessages } from '@buster/server-shared/chats';
import { mainApiV2 } from '../instances';

export const createNewChat = async (props: ChatCreateRequest) => {
  return mainApiV2.post<ChatWithMessages>('/chats', props).then((res) => res.data);
};

export const stopChat = async ({ chatId }: { chatId: string }) => {
  return mainApiV2.delete<unknown>(`/chats/${chatId}/cancel`).then((res) => res.data);
};
