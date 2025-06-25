import type { ChatCreateRequest, ChatCreateResponse } from '@buster/server-shared/chats';
import { mainApiV2 } from '../instances';

export const createNewChat = async (props: ChatCreateRequest) => {
  return mainApiV2.post<ChatCreateResponse>('/chats', props).then((res) => res.data);
};

export const stopChat = async ({ chatId }: { chatId: string }) => {
  return mainApiV2.patch<unknown>(`/chats/${chatId}`, { stop: true }).then((res) => res.data);
};
