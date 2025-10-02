import { type QueryClient, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { isQueryStale } from '@/lib/query';
import type { ApiError } from '../../errors';
import { useGetUserOrganizationId } from '../users/useGetUserInfo';
import { hasOrganizationId } from '../users/userQueryHelpers';
import { listMetrics } from './requests';

export const useGetMetricsList = (
  params: Omit<Parameters<typeof listMetrics>[0], 'page_token' | 'page_size'>,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof listMetrics>>, ApiError>,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const organizationId = useGetUserOrganizationId();
  const compiledParams: Parameters<typeof listMetrics>[0] = useMemo(
    () => ({ status: [], ...params, page_token: 0, page_size: 3500 }),
    [params]
  );
  const queryFn = () => listMetrics(compiledParams);

  return useQuery({
    ...metricsQueryKeys.metricsGetList(compiledParams),
    queryFn,
    select: options?.select,
    enabled: !!organizationId,
    ...options,
  });
};

export const prefetchGetMetricsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof listMetrics>[0]
) => {
  const options = metricsQueryKeys.metricsGetList(params);
  const isStale = isQueryStale(options, queryClient);
  if (!isStale || !hasOrganizationId(queryClient)) return queryClient;

  const lastQueryKey = options.queryKey[options.queryKey.length - 1];
  const compiledParams = lastQueryKey as Parameters<typeof listMetrics>[0];

  await queryClient.prefetchQuery({
    ...options,
    queryFn: async () => {
      return await listMetrics(compiledParams);
    },
  });
  return queryClient;
};
