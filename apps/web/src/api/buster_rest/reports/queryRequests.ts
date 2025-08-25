import {
  QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { create } from 'mutative';
import { useMemoizedFn } from '@/hooks';
import { queryKeys } from '@/api/query_keys';
import type { RustApiError } from '../errors';
import type { GetReportResponse, UpdateReportResponse } from '@buster/server-shared/reports';
import {
  getReportsList,
  getReportsList_server,
  getReportById,
  getReportById_server,
  updateReport,
  shareReport,
  unshareReport,
  updateReportShare
} from './requests';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import { useGetUserFavorites } from '../users/favorites';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { reportsQueryKeys } from '@/api/query_keys/reports';

/**
 * Hook to get a list of reports
 */
export const useGetReportsList = (params?: Parameters<typeof getReportsList>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getReportsList(params);
  });

  const res = useQuery({
    ...queryKeys.reportsGetList(params),
    queryFn
  });

  return {
    ...res,
    data: res.data || {
      data: [],
      pagination: { page: 1, page_size: 5000, total: 0, total_pages: 0 }
    }
  };
};

/**
 * Prefetch function for reports list (server-side)
 */
export const prefetchGetReportsList = async (
  params?: Parameters<typeof getReportsList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetList(params),
    queryFn: () => getReportsList_server(params)
  });

  return queryClient;
};

export const prefetchGetReportsListClient = async (
  params?: Parameters<typeof getReportsList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetList(params),
    queryFn: () => getReportsList(params)
  });

  return queryClient;
};

/**
 * Hook to get an individual report by ID
 */
export const useGetReport = <T = GetReportResponse>(
  { reportId, versionNumber }: { reportId: string | undefined; versionNumber?: number },
  options?: Omit<UseQueryOptions<GetReportResponse, RustApiError, T>, 'queryKey' | 'queryFn'>
) => {
  const queryFn = useMemoizedFn(() => {
    return getReportById(reportId!);
  });

  return useQuery({
    ...queryKeys.reportsGetReport(reportId!, versionNumber),
    queryFn,
    enabled: !!reportId,
    select: options?.select,
    ...options
  });
};

/**
 * Prefetch function for individual report (server-side)
 */
export const prefetchGetReportById = async (reportId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.reportsGetReport(reportId),
    queryFn: () => getReportById_server(reportId)
  });

  return queryClient;
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReportResponse,
    RustApiError,
    Parameters<typeof updateReport>[0],
    { previousReport?: GetReportResponse }
  >({
    mutationFn: updateReport,
    onMutate: async ({ reportId, ...data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.reportsGetReport(reportId).queryKey
      });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData<GetReportResponse>(
        queryKeys.reportsGetReport(reportId).queryKey
      );

      // Optimistically update the individual report
      if (previousReport) {
        queryClient.setQueryData(
          queryKeys.reportsGetReport(reportId).queryKey,
          create(previousReport, (draft) => {
            if (data.name !== undefined) draft.name = data.name;
            if (data.content !== undefined) draft.content = data.content;
          })
        );
      }

      // Return context with previous values
      return { previousReport };
    },
    onError: (_err, { reportId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousReport) {
        queryClient.setQueryData(
          queryKeys.reportsGetReport(reportId).queryKey,
          context.previousReport
        );
      }
    },
    onSuccess: (data, { reportId, ...updateData }, ctx) => {
      // Update the individual report cache with server response
      queryClient.setQueryData(queryKeys.reportsGetReport(reportId).queryKey, data);

      const nameChanged =
        updateData.name !== undefined &&
        ctx?.previousReport?.name !== undefined &&
        updateData.name !== ctx?.previousReport?.name;

      // Invalidate the list cache to ensure it's fresh
      if (nameChanged) {
        const listQueryKey = queryKeys.reportsGetList().queryKey;
        const hasActiveQuery = queryClient.getQueryCache().find({
          queryKey: listQueryKey,
          exact: true,
          type: 'active'
        });

        if (hasActiveQuery) {
          queryClient.invalidateQueries({
            queryKey: listQueryKey,
            refetchType: 'all'
          });
        } else {
          prefetchGetReportsListClient();
        }
      }
    }
  });
};

