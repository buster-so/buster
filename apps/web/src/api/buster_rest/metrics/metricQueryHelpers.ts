import { useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterMetricDataExtended } from '../../asset_interfaces/metric';
import type { BusterMetric } from '../../asset_interfaces/metric/interfaces';
import { metricsQueryKeys } from '../../query_keys/metric';

export const useGetMetricMemoized = () => {
  const queryClient = useQueryClient();

  const getMetricMemoized = useMemoizedFn(
    (metricId: string, versionNumberProp?: number): BusterMetric => {
      const versionNumber = versionNumberProp || 'LATEST';
      const options = metricsQueryKeys.metricsGetMetric(metricId, versionNumber);
      const data = queryClient.getQueryData(options.queryKey);
      if (!data) {
        throw new Error('Metric not found');
      }
      return data;
    }
  );
  return getMetricMemoized;
};

export const useGetMetricDataMemoized = () => {
  const queryClient = useQueryClient();
  const getMetricDataMemoized = useMemoizedFn(
    (
      metricId: string,
      versionNumberProp?: number | 'LATEST',
      cacheId?: string
    ): BusterMetricDataExtended | undefined => {
      const versionNumber = versionNumberProp ?? 'LATEST';
      if (versionNumber == null) return undefined;
      const options = metricsQueryKeys.metricsGetData(metricId, versionNumber, cacheId);
      const data = queryClient.getQueryData(options.queryKey);
      return data;
    }
  );
  return getMetricDataMemoized;
};
