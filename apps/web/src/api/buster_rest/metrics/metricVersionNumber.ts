import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useGetAssetVersionNumber } from '@/api/response-helpers/common-version-number';
import type { BusterMetric } from '../../asset_interfaces/metric';
import { metricsQueryKeys } from '../../query_keys/metric';

const stableVersionDataSelector = (data: BusterMetric) => data.version_number;
const stableVersionSearchSelector = (state: { metric_version_number?: number | undefined }) =>
  state.metric_version_number;

export const useGetMetricVersionNumber = (
  metricId: string,
  versionNumber: number | 'LATEST' | undefined
) => {
  return useGetAssetVersionNumber(
    metricsQueryKeys.metricsGetMetric(metricId, 'LATEST'),
    versionNumber,
    stableVersionDataSelector,
    stableVersionSearchSelector
  );
};

export const useGetLatestMetricVersionMemoized = () => {
  const queryClient = useQueryClient();

  return useCallback((metricId: string) => {
    const data = queryClient.getQueryData(
      metricsQueryKeys.metricsGetMetric(metricId, 'LATEST').queryKey
    );
    return data?.version_number;
  }, []);
};