export const useAddReportToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const addReportToCollection = useMemoizedFn(
    async ({ reportIds, collectionIds }: { reportIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: reportIds.map((reportId) => ({ id: reportId, type: 'report' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: addReportToCollection,
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

export const useRemoveReportFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const removeReportFromCollection = useMemoizedFn(
    async ({ reportIds, collectionIds }: { reportIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: reportIds.map((reportId) => ({ id: reportId, type: 'report' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: removeReportFromCollection,
    onSuccess: (_, { collectionIds, reportIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey
        });
      });

      reportIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: reportsQueryKeys.reportsGetReport(id).queryKey
        });
      });
    }
  });
};

/**
 * Hook to share a report with users
 */
export const useShareReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareReport,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: reportsQueryKeys.reportsGetReport(variables.id).queryKey
      });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData<GetReportResponse>(
        reportsQueryKeys.reportsGetReport(variables.id).queryKey
      );

      // Optimistically update the report with new permissions
      queryClient.setQueryData(
        reportsQueryKeys.reportsGetReport(variables.id).queryKey,
        (old: GetReportResponse | undefined) => {
          if (!old) return old;
          return create(old, (draft) => {
            // Add new permissions optimistically
            variables.params.forEach((shareRequest) => {
              const exists = draft.individual_permissions?.some(
                (p) => p.email === shareRequest.email
              );
              if (!exists) {
                draft.individual_permissions = [
                  ...(draft.individual_permissions || []),
                  {
                    email: shareRequest.email,
                    name: shareRequest.name || shareRequest.email,
                    role: shareRequest.role,
                    avatar_url: shareRequest.avatar_url || null
                  }
                ];
              }
            });
          });
        }
      );

      // Return a context object with the snapshotted value
      return { previousReport };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReport) {
        queryClient.setQueryData(
          reportsQueryKeys.reportsGetReport(variables.id).queryKey,
          context.previousReport
        );
      }
    },
    onSuccess: (_, { id }) => {
      // Invalidate the report cache to get updated sharing info
      queryClient.invalidateQueries({
        queryKey: reportsQueryKeys.reportsGetReport(id).queryKey
      });
    }
  });
};

/**
 * Hook to remove sharing permissions from a report
 */
export const useUnshareReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unshareReport,
    onMutate: (variables) => {
      const queryKey = reportsQueryKeys.reportsGetReport(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: GetReportResponse | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          if (draft.individual_permissions) {
            draft.individual_permissions = draft.individual_permissions.filter(
              (p) => !variables.data.includes(p.email)
            );
          }
        });
      });
    },
    onSuccess: (_, { id }) => {
      // Invalidate the report cache to ensure consistency
      queryClient.invalidateQueries({
        queryKey: reportsQueryKeys.reportsGetReport(id).queryKey
      });
    }
  });
};

/**
 * Hook to update report sharing settings
 */
export const useUpdateReportShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateReportShare,
    onMutate: (variables) => {
      const queryKey = reportsQueryKeys.reportsGetReport(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData: GetReportResponse | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          if (variables.params.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.params.publicly_accessible;
          }
          if (variables.params.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.params.public_expiry_date;
          }
          if (variables.params.public_password !== undefined) {
            draft.public_password = variables.params.public_password;
          }
          if (variables.params.workspace_sharing !== undefined) {
            draft.workspace_sharing = variables.params.workspace_sharing;
          }
        });
      });
    },
    onSuccess: (data, { id }) => {
      // Update the cache with the server response
      queryClient.setQueryData(reportsQueryKeys.reportsGetReport(id).queryKey, data);
    }
  });
};
