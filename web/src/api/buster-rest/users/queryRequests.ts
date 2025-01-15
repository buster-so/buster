import { useCreateReactQuery } from '@/api/createReactQuery';
import { getUser, getUsers } from './requests';
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

export const useGetUsers = () => {
  const queryFn = useMemoizedFn(() => {
    return getUsers();
  });

  return useCreateReactQuery({
    queryKey: ['users'],
    queryFn,
    initialData: []
  });
};
