import {
  type QueryClient,
  type UseQueryOptions,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import last from 'lodash/last';
import type {
  BusterMetric,
  BusterMetricData,
  BusterMetricDataExtended
} from '@/api/asset_interfaces/metric';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useOriginalMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import type { RustApiError } from '../errors';
import { useGetMetricVersionNumber, useMetricQueryStore } from './metricQueryStore';
import { getMetric, getMetricData } from './requests';

export const useGetMetric = <TData = BusterMetric>(
  {
    id,
    versionNumber: versionNumberProp
  }: {
    id: string | undefined;
    versionNumber?: number | null; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<BusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const onSetLatestMetricVersion = useMetricQueryStore((x) => x.onSetLatestMetricVersion);
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { password } = getAssetPassword(id || '');

  const { selectedVersionNumber, paramVersionNumber, latestVersionNumber } =
    useGetMetricVersionNumber({
      metricId: id,
      versionNumber: versionNumberProp
    });

  const initialOptions = metricsQueryKeys.metricsGetMetric(id || '', paramVersionNumber || null);

  const initialQueryFn = useMemoizedFn(async (version?: number | null) => {
    const result = await getMetric({
      id: id || '',
      password,
      version_number: version === null ? undefined : version
    });
    const updatedMetric = upgradeMetricToIMetric(result, null);
    const isLatestVersion =
      updatedMetric.version_number === last(updatedMetric.versions)?.version_number;
    if (isLatestVersion) {
      setOriginalMetric(updatedMetric);
    }
    onSetLatestMetricVersion(id || '', last(updatedMetric.versions)?.version_number || 1);
    if (result?.version_number) {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(result.id, result.version_number).queryKey,
        updatedMetric
      );
    }
    return updatedMetric;
  });

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...initialOptions,
    queryFn: () => initialQueryFn(paramVersionNumber),
    staleTime: Infinity,
    enabled: false, //In the year of our lord 2025, April 10, I, Nate Kelley, decided to disable this query in favor of explicityly fetching the data. May god have mercy on our souls.
    retry(_failureCount, error) {
      if (error?.message !== undefined && id) {
        setAssetPasswordError(id, error.message || 'An error occurred');
      }
      return false;
    },
    select: undefined,
    ...params
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', selectedVersionNumber),
    enabled: !!latestVersionNumber && isFetchedInitial && !isErrorInitial,
    queryFn: () => initialQueryFn(selectedVersionNumber),
    select: params?.select
  });
};

export const usePrefetchGetMetricClient = <TData = BusterMetric>(
  params?: Omit<UseQueryOptions<BusterMetric, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber } = useGetMetricVersionNumber();
  return useMemoizedFn(
    async ({ id, versionNumber }: { id: string; versionNumber: number | undefined }) => {
      const options = metricsQueryKeys.metricsGetMetric(id, versionNumber || selectedVersionNumber);
      const existingData = queryClient.getQueryData(options.queryKey);
      if (!existingData) {
        await queryClient.prefetchQuery({
          ...options,
          queryFn: async () => {
            const result = await getMetric({ id, version_number: versionNumber });
            return upgradeMetricToIMetric(result, null);
          },
          ...params
        });
      }
    }
  );
};

export const useGetMetricData = <TData = BusterMetricDataExtended>(
  {
    id,
    versionNumber: versionNumberProp,
    reportFileId
  }: {
    id: string | undefined;
    versionNumber?: number;
    reportFileId?: string;
  },
  params?: Omit<UseQueryOptions<BusterMetricData, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const getAssetPassword = useBusterAssetsContextSelector((x) => x.getAssetPassword);
  const { password } = getAssetPassword(id);
  const { selectedVersionNumber } = useGetMetricVersionNumber({
    versionNumber: versionNumberProp,
    metricId: id
  });
  const {
    isFetched: isFetchedMetric,
    isError: isErrorMetric,
    dataUpdatedAt,
    data: metric
  } = useGetMetric(
    { id, versionNumber: selectedVersionNumber },
    { select: (x) => ({ id: x.id, version_number: x.version_number }) }
  );

  const queryFn = useMemoizedFn(async () => {
    const result = await getMetricData({
      id: id || '',
      version_number: selectedVersionNumber || undefined,
      password,
      report_file_id: reportFileId
    });

    return result;
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id || '', selectedVersionNumber || 1),
    queryFn,
    enabled: () => {
      return (
        !!id &&
        isFetchedMetric &&
        !isErrorMetric &&
        !!metric?.id &&
        !!dataUpdatedAt &&
        !!selectedVersionNumber
      );
    },
    select: params?.select,
    ...params
  });
};

export const prefetchGetMetricDataClient = async (
  {
    id,
    version_number,
    report_file_id
  }: { id: string; version_number: number; report_file_id?: string },
  queryClient: QueryClient
) => {
  const options = metricsQueryKeys.metricsGetData(id, version_number);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => getMetricData({ id, version_number, report_file_id })
    });
  }
};

//used in list version histories
export const usePrefetchGetMetricDataClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(({ id, versionNumber }: { id: string; versionNumber: number }) =>
    prefetchGetMetricDataClient({ id, version_number: versionNumber }, queryClient)
  );
};
