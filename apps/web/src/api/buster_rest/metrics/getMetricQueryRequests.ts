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
import { silenceAssetErrors } from '@/api/response-helpers/silenece-asset-errors';
import {
  setProtectedAssetPasswordError,
  useProtectedAssetPassword,
} from '@/context/BusterAssets/useProtectedAssetStore';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import type { ApiError } from '../../errors';
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
  queryClient: QueryClient;
  password: string | undefined;
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
    versionNumber: number | 'LATEST' | undefined; //if null it will not use a params from the query params
  },
  params?: Omit<UseQueryOptions<BusterMetric, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const query = metricsQueryKeys.metricsGetMetric(id || '', 'LATEST');
  const password = useProtectedAssetPassword(id || '');

  const { selectedVersionNumber, latestVersionNumber } = useGetMetricVersionNumber(
    id || '',
    versionNumberProp
  );

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...query,
    queryFn: () => {
      return getMetricQueryFn({ id, version: 'LATEST', queryClient, password });
    },
    retry(_failureCount, error) {
      if (error?.message !== undefined && id) {
        setProtectedAssetPasswordError({
          assetId: id,
          error: error.message || 'An error occurred',
        });
      }
      return false;
    },
    select: undefined,
    ...params,
    enabled: (params?.enabled ?? true) && !!id,
  });

  return useQuery({
    ...metricsQueryKeys.metricsGetMetric(id || '', selectedVersionNumber),
    queryFn: () => {
      return getMetricQueryFn({ id, version: selectedVersionNumber, queryClient, password });
    },
    ...params,
    select: params?.select,
    enabled: !!id && !!latestVersionNumber && isFetchedInitial && !isErrorInitial,
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
  const query = metricsQueryKeys.metricsGetMetric(id, version_number || 'LATEST');
  const queryKey = query?.queryKey;
  const existingData = queryClient.getQueryData(queryKey);

  if (!existingData && id) {
    await queryClient.prefetchQuery({
      ...query,
      queryFn: () => {
        return getMetricQueryFn({
          id,
          version: params.version_number,
          queryClient,
          password: undefined,
        });
      },
      retry: silenceAssetErrors,
    });
  }

  return existingData || queryClient.getQueryData(queryKey);
};

export const useGetMetricData = <TData = BusterMetricDataExtended>(
  {
    id = '',
    versionNumber: versionNumberProp,
    cacheDataId,
  }: {
    id: string | undefined;
    versionNumber: number | 'LATEST' | undefined;
    cacheDataId?: string;
  },
  params?: Omit<UseQueryOptions<BusterMetricData, ApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  const queryClient = useQueryClient();
  const password = useProtectedAssetPassword(id || '');
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
      report_file_id: cacheDataId,
    });
    const latestVersionNumber = getLatestMetricVersion(id);
    const isLatest =
      versionNumberProp === 'LATEST' ||
      !versionNumberProp ||
      latestVersionNumber === chosenVersionNumber;
    if (isLatest) {
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetData(id, 'LATEST', cacheDataId).queryKey,
        result
      );
    }
    return result;
  };

  return useQuery({
    ...metricsQueryKeys.metricsGetData(id || '', versionNumberProp || 'LATEST', cacheDataId),
    queryFn,
    select: params?.select,
    ...params,
    enabled: () => {
      return (
        !!id &&
        isFetchedMetric &&
        !isErrorMetric &&
        !!metricId &&
        !!dataUpdatedAt &&
        !!selectedVersionNumber &&
        params?.enabled !== false
      );
    },
  });
};

const prefetchGetMetricDataQueryFn = async ({
  id,
  version_number,
  report_file_id,
  queryClient,
}: {
  id: string;
  version_number: number | undefined;
  report_file_id?: string;
  queryClient: QueryClient;
}) => {
  const res = await getMetricData({ id, version_number, report_file_id });
  const latestVersion = queryClient.getQueryData(
    metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey
  );
  const isLatest = latestVersion?.version_number === version_number || !version_number;
  if (isLatest) {
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetData(id, 'LATEST', report_file_id).queryKey,
      res
    );
  }
  return res;
};

export const prefetchGetMetricDataClient = async (
  {
    id,
    version_number,
    report_file_id,
  }: { id: string; version_number: number | undefined; report_file_id?: string },
  queryClient: QueryClient
) => {
  const chosenVersionNumber = version_number || 'LATEST';
  const options = metricsQueryKeys.metricsGetData(id, chosenVersionNumber, report_file_id);
  const existingData = queryClient.getQueryData(options.queryKey);
  if (!existingData && id) {
    await queryClient.prefetchQuery({
      ...options,
      queryFn: () => {
        return prefetchGetMetricDataQueryFn({ id, version_number, report_file_id, queryClient });
      },
    });
  }
};

export const ensureMetricData = async (
  queryClient: QueryClient,
  params: Parameters<typeof getMetricData>[0]
) => {
  const { id, version_number, report_file_id } = params;
  const options = metricsQueryKeys.metricsGetData(id, version_number || 'LATEST', report_file_id);
  return await queryClient.ensureQueryData({
    ...options,
    queryFn: async () => {
      return await prefetchGetMetricDataQueryFn({
        id,
        version_number,
        report_file_id,
        queryClient,
      });
    },
  });
};

//used in list version histories
export const usePrefetchGetMetricDataClient = () => {
  const queryClient = useQueryClient();
  return useMemoizedFn(({ id, versionNumber }: { id: string; versionNumber: number }) =>
    prefetchGetMetricDataClient({ id, version_number: versionNumber }, queryClient)
  );
};

export const useDownloadMetricFile = (downloadImmediate = true) => {
  const { openInfoMessage } = useBusterNotifications();
  return useMutation({
    mutationFn: downloadMetricFile,
    onSuccess: (data) => {
      if (downloadImmediate) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = ''; // This will use the filename from the response-content-disposition header
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        openInfoMessage(`Downloading ${data.rowCount} records...`);
      }
    },
  });
};
