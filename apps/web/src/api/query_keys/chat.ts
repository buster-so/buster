import type { ChatListItem } from '@buster/server-shared/chats';
import { queryOptions } from '@tanstack/react-query';
import type { BusterChatMessage, IBusterChat } from '@/api/asset_interfaces/chat';
import type { BusterMetricData } from '@/api/asset_interfaces/metric/metricDataInterfaces';
import type { getListLogs } from '@/api/buster_rest/chats/requests';
import type { getListChats } from '@/api/buster_rest/chats/requestsV2';

const chatsGetChat = (chatId: string) =>
  queryOptions<IBusterChat>({
    queryKey: ['chats', 'get', chatId] as const,
    enabled: !!chatId,
    staleTime: 60 * 1000, // 1 minute
  });

const chatsMessages = (messageId: string) =>
  queryOptions<BusterChatMessage>({
    queryKey: ['chats', 'messages', messageId] as const,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!messageId,
  });

const chatsMessagesFetchingData = (messageId: string) =>
  queryOptions<BusterMetricData>({
    queryKey: ['chats', 'messages-data', messageId] as const,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!messageId,
  });

const chatsGetList = (filters?: Omit<Parameters<typeof getListChats>[0], 'page' | 'page_size'>) =>
  queryOptions<ChatListItem[]>({
    queryKey: [
      'chats',
      'list',
      filters || { page_token: 0, page_size: 5000, admin_view: false },
    ] as const,
    staleTime: 60 * 1000, // 1 minute
    initialData: [],
    initialDataUpdatedAt: 0,
  });

const chatsBlackBoxMessages = (messageId: string) =>
  queryOptions<string | null>({
    queryKey: ['chats', 'messages', messageId, 'local-only-black-box'] as const,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: false, //this is local
    queryFn: () => Promise.resolve(null),
  });

const logsGetList = (
  filters?: Omit<Parameters<typeof getListLogs>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<ChatListItem[]>({
    queryKey: ['logs', 'list', filters || { page_token: 0, page_size: 3500 }] as const,
    staleTime: 60 * 1000, // 1 minute
    initialData: [],
    initialDataUpdatedAt: 0,
  });

export const chatQueryKeys = {
  chatsGetChat,
  chatsGetList,
  chatsMessages,
  chatsMessagesFetchingData,
  chatsBlackBoxMessages,
  logsGetList,
};
