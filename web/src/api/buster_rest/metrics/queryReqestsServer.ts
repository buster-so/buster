import { QueryClient } from '@tanstack/react-query';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import { getMetric_server } from './requests';

/*

 */
export const prefetchGetMetric = async (
  params: Parameters<typeof getMetric_server>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...metricsQueryKeys.metricsGetMetric(params.id, params.version_number || null),
    queryFn: async () => {
      const result = await getMetric_server(params);
      return upgradeMetricToIMetric(result, null);
    }
  });

  return queryClient;
};
