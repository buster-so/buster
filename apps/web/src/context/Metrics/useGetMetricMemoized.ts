import { useQueryClient } from '@tanstack/react-query';
import type { BusterMetric, BusterMetricDataExtended } from '@/api/asset_interfaces/metric';
import { useGetMetricVersionNumber } from '@/api/buster_rest/metrics';
import { queryKeys } from '@/api/query_keys';
import { useMemoizedFn } from '@/hooks';
import { resolveEmptyMetric } from '@/lib/metrics/resolve';

export const useGetMetricMemoized = () => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber } = useGetMetricVersionNumber();
  const getMetricMemoized = useMemoizedFn(
    (metricId: string, versionNumberProp?: number): BusterMetric => {
      const options = queryKeys.metricsGetMetric(
        metricId,
        versionNumberProp || selectedVersionNumber
      );
      const data = queryClient.getQueryData(options.queryKey);
      return resolveEmptyMetric(data, metricId);
    }
  );
  return getMetricMemoized;
};

export const useGetMetricDataMemoized = () => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber, latestVersionNumber } = useGetMetricVersionNumber();
  const getMetricDataMemoized = useMemoizedFn(
    (metricId: string, versionNumberProp?: number): BusterMetricDataExtended | undefined => {
      const versionNumber = versionNumberProp ?? selectedVersionNumber ?? latestVersionNumber;
      if (versionNumber == null) return undefined;
      const options = queryKeys.metricsGetData(metricId, versionNumber);
      const data = queryClient.getQueryData(options.queryKey);
      return data;
    }
  );
  return getMetricDataMemoized;
};
