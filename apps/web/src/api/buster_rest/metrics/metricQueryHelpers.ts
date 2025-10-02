import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import type { BusterMetricDataExtended } from '../../asset_interfaces/metric';
import type { BusterMetric } from '../../asset_interfaces/metric/interfaces';
import { metricsQueryKeys } from '../../query_keys/metric';
import { prefetchGetMetricDataClient } from './getMetricQueryRequests';

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
      versionNumberProp?: number | 'LATEST'
    ): BusterMetricDataExtended | undefined => {
      const versionNumber = versionNumberProp ?? 'LATEST';
      if (versionNumber == null) return undefined;
      const options = metricsQueryKeys.metricsGetData(metricId, versionNumber);
      const data = queryClient.getQueryData(options.queryKey);
      return data;
    }
  );
  return getMetricDataMemoized;
};

export const initializeMetrics = (
  metrics: GetDashboardResponse['metrics'] | GetReportResponse['metrics'],
  queryClient: QueryClient,
  prefetchData: boolean
) => {
  for (const metric of Object.values(metrics)) {
    const upgradedMetric = upgradeMetricToIMetric(metric, null);
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
      upgradedMetric
    );
    const isLatestVersion = metric.version_number === last(metric.versions)?.version_number;
    if (isLatestVersion) {
      setOriginalMetric(upgradedMetric);
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(metric.id, 'LATEST').queryKey,
        upgradedMetric
      );
    }
    if (prefetchData) {
      prefetchGetMetricDataClient(
        { id: metric.id, version_number: metric.version_number },
        queryClient
      );
    }
  }
};
