import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import { getUser } from './requests';
import { useMemoizedFn } from 'ahooks';

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getUser(params);
  });

  return useCreateReactQuery<ReturnType<typeof getUser>>({
    queryKey: ['users', params.userId],
    queryFn
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
