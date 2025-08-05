import { queryOptions } from '@tanstack/react-query';
import type {
  BusterMetricListItem,
  BusterMetric,
  BusterMetricDataExtended
} from '@/api/asset_interfaces/metric';
import type { listMetrics } from '../buster_rest/metrics';

export const metricsGetMetric = (metricId: string, version_number: number | null) => {
  return queryOptions<BusterMetric>({
    queryKey: ['metrics', 'get', metricId, version_number || 'INITIAL'] as const,
    staleTime: 60 * 1000 // 60 seconds
  });
};

export const metricsGetList = (
  filters?: Omit<Parameters<typeof listMetrics>[0], 'page_token' | 'page_size'>
) =>
  queryOptions<BusterMetricListItem[]>({
    queryKey: [
      'metrics',
      'list',
      filters || { status: [], page_token: 0, page_size: 3500 }
    ] as const,
    initialData: [],
    initialDataUpdatedAt: 0
  });

export const metricsGetData = (id: string, version_number: number) =>
  queryOptions<BusterMetricDataExtended>({
    queryKey: ['metrics', 'data', id, version_number || 'INITIAL'] as const,
    staleTime: 3 * 60 * 60 * 1000 // 3 hours,
  });

export const metricsQueryKeys = {
  metricsGetMetric,
  metricsGetList,
  metricsGetData
};
