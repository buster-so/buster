import { useCreateReactQuery } from '@/api/createReactQuery';
import { getOrganizationUsers } from './requests';
import { useMemoizedFn } from 'ahooks';

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
