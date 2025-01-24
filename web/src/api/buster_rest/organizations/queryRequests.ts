import { useCreateReactQuery } from '@/api/createReactQuery';
import { getOrganizationUsers, getOrganizationUsers_server } from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';

export const useGetOrganizationUsers = (organizationId: string) => {
  const queryFn = useMemoizedFn(() => {
    return getOrganizationUsers({ organizationId });
  });

  return useCreateReactQuery({
    queryKey: ['organizationUsers', organizationId],
    queryFn,
    enabled: !!organizationId,
    initialData: []
  });
};

export const prefetchGetOrganizationUsers = async (
  organizationId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['organizationUsers', organizationId],
    queryFn: () => getOrganizationUsers_server({ organizationId })
  });
  return queryClient;
};
