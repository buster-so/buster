import { QueryClient } from '@tanstack/react-query';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { getDashboard_server } from './requests';

export const prefetchGetDashboard = async (
  params: Parameters<typeof getDashboard_server>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(params.id, params.version_number || null),
    queryFn: async () => {
      return await getDashboard_server(params);
    }
  });

  return queryClient;
};
