import { useMemo } from 'react';
import { listMetrics } from './requests';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useMemoizedFn } from '@/hooks';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { RustApiError } from '../errors';

export const useGetMetricsList = (
  params: Omit<Parameters<typeof listMetrics>[0], 'page_token' | 'page_size'>,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof listMetrics>>, RustApiError>,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const compiledParams: Parameters<typeof listMetrics>[0] = useMemo(
    () => ({ ...params, page_token: 0, page_size: 3000 }),
    [params]
  );

  const queryFn = useMemoizedFn(() => listMetrics(compiledParams));

  return useQuery({
    ...metricsQueryKeys.metricsGetList(params),
    queryFn,
    select: options?.select,
    ...options
  });
};
