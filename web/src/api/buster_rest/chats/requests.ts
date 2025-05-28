import { mainApi } from '../instances';
import { serverFetch } from '../../createServerInstance';
import type { BusterChatListItem, BusterChat } from '@/api/asset_interfaces/chat/chatInterfaces';

const CHATS_BASE = '/chats';

// Client-side fetch version
export const getListChats = async (params?: {
  page_token: number;
  page_size: number;
}): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<BusterChatListItem[]>(`${CHATS_BASE}`, {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

export const getListLogs = async (
  params?: Parameters<typeof getListChats>[0]
): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 3500 } = params || {};
  return mainApi
    .get<BusterChatListItem[]>('/logs', {
      params: { page_token, page_size }
    })
    .then((res) => res.data);
};

// Server-side fetch version
export const getListChats_server = async (
  params?: Parameters<typeof getListChats>[0]
): Promise<BusterChatListItem[]> => {
  const { page_token = 0, page_size = 1000 } = params || {};
  return await serverFetch<BusterChatListItem[]>(`${CHATS_BASE}`, {
    params: { page_token, page_size }
  });
};

// Client-side fetch version
export const getChat = async ({ id }: { id: string }): Promise<BusterChat> => {
  return mainApi.get<BusterChat>(`${CHATS_BASE}/${id}`).then((res) => res.data);
};

// Server-side fetch version
export const getChat_server = async ({ id }: { id: string }): Promise<BusterChat> => {
  return await serverFetch<BusterChat>(`${CHATS_BASE}/${id}`);
};

export const deleteChat = async (data: string[]): Promise<void> => {
  const stringifiedData = JSON.stringify(data);
  return mainApi.delete(`${CHATS_BASE}`, { data: stringifiedData }).then((res) => res.data);
};

export const updateChat = async ({
  id,
  ...data
}: {
  id: string;
  title?: string;
  is_favorited?: boolean;
}): Promise<BusterChat> => {
  return mainApi.put<BusterChat>(`${CHATS_BASE}/${id}`, data).then((res) => res.data);
};

export const updateChatMessageFeedback = async ({
  message_id,
  ...params
}: {
  message_id: string;
  feedback: 'negative' | null;
}): Promise<BusterChat> => {
  return mainApi.put(`/messages/${message_id}`, params).then((res) => res.data);
};

export const duplicateChat = async ({
  id,
  message_id
}: {
  id: string;
  message_id?: string;
}): Promise<BusterChat> => {
  return mainApi.post(`${CHATS_BASE}/duplicate`, { id, message_id }).then((res) => res.data);
};

export const startChatFromAsset = async ({
  asset_id,
  asset_type
}: {
  asset_id: string;
  asset_type: 'metric' | 'dashboard';
}): Promise<BusterChat> => {
  return mainApi
    .post(`${CHATS_BASE}`, {
      asset_id,
      asset_type
    })
    .then((res) => res.data);
};
