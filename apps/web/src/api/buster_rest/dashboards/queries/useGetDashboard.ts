import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import {
  type QueryClient,
  type UseQueryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ApiError } from '@/api/errors';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import {
  setProtectedAssetPasswordError,
  useProtectedAssetPassword,
} from '@/context/BusterAssets/useProtectedAssetStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { isQueryStale } from '@/lib/query';
import { hasOrganizationId } from '../../users/userQueryHelpers';
import { getDashboardAndInitializeMetrics } from '../dashboardQueryHelpers';
import { useGetDashboardVersionNumber } from '../dashboardVersionNumber';
import { dashboardsGetList } from '../requests';

/**
 * useGetDashboard
 * Fetches a dashboard by id and selected version number. Also primes the cache
 * for the latest version to ensure version switching is seamless.
 */
export const useGetDashboard = <TData = GetDashboardResponse>(
  {
    id: idProp,
    versionNumber: versionNumberProp,
  }: { id: string | undefined; versionNumber: number | 'LATEST' | undefined },
  params?: Omit<UseQueryOptions<GetDashboardResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const id = idProp || '';
  const password = useProtectedAssetPassword(id);
  const queryClient = useQueryClient();
  // const queryFn = useGetDashboardAndInitializeMetrics();

  const { selectedVersionNumber } = useGetDashboardVersionNumber(id, versionNumberProp);

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST'),
    queryFn: () =>
      getDashboardAndInitializeMetrics({
        id,
        version_number: 'LATEST',
        password,
        queryClient,
        shouldInitializeMetrics: true,
        prefetchMetricsData: true,
      }),
    enabled: true,
    retry(_failureCount, error) {
      if (error?.message !== undefined) {
        setProtectedAssetPasswordError({
          assetId: id,
          error: error.message || 'An error occurred',
        });
      }
      return false;
    },
    select: undefined,
    ...params,
  });

  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id, selectedVersionNumber),
    queryFn: () =>
      getDashboardAndInitializeMetrics({
        id,
        version_number: selectedVersionNumber,
        password,
        queryClient,
        shouldInitializeMetrics: true,
        prefetchMetricsData: true,
      }),
    enabled: isFetchedInitial && !isErrorInitial,
    select: params?.select,
  });
};

/**
 * usePrefetchGetDashboardClient
 * Returns a function that will prefetch a dashboard if its cache entry is stale.
 */
export const usePrefetchGetDashboardClient = <TData = GetDashboardResponse>(
  params?: Omit<UseQueryOptions<GetDashboardResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();

  return useMemoizedFn((id: string, versionNumber: number | 'LATEST') => {
    const getDashboardQueryKey = dashboardQueryKeys.dashboardGetDashboard(id, versionNumber);
    const isStale = isQueryStale(getDashboardQueryKey, queryClient) || params?.staleTime === 0;
    if (!isStale) return;
    return queryClient.prefetchQuery({
      ...dashboardQueryKeys.dashboardGetDashboard(id, versionNumber),
      queryFn: () =>
        getDashboardAndInitializeMetrics({
          id,
          version_number: 'LATEST',
          password: undefined,
          queryClient,
          shouldInitializeMetrics: true,
          prefetchMetricsData: false,
        }),
      ...params,
    });
  });
};

/**
 * useGetDashboardsList
 * Returns the dashboards list using a compiled set of filters.
 */
export const useGetDashboardsList = (
  params: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof dashboardsGetList>>, ApiError>,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const filters = useMemo(() => {
    return {
      ...params,
      page_token: 0,
      page_size: 3500,
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(filters),
    queryFn: () => dashboardsGetList(filters),
    ...options,
  });
};

/**
 * prefetchGetDashboardsList
 * Prefetches the dashboards list if it is stale and the org id is present.
 */
export const prefetchGetDashboardsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof dashboardsGetList>[0]
) => {
  const options = dashboardQueryKeys.dashboardGetList(params);
  const isStale = isQueryStale(options, queryClient);
  if (!isStale || !hasOrganizationId(queryClient)) return queryClient;

  const lastQueryKey = options.queryKey[options.queryKey.length - 1];
  const compiledParams = lastQueryKey as Parameters<typeof dashboardsGetList>[0];

  await queryClient.prefetchQuery({
    ...options,
    queryFn: () => dashboardsGetList(compiledParams),
  });

  return queryClient;
};

export const prefetchGetDashboard = async ({
  queryClient,
  id,
  version_number,
}: Parameters<typeof getDashboardAndInitializeMetrics>[0]) => {
  const chosenVersionNumber = version_number || 'LATEST';
  const queryFn = async () =>
    getDashboardAndInitializeMetrics({
      id,
      version_number: chosenVersionNumber,
      queryClient,
      prefetchMetricsData: false,
      shouldInitializeMetrics: true,
    });

  const queryKey = dashboardQueryKeys.dashboardGetDashboard(id, chosenVersionNumber)?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...dashboardQueryKeys.dashboardGetDashboard(id, chosenVersionNumber),
      queryFn,
    });
  }
  return existingData || queryClient.getQueryData(queryKey);
};
