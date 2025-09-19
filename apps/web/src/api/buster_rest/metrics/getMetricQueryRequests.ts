import {
  type QueryClient,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useCallback } from 'react';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricDataExtended,
} from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import {
  getProtectedAssetPassword,
  setProtectedAssetPasswordError,
} from '@/context/BusterAssets/useProtectedAssetStore';
import { setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import type { RustApiError } from '../../errors';
import {
  useGetLatestMetricVersionMemoized,
  useGetMetricVersionNumber,
} from './metricVersionNumber';
import { downloadMetricFile, getMetric, getMetricData } from './requests';

const getMetricQueryFn = async ({
  id,
  version,
  password,
  queryClient,
}: {
  id: string | undefined;
  version: number | undefined | 'LATEST';
  password: string | undefined;
  queryClient: QueryClient;
}) => {
  const chosenVersionNumber: number | undefined = version === 'LATEST' ? undefined : version;
  const result = await getMetric({
    id: id || '',
    password,
    version_number: chosenVersionNumber,
  });
  const updatedMetric = upgradeMetricToIMetric(result, null);
  const isLatestVersion =
    updatedMetric.version_number === last(updatedMetric.versions)?.version_number;

  if (isLatestVersion) {
    setOriginalMetric(updatedMetric);
  }

  if (result?.version_number) {
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(result.id, result.version_number).queryKey,
      updatedMetric
    );
  }
  return updatedMetric;
};

export const useGetMetric = <TData = BusterMetric>(
  {
    id,
    versionNumber: versionNumberProp,
  }: {
    id: string | undefined;
    versionNumber?: number | 'LATEST'; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<BusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const password = getProtectedAssetPassword(id || '');

  const { selectedVersionNumber, latestVersionNumber } = useGetMetricVersionNumber(
    id || '',
    versionNumberProp
  );

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', 'LATEST'),
    queryFn: () => getMetricQueryFn({ id, version: 'LATEST', password, queryClient }),
    retry(_failureCount, error) {
      if (error?.message !== undefined && id) {
        setProtectedAssetPasswordError({
          assetId: id,
          error: error.message || 'An error occurred',
        });
      }
      return false;
    },
    enabled: (params?.enabled ?? true) && !!id,
    select: undefined,
    ...params,
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', selectedVersionNumber),
    enabled: !!id && !!latestVersionNumber && isFetchedInitial && !isErrorInitial,
    queryFn: () => getMetricQueryFn({ id, version: selectedVersionNumber, password, queryClient }),
    select: params?.select,
  });
};

export const usePrefetchGetMetricClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(
    async ({ id, versionNumber }: { id: string; versionNumber: number | undefined }) => {
      return prefetchGetMetric(queryClient, { id, version_number: versionNumber });
    }
  );
};

export const prefetchGetMetric = async (
  queryClient: QueryClient,
  params: Parameters<typeof getMetric>[0]
): Promise<BusterMetric | undefined> => {
  const { id, version_number } = params;
  const queryKey = metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST')?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);

  if (!existingData && id) {
    await queryClient.prefetchQuery({
      ...metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST'),
      queryFn: () =>
        getMetricQueryFn({
          id,
          version: params.version_number,
          password: undefined,
          queryClient,
        }),
    });
  }

  return existingData || queryClient.getQueryData(queryKey);
};

export const useGetMetricData = <TData = BusterMetricDataExtended>(
  {
    id = '',
    versionNumber: versionNumberProp,
    cacheId,
  }: {
    id: string | undefined;
    versionNumber?: number | 'LATEST';
    cacheId?: string;
  },
  params?: Omit<UseQueryOptions<BusterMetricData, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const password = getProtectedAssetPassword(id);
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  const { selectedVersionNumber } = useGetMetricVersionNumber(id, versionNumberProp);
  const {
    isFetched: isFetchedMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    data: metricId,
  } = useGetMetric(
    { id, versionNumber: selectedVersionNumber },
    { select: useCallback((x: BusterMetric) => x?.id, []), enabled: params?.enabled !== false }
  );

  const queryFn = async () => {
    const chosenVersionNumber: number | undefined =
      versionNumberProp === 'LATEST' ? undefined : versionNumberProp;
    const result = await getMetricData({
      id,
      version_number: chosenVersionNumber || undefined,
      password,
      report_file_id: cacheId,
    });
    const latestVersionNumber = getLatestMetricVersion(id);
    const isLatest =
      versionNumberProp === 'LATEST' ||
      !versionNumberProp ||
      latestVersionNumber === chosenVersionNumber;
    if (isLatest) {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetData(id, 'LATEST', cacheId).queryKey,
        result
      );
    }
    return result;
  };

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id || '', versionNumberProp || 'LATEST', cacheId),
    queryFn,
    enabled: () => {
      return (
        !!id &&
        isFetchedMetric &&
        !isErrorMetric &&
        !!metricId &&
        !!dataUpdatedAt &&
        !!selectedVersionNumber
      );
    },
    select: params?.select,
    ...params,
  });
};

export const prefetchGetMetricDataClient = async (
  { id, version_number, cache_id }: { id: string; version_number: number; cache_id?: string },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetData(id, version_number, cache_id);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData && id) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetricData({ id, version_number, report_file_id: cache_id }),
    });
  }
};

//used in list version histories
export const usePrefetchGetMetricDataClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(
    ({ id, versionNumber, cache_id }: { id: string; versionNumber: number; cache_id?: string }) =>
      prefetchGetMetricDataClient({ id, version_number: versionNumber, cache_id }, queryClient)
  );
};

export const useDownloadMetricFile = () => {
  return useMutation({
    mutationFn: downloadMetricFile,
  });
};
