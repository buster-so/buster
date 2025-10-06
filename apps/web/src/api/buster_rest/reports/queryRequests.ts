import type { GetReportResponse, UpdateReportResponse } from '@buster/server-shared/reports';
import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { create } from 'mutative';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { silenceAssetErrors } from '@/api/response-helpers/silenece-asset-errors';
import { useProtectedAssetPassword } from '@/context/BusterAssets/useProtectedAssetStore';
import type { ApiError } from '../../errors';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection,
} from '../collections/queryRequests';
import { useGetUserFavorites } from '../users/favorites';
import { getReportAndInitializeMetrics } from './reportQueryHelpers';
import { getReportsList, updateReport } from './requests';

/**
 * Hook to get a list of reports
 */
export const useGetReportsList = (params?: Parameters<typeof getReportsList>[0]) => {
  const queryFn = () => {
    return getReportsList(params);
  };

  const res = useQuery({
    ...reportsQueryKeys.reportsGetList(params),
    queryFn,
  });

  return {
    ...res,
    data: res.data || {
      data: [],
      pagination: { page: 1, page_size: 5000, total: 0, total_pages: 0 },
    },
  };
};

/**
 * Prefetch function for reports list (server-side)
 */
export const prefetchGetReportsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof getReportsList>[0]
) => {
  await queryClient.prefetchQuery({
    ...reportsQueryKeys.reportsGetList(params),
    queryFn: () => getReportsList(params),
  });

  return queryClient;
};

export const prefetchGetReportsListClient = async (
  params: Parameters<typeof getReportsList>[0] | undefined,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...reportsQueryKeys.reportsGetList(params),
    queryFn: () => getReportsList(params),
  });

  return queryClient;
};

export const prefetchGetReport = async (
  queryClient: QueryClient,
  reportId: string,
  report_version_number: number | undefined
) => {
  const version_number = report_version_number || 'LATEST';
  const queryKey = reportsQueryKeys.reportsGetReport(reportId, version_number)?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...reportsQueryKeys.reportsGetReport(reportId, version_number || 'LATEST'),
      queryFn: () =>
        getReportAndInitializeMetrics({
          id: reportId,
          version_number: typeof version_number === 'number' ? version_number : undefined,
          password: undefined,
          queryClient,
          shouldInitializeMetrics: true,
          prefetchMetricsData: false,
        }),
      retry: silenceAssetErrors,
    });
  }

  return existingData || queryClient.getQueryData(queryKey);
};

export const usePrefetchGetReportClient = () => {
  const queryClient = useQueryClient();
  return (reportId: string, versionNumber?: number) => {
    return prefetchGetReport(queryClient, reportId, versionNumber);
  };
};

/**
 * Hook to get an individual report by ID
 */
export const useGetReport = <T = GetReportResponse>(
  { id, versionNumber }: { id: string | undefined; versionNumber?: number },
  options?: Omit<UseQueryOptions<GetReportResponse, ApiError, T>, 'queryKey' | 'queryFn'>
) => {
  const password = useProtectedAssetPassword(id || '');
  const queryClient = useQueryClient();

  return useQuery({
    ...reportsQueryKeys.reportsGetReport(id ?? '', versionNumber || 'LATEST'),
    queryFn: () => {
      return getReportAndInitializeMetrics({
        id: id ?? '',
        version_number: typeof versionNumber === 'number' ? versionNumber : undefined,
        password,
        queryClient,
        shouldInitializeMetrics: true,
        prefetchMetricsData: true,
      });
    },
    enabled: !!id,
    select: options?.select,
    ...options,
    retry: silenceAssetErrors,
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReportResponse,
    ApiError,
    Parameters<typeof updateReport>[0],
    { previousReport?: GetReportResponse }
  >({
    mutationFn: updateReport,
    onMutate: async ({ reportId, ...data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: reportsQueryKeys.reportsGetReport(reportId, 'LATEST').queryKey,
      });

      // Snapshot the previous value
      const previousReport = queryClient.getQueryData<GetReportResponse>(
        reportsQueryKeys.reportsGetReport(reportId, 'LATEST').queryKey
      );

      // Optimistically update the individual report
      if (previousReport) {
        queryClient.setQueryData(
          reportsQueryKeys.reportsGetReport(reportId, 'LATEST').queryKey,
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
          reportsQueryKeys.reportsGetReport(reportId, 'LATEST').queryKey,
          context.previousReport
        );
      }
    },
    onSuccess: (data, { reportId, ...updateData }, ctx) => {
      // Update the individual report cache with server response
      queryClient.setQueryData(
        reportsQueryKeys.reportsGetReport(reportId, 'LATEST').queryKey,
        data
      );

      const nameChanged =
        updateData.name !== undefined &&
        ctx?.previousReport?.name !== undefined &&
        updateData.name !== ctx?.previousReport?.name;

      // Invalidate the list cache to ensure it's fresh
      if (nameChanged) {
        const listQueryKey = reportsQueryKeys.reportsGetList().queryKey;
        const hasActiveQuery = queryClient.getQueryCache().find({
          queryKey: listQueryKey,
          exact: true,
          type: 'active',
        });

        if (hasActiveQuery) {
          queryClient.invalidateQueries({
            queryKey: listQueryKey,
            refetchType: 'all',
          });
        } else {
          prefetchGetReportsListClient(undefined, queryClient);
        }
      }
    },
  });
};

export const useAddReportToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const addReportToCollection = async ({
    reportIds,
    collectionIds,
  }: {
    reportIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        addAssetToCollection({
          id: collectionId,
          assets: reportIds.map((reportId) => ({ id: reportId, type: 'report_file' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: addReportToCollection,
    onMutate: ({ reportIds, collectionIds }) => {
      reportIds.forEach((id) => {
        queryClient.setQueryData(
          reportsQueryKeys.reportsGetReport(id, 'LATEST').queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            const newData: GetReportResponse = create(oldData, (draft) => {
              // Add new collections, then deduplicate by collection id
              const existingCollections = draft.collections || [];
              const newCollections = collectionIds.map((id) => ({ id, name: '' }));
              // Merge and deduplicate by id
              const merged = [...existingCollections, ...newCollections];
              const deduped = merged.filter(
                (col, idx, arr) => arr.findIndex((c) => c.id === col.id) === idx
              );

              draft.collections = deduped;
            });
            return newData;
          }
        );
      });
    },
    onSuccess: (_, { collectionIds, reportIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
        });
      });

      reportIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: reportsQueryKeys.reportsGetReport(id, 'LATEST').queryKey,
        });
      });
    },
  });
};

export const useRemoveReportFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const removeReportFromCollection = async ({
    reportIds,
    collectionIds,
  }: {
    reportIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        removeAssetFromCollection({
          id: collectionId,
          assets: reportIds.map((reportId) => ({ id: reportId, type: 'report_file' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: removeReportFromCollection,
    onSuccess: (_, { collectionIds, reportIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
        });
      });

      reportIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: reportsQueryKeys.reportsGetReport(id, 'LATEST').queryKey,
        });
      });
    },
  });
};
