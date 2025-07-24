import {
  QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useMemo } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces/chat/iChatInterfaces';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { updateChatToIChat } from '@/lib/chat';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import type { RustApiError } from '../errors';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { useGetUserFavorites } from '../users/favorites';
import {
  deleteChat,
  duplicateChat,
  getChat,
  getChat_server,
  getListChats,
  getListChats_server,
  getListLogs,
  updateChat,
  updateChatMessageFeedback
} from './requests';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';

export const useGetListChats = (
  filters?: Omit<Parameters<typeof getListChats>[0], 'page_token' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListChats>[0] = useMemo(
    () => ({ admin_view: false, page_token: 0, page_size: 5000, ...filters }),
    [filters]
  );

  const queryFn = useMemoizedFn(() => getListChats(filtersCompiled));

  return useQuery({
    ...chatQueryKeys.chatsGetList(filtersCompiled),
    queryFn
  });
};

export const prefetchGetChatsList = async (
  queryClientProp?: QueryClient,
  params?: Parameters<typeof getListChats>[0]
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...chatQueryKeys.chatsGetList(params),
    queryFn: () => getListChats_server(params)
  });

  return queryClient;
};

export const useGetListLogs = (
  filters?: Omit<Parameters<typeof getListLogs>[0], 'page_token' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListLogs>[0] = useMemo(
    () => ({ page_token: 0, page_size: 3500, ...filters }),
    [filters]
  );

  const queryFn = useMemoizedFn(() => getListLogs(filtersCompiled));

  return useQuery({
    ...chatQueryKeys.logsGetList(filtersCompiled),
    queryFn
  });
};

export const useGetChat = <TData = IBusterChat>(
  params: Parameters<typeof getChat>[0],
  options?: Omit<UseQueryOptions<IBusterChat, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const queryFn = useMemoizedFn(() => {
    return getChat(params).then((chat) => {
      const { iChat, iChatMessages } = updateChatToIChat(chat);
      const lastMessageId = last(iChat.message_ids);

      if (!lastMessageId) return iChat;

      const lastMessage = iChatMessages[lastMessageId];
      if (lastMessage) {
        for (const responseMessage of Object.values(lastMessage.response_messages)) {
          if (responseMessage.type === 'file' && responseMessage.file_type === 'metric') {
            prefetchGetMetricDataClient(
              { id: responseMessage.id, version_number: responseMessage.version_number },
              queryClient
            );
          }
        }
      }

      for (const messageId of iChat.message_ids) {
        queryClient.setQueryData(
          chatQueryKeys.chatsMessages(messageId).queryKey,
          iChatMessages[messageId]
        );
      }

      return iChat;
    });
  });

  return useQuery({
    ...chatQueryKeys.chatsGetChat(params.id),
    enabled: !!params.id,
    queryFn,
    select: options?.select,
    refetchOnWindowFocus: true,
    ...options
  });
};

export const prefetchGetChatServer = async (
  params: Parameters<typeof getChat>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...chatQueryKeys.chatsGetChat(params.id),
    queryFn: async () => {
      return await getChat_server(params).then((chat) => {
        return updateChatToIChat(chat).iChat;
      });
    }
  });

  return queryClient;
};

export const prefetchGetChat = async (
  params: Parameters<typeof getChat>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...chatQueryKeys.chatsGetChat(params.id),
    queryFn: () => getChat(params)
  });

  return queryClient;
};

export const useUpdateChat = (params?: { updateToServer?: boolean }) => {
  const queryClient = useQueryClient();
  const { updateToServer = true } = params || {};

  return useMutation({
    mutationFn: async (p: Parameters<typeof updateChat>[0]) => {
      if (updateToServer) return updateChat(p);
      return p;
    },
    onMutate: (data) => {
      //this is actually handled in @useChatUpdate file
      //except for the chat title and feedback
      if (data.title) {
        const options = chatQueryKeys.chatsGetChat(data.id);
        queryClient.setQueryData(options.queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            ...data
          };
        });
      }
    }
  });
};

export const useUpdateChatMessageFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateChatMessageFeedback,
    onMutate: ({ message_id, feedback }) => {
      const options = chatQueryKeys.chatsMessages(message_id);
      queryClient.setQueryData(options.queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          feedback
        };
      });
    },
    onSuccess: (data) => {
      //
    }
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = useMemoizedFn(
    async ({
      useConfirmModal = true,
      data
    }: {
      data: Parameters<typeof deleteChat>[0];
      useConfirmModal?: boolean;
    }) => {
      const method = () => deleteChat(data);
      if (useConfirmModal) {
        const result = await openConfirmModal({
          title: 'Delete Chat',
          content: 'Are you sure you want to delete this chat?',
          onOk: method
        });
        return {
          wasCancelled: result === undefined,
          result
        };
      }
      const result = await method();
      return {
        wasCancelled: false,
        result
      };
    }
  );

  return useMutation({
    mutationFn,
    onSuccess(data) {
      if (!data.wasCancelled) {
        queryClient.invalidateQueries({
          queryKey: chatQueryKeys.chatsGetList().queryKey,
          refetchType: 'all'
        });
      }
    }
  });
};

export const useGetChatMessageMemoized = () => {
  const queryClient = useQueryClient();

  const getChatMessageMemoized = useMemoizedFn((messageId: string) => {
    const options = chatQueryKeys.chatsMessages(messageId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<BusterChatMessage>(queryKey);
  });

  return getChatMessageMemoized;
};

export const useGetChatMemoized = () => {
  const queryClient = useQueryClient();

  const getChatMemoized = useMemoizedFn((chatId: string) => {
    const options = chatQueryKeys.chatsGetChat(chatId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData<IBusterChat>(queryKey);
  });

  return getChatMemoized;
};

export const useGetChatMessage = <TData = BusterChatMessage>(
  messageId: string,
  options?: Omit<UseQueryOptions<BusterChatMessage, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...chatQueryKeys.chatsMessages(messageId),
    enabled: false, //this will come from the chat
    select: options?.select,
    ...options
  });
};

export const useDuplicateChat = () => {
  return useMutation({
    mutationFn: duplicateChat
  });
};

export const useSaveChatToCollections = () => {
  const queryClient = useQueryClient();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();

  const saveChatToCollection = useMemoizedFn(
    async ({ chatIds, collectionIds }: { chatIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: chatIds.map((chatId) => ({ id: chatId, type: 'chat' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: saveChatToCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all'
      });
    }
  });
};

export const useRemoveChatFromCollections = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const queryClient = useQueryClient();

  const removeChatFromCollection = useMemoizedFn(
    async ({ chatIds, collectionIds }: { chatIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: chatIds.map((chatId) => ({ id: chatId, type: 'chat' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: removeChatFromCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all'
      });
    }
  });
};
