import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import { getUser, getUser_server } from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';
import * as config from './config';

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getUser(params);
  });

  return useCreateReactQuery<ReturnType<typeof getUser>>({
    queryKey: config.USER_QUERY_KEY_ID(params.userId),
    queryFn,
    staleTime: 1000 * 3
  });
};

export const useUpdateUser = () => {
  const mutationFn = useMemoizedFn(async () => {
    //
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
