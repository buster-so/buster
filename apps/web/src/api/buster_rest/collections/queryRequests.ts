import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { create } from 'mutative';
import { useMemo } from 'react';
import type { BusterCollection } from '@/api/asset_interfaces/collection';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { hasOrganizationId, isQueryStale } from '@/lib';
import type { RustApiError } from '../errors';
import {
  addAssetToCollection,
  collectionsCreateCollection,
  collectionsDeleteCollection,
  collectionsGetCollection,
  collectionsGetList,
  collectionsUpdateCollection,
  removeAssetFromCollection,
  shareCollection,
  unshareCollection,
  updateCollectionShare
} from './requests';
import type { ShareAssetType } from '@buster/server-shared/share';

export const useGetCollectionsList = (
  filters: Omit<Parameters<typeof collectionsGetList>[0], 'page_token' | 'page_size'>,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof collectionsGetList>>, RustApiError>,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const payload = useMemo(() => {
    return { ...filters, page_token: 0, page_size: 3500 };
  }, [filters]);

  return useQuery({
    ...collectionQueryKeys.collectionsGetList(payload),
    queryFn: () => collectionsGetList(payload),
    ...options
  });
};

export const prefetchGetCollectionsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof collectionsGetList>[0]
) => {
  const options = collectionQueryKeys.collectionsGetList(params);
  const isStale = isQueryStale(options, queryClient);
  if (!isStale || !hasOrganizationId(queryClient)) return queryClient;

  const lastQueryKey = options.queryKey[options.queryKey.length - 1];
  const compiledParams = lastQueryKey as Parameters<typeof collectionsGetList>[0];

  await queryClient.prefetchQuery({
    ...options,
    queryFn: () => collectionsGetList(compiledParams)
  });

  return queryClient;
};

const useFetchCollection = () => {
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  return useMemoizedFn(async (collectionId: string) => {
    const { password } = getAssetPassword(collectionId);
    return collectionsGetCollection({ id: collectionId, password });
  });
};

export const useGetCollection = <T = BusterCollection>(
  collectionId: string | undefined,
  params?: Omit<UseQueryOptions<BusterCollection, RustApiError, T>, 'queryKey' | 'queryFn'>
) => {
  const fetchCollection = useFetchCollection();
  return useQuery({
    ...collectionQueryKeys.collectionsGetCollection(collectionId || ''),
    queryFn: () => {
      return fetchCollection(collectionId || '');
    },
    enabled: !!collectionId,
    select: params?.select,
    ...params
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsCreateCollection,
    onSuccess: (collection) => {
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.collectionsGetList().queryKey,
        refetchType: 'all'
      });
      queryClient.setQueryData(
        collectionQueryKeys.collectionsGetCollection(collection.id).queryKey,
        collection
      );
    }
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsUpdateCollection,
    onMutate: (variables) => {
      if (!variables.id) return;
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        if (!v) return v;
        return {
          ...v,
          name: variables.name || v.name || ''
        };
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        collectionQueryKeys.collectionsGetCollection(data.id).queryKey,
        data
      );
    }
  });
};

export const useDeleteCollection = () => {
  const { openConfirmModal } = useBusterNotifications();
  const queryClient = useQueryClient();

  const deleteCollection = useMemoizedFn(
    async ({
      id,
      useConfirmModal = true
    }: {
      useConfirmModal?: boolean;
      id: string | string[];
    }) => {
      const ids = Array.isArray(id) ? id : [id];
      const deleteMethod = async () => {
        await collectionsDeleteCollection({ ids });
      };

      if (useConfirmModal) {
        return await openConfirmModal({
          title: 'Delete Collection',
          content: 'Are you sure you want to delete this collection?',
          onOk: deleteMethod
        });
      }

      return deleteMethod();
    }
  );

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.collectionsGetList().queryKey,
        refetchType: 'all'
      });
    }
  });
};

export const useShareCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareCollection,
    onMutate: ({ params, id }) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: BusterCollection) => {
          draft.individual_permissions = [
            ...params.map((p) => ({ ...p })),
            ...(draft.individual_permissions || [])
          ].sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (data) => {
      const partialMatchedKey = collectionQueryKeys
        .collectionsGetCollection(data)
        .queryKey.slice(0, -1);
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all'
      });
    }
  });
};

export const useUnshareCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: BusterCollection) => {
          draft.individual_permissions = (
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || []
          ).sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        collectionQueryKeys.collectionsGetCollection(data.id).queryKey,
        data
      );
    }
  });
};

export const useUpdateCollectionShare = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCollectionShare,
    onMutate: ({ params, id }) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = (
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return { ...t, ...found };
              return t;
            }) || []
          ).sort((a, b) => a.email.localeCompare(b.email));

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
          if (params.workspace_sharing !== undefined) {
            draft.workspace_sharing = params.workspace_sharing;
          }
        });
      });
    }
  });
};

export const useAddAssetToCollection = (useInvalidate = true) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addAssetToCollection,
    onSuccess: (_, variables) => {
      if (useInvalidate) {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(variables.id).queryKey,
          refetchType: 'all'
        });
      }
    }
  });
};

export const useRemoveAssetFromCollection = (useInvalidate = true) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAssetFromCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      const previousData = queryClient.getQueryData<BusterCollection>(queryKey);
      if (!previousData) return;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        const ids = variables.assets.map((a) => a.id);
        return create(previousData, (draft) => {
          draft.assets = draft.assets?.filter((a) => !ids.includes(a.id)) || [];
        });
      });
    },
    onSuccess: (_, variables) => {
      if (useInvalidate) {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(variables.id).queryKey,
          refetchType: 'all'
        });
      }
    }
  });
};

export const useAddAndRemoveAssetsFromCollection = () => {
  const queryClient = useQueryClient();
  const fetchCollection = useFetchCollection();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection(false);
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection(false);

  const addAndRemoveAssetsToCollection = useMemoizedFn(
    async (variables: {
      collectionId: string;
      assets: {
        type: Exclude<ShareAssetType, 'collection'>;
        id: string;
      }[];
    }) => {
      let currentCollection = queryClient.getQueryData<BusterCollection>(
        collectionQueryKeys.collectionsGetCollection(variables.collectionId).queryKey
      );
      if (!currentCollection) {
        currentCollection = await fetchCollection(variables.collectionId);
        queryClient.setQueryData(
          collectionQueryKeys.collectionsGetCollection(variables.collectionId).queryKey,
          currentCollection
        );
      }

      if (!currentCollection) throw new Error('Collection not found');

      const removedAssets =
        currentCollection.assets
          ?.filter((a) => !variables.assets.some((b) => b.id === a.id))
          .map((a) => ({
            type: a.asset_type as Exclude<ShareAssetType, 'collection'>,
            id: a.id
          })) || [];
      const addedAssets = variables.assets.filter(
        (a) => !currentCollection.assets?.some((b) => b.id === a.id)
      );

      await Promise.all([
        addedAssets.length > 0 &&
          addAssetToCollection({
            id: variables.collectionId,
            assets: addedAssets
          }),
        removedAssets.length > 0 &&
          removeAssetFromCollection({
            id: variables.collectionId,
            assets: removedAssets
          })
      ]);
    }
  );

  return useMutation({
    mutationFn: addAndRemoveAssetsToCollection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.collectionsGetCollection(variables.collectionId).queryKey,
        refetchType: 'all'
      });
    }
  });
};
