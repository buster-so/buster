import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { create } from 'mutative';
import { useMemo } from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import type { IBusterChat } from '@/api/asset_interfaces/chat/iChatInterfaces';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { updateChatToIChat } from '@/lib/chat';
import type { RustApiError } from '../../errors';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection,
} from '../collections/queryRequests';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { useGetUserFavorites } from '../users/favorites';
import {
  deleteChat,
  duplicateChat,
  getChat,
  getListLogs,
  shareChat,
  unshareChat,
  updateChat,
  updateChatMessageFeedback,
  updateChatShare,
} from './requests';
import { getListChats } from './requestsV2';

export const useGetListChats = (
  filters?: Omit<Parameters<typeof getListChats>[0], 'page' | 'page_size'>
) => {
  const filtersCompiled: Parameters<typeof getListChats>[0] = useMemo(
    () => ({ admin_view: false, page: 1, page_size: 5000, ...filters }),
    [filters]
  );

  const queryFn = () => getListChats(filtersCompiled);

  return useQuery({
    ...chatQueryKeys.chatsGetList(filtersCompiled),
    queryFn,
  });
};

export const prefetchGetChatsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof getListChats>[0]
) => {
  await queryClient.prefetchQuery({
    ...chatQueryKeys.chatsGetList(params),
    queryFn: () => getListChats(params),
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

  const queryFn = () => getListLogs(filtersCompiled);

  return useQuery({
    ...chatQueryKeys.logsGetList(filtersCompiled),
    queryFn,
  });
};

export const prefetchGetLogsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof getListLogs>[0]
) => {
  await queryClient.prefetchQuery({
    ...chatQueryKeys.logsGetList(params),
    queryFn: () => getListLogs(params),
  });
};

const getChatQueryFn = (params: Parameters<typeof getChat>[0], queryClient: QueryClient) => {
  return getChat(params).then((chat) => {
    const { iChat, iChatMessages } = updateChatToIChat(chat);
    const lastMessageId = last(iChat.message_ids);

    if (!lastMessageId) return iChat;

    const lastMessage = iChatMessages[lastMessageId];
    if (lastMessage) {
      for (const responseMessage of Object.values(lastMessage.response_messages)) {
        if (responseMessage.type === 'file' && responseMessage.file_type === 'metric_file') {
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
};

export const useGetChat = <TData = IBusterChat>(
  params: Parameters<typeof getChat>[0],
  options?: Omit<UseQueryOptions<IBusterChat, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();

  return useQuery({
    ...chatQueryKeys.chatsGetChat(params.id),
    enabled: !!params.id,
    queryFn: () => getChatQueryFn(params, queryClient),
    select: options?.select,
    refetchOnWindowFocus: true,
    ...options,
  });
};

export const prefetchGetChat = async (
  params: Parameters<typeof getChat>[0],
  queryClient: QueryClient
) => {
  const query = chatQueryKeys.chatsGetChat(params.id);
  const existingData = queryClient.getQueryData(query.queryKey);

  if (!existingData) {
    await queryClient.prefetchQuery({
      ...query,
      queryFn: () => getChatQueryFn(params, queryClient),
    });
  }
  return existingData || queryClient.getQueryData(query.queryKey);
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
            ...data,
          };
        });
      }
    },
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
          feedback,
        };
      });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = useMemoizedFn(
    async ({
      useConfirmModal = true,
      data,
    }: {
      data: Parameters<typeof deleteChat>[0];
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        await deleteChat(data);
      };
      if (useConfirmModal) {
        return await openConfirmModal({
          title: 'Delete Chat',
          content: 'Are you sure you want to delete this chat?',
          onOk: method,
        });
      }
      return method();
    }
  );

  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.chatsGetList().queryKey,
        refetchType: 'all',
      });
    },
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
    ...options,
  });
};

export const useDuplicateChat = () => {
  return useMutation({
    mutationFn: duplicateChat,
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
            assets: chatIds.map((chatId) => ({ id: chatId, type: 'chat' })),
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
        refetchType: 'all',
      });
    },
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
            assets: chatIds.map((chatId) => ({ id: chatId, type: 'chat' })),
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
        refetchType: 'all',
      });
    },
  });
};

export const useShareChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareChat,
    onMutate: ({ id, params }) => {
      const queryKey = chatQueryKeys.chatsGetChat(id).queryKey;

      queryClient.setQueryData(queryKey, (previousData: IBusterChat | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: IBusterChat) => {
          draft.individual_permissions = [
            ...params.map((p) => ({
              ...p,
              name: p.name,
              avatar_url: p.avatar_url || null,
            })),
            ...(draft.individual_permissions || []),
          ].sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (_, variables) => {
      const partialMatchedKey = chatQueryKeys.chatsGetChat(variables.id).queryKey;
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all',
      });
    },
  });
};

export const useUnshareChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareChat,
    onMutate: (variables) => {
      const queryKey = chatQueryKeys.chatsGetChat(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterChat | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: IBusterChat) => {
          draft.individual_permissions = (
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || []
          ).sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (_, variables) => {
      const partialMatchedKey = chatQueryKeys.chatsGetChat(variables.id).queryKey;
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all',
      });
    },
  });
};

export const useUpdateChatShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatShare,
    onMutate: (variables) => {
      const queryKey = chatQueryKeys.chatsGetChat(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterChat | undefined) => {
        if (!previousData) return previousData;

        return create(previousData, (draft: IBusterChat) => {
          draft.individual_permissions = (
            draft.individual_permissions?.map((t) => {
              const found = variables.params.users?.find((v) => v.email === t.email);
              if (found) return { ...t, ...found };
              return t;
            }) || []
          ).sort((a, b) => a.email.localeCompare(b.email));

          if (variables.params.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.params.publicly_accessible;
          }
          if (variables.params.public_password !== undefined) {
            draft.public_password = variables.params.public_password;
          }
          if (variables.params.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.params.public_expiry_date;
          }
          if (variables.params.workspace_sharing !== undefined) {
            draft.workspace_sharing = variables.params.workspace_sharing;
          }
        });
      });
    },
    onSuccess: (data) => {
      const upgradedChat = updateChatToIChat(data).iChat;
      queryClient.setQueryData(chatQueryKeys.chatsGetChat(data.id).queryKey, upgradedChat);
    },
  });
};
