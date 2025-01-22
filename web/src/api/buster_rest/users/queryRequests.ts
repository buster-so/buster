import {
  PREFETCH_STALE_TIME,
  useCreateReactMutation,
  useCreateReactQuery
} from '@/api/createReactQuery';
import { getUser, getUser_server, updateOrganizationUser } from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import * as config from './config';
import { OrganizationUser } from '../organizations';

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getUser(params);
  });

  return useCreateReactQuery({
    queryKey: config.USER_QUERY_KEY_ID(params.userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updateOrganizationUser>[0]) => {
    queryClient.setQueryData(
      config.USER_QUERY_KEY_ID(params.userId),
      (oldData: OrganizationUser) => {
        return {
          ...oldData,
          ...params
        };
      }
    );
    const res = await updateOrganizationUser(params);
    return res;
  });

  return useCreateReactMutation({
    mutationFn: mutationFn
  });
};

export const prefetchGetUser = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_QUERY_KEY_ID(userId),
    queryFn: () => getUser_server({ userId })
  });
  return queryClient;
};
