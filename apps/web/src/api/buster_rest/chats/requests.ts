import type {
  DeleteChatsRequest,
  DuplicateChatRequest,
  DuplicateChatResponse,
  GetChatRequestParams,
  GetChatResponse,
  GetLogsListRequest,
  GetLogsListResponse,
  ShareChatResponse,
  UpdateChatMessageFeedbackRequest,
  UpdateChatMessageFeedbackResponse,
  UpdateChatParams,
  UpdateChatRequest,
  UpdateChatResponse,
} from '@buster/server-shared/chats';
import type {
  ShareDeleteRequest,
  ShareDeleteResponse,
  SharePostRequest,
  SharePostResponse,
  ShareUpdateRequest,
} from '@buster/server-shared/share';
import { mainApi, mainApiV2 } from '../instances';

const CHATS_BASE = '/chats';

export const getListLogs = async (params?: GetLogsListRequest): Promise<GetLogsListResponse> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<GetLogsListResponse>('/logs', {
      params: { page_token, page_size },
    })
    .then((res) => res.data);
};

export const getChat = async ({ id }: GetChatRequestParams): Promise<GetChatResponse> => {
  return mainApiV2.get<GetChatResponse>(`${CHATS_BASE}/${id}`).then((res) => res.data);
};

export const deleteChat = async (data: DeleteChatsRequest): Promise<void> => {
  const stringifiedData = JSON.stringify(data);
  return mainApi.delete(`${CHATS_BASE}`, { data: stringifiedData }).then((res) => res.data);
};

export const updateChat = async ({
  id,
  ...data
}: UpdateChatRequest & UpdateChatParams): Promise<UpdateChatResponse> => {
  return mainApiV2.put<UpdateChatResponse>(`${CHATS_BASE}/${id}`, data).then((res) => res.data);
};

export const updateChatMessageFeedback = async ({
  message_id,
  ...params
}: UpdateChatMessageFeedbackRequest): Promise<UpdateChatMessageFeedbackResponse> => {
  return mainApi.put(`/messages/${message_id}`, params).then((res) => res.data);
};

export const duplicateChat = async ({
  id,
  message_id,
}: DuplicateChatRequest): Promise<DuplicateChatResponse> => {
  return mainApi.post(`${CHATS_BASE}/duplicate`, { id, message_id }).then((res) => res.data);
};

export const shareChat = async ({ id, params }: { id: string; params: SharePostRequest }) => {
  return mainApiV2
    .post<SharePostResponse>(`${CHATS_BASE}/${id}/sharing`, params)
    .then((res) => res.data);
};

export const unshareChat = async ({ id, data }: { id: string; data: ShareDeleteRequest }) => {
  return mainApiV2
    .delete<ShareDeleteResponse>(`${CHATS_BASE}/${id}/sharing`, { data })
    .then((res) => res.data);
};

export const updateChatShare = async ({
  id,
  params,
}: {
  id: string;
  params: ShareUpdateRequest;
}) => {
  return mainApiV2
    .put<ShareChatResponse>(`${CHATS_BASE}/${id}/sharing`, params)
    .then((res) => res.data);
};
