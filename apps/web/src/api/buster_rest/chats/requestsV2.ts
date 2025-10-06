import type {
  ChatCreateRequest,
  ChatWithMessages,
  GetChatsListResponseV2,
  GetChatsRequestV2,
} from '@buster/server-shared/chats';
import { mainApiV2 } from '../instances';

export const getListChats = async (
  params?: GetChatsRequestV2
): Promise<GetChatsListResponseV2['data']> => {
  const { page = 1, page_size = 3500 } = params || {};
  return mainApiV2
    .get<GetChatsListResponseV2>(`/chats`, {
      params: { page, page_size },
    })
    .then((res) => res.data.data);
};

export const createNewChat = async (props: ChatCreateRequest) => {
  return mainApiV2.post<ChatWithMessages>('/chats', props).then((res) => res.data);
};

export const stopChat = async ({ chatId }: { chatId: string }) => {
  return mainApiV2.delete<unknown>(`/chats/${chatId}/cancel`).then((res) => res.data);
};

export const startChatFromAsset = async (
  params: Pick<NonNullable<ChatCreateRequest>, 'asset_id' | 'asset_type' | 'prompt'>
): Promise<ChatWithMessages> => {
  return mainApiV2.post<ChatWithMessages>('/chats', params).then((res) => res.data);
};
