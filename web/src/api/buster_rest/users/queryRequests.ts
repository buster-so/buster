import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getUser,
  getUser_server,
  updateOrganizationUser,
  getMyUserInfo,
  getMyUserInfo_server,
  getUserFavorites,
  getUserFavorites_server,
  createUserFavorite,
  deleteUserFavorite,
  updateUserFavorites,
  inviteUser,
  getUserList,
  getUserList_server
} from './requests';
import { useMemoizedFn } from '@/hooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCreateOrganization } from '../organizations';

export const useGetMyUserInfo = () => {
  return useQuery({
    ...queryKeys.userGetUserMyself,
    queryFn: getMyUserInfo,
    enabled: false //This is a server only query
  });
};

export const prefetchGetMyUserInfo = async (
  params: Parameters<typeof getMyUserInfo_server>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserMyself,
    queryFn: () => getMyUserInfo_server(params)
  });
  return queryClient;
};

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => getUser(params));
  return useQuery({
    ...queryKeys.userGetUser(params.userId),
    queryFn
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updateOrganizationUser>[0]) => {
    const options = queryKeys.userGetUser(params.userId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        ...params
      };
    });
    const res = await updateOrganizationUser(params);
    return res;
  });

  return useMutation({
    mutationFn: mutationFn
  });
};

export const prefetchGetUser = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUser(userId),
    queryFn: () => getUser_server({ userId })
  });
  return queryClient;
};

export const useGetUserList = (params: Parameters<typeof getUserList>[0]) => {
  const queryFn = useMemoizedFn(() => getUserList(params));

  return useQuery({
    ...queryKeys.userGetUserList(params),
    queryFn
  });
};

export const prefetchGetUserList = async (
  params: Parameters<typeof getUserList>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.userGetUserList(params),
    queryFn: () => getUserList_server(params)
  });
  return queryClient;
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      const user = queryClient.getQueryData(queryKeys.userGetUserMyself.queryKey);
      const teamId = user?.organizations?.[0]?.id;
      if (teamId) {
        queryClient.invalidateQueries({
          queryKey: [queryKeys.userGetUserList({ team_id: teamId }).queryKey],
          refetchType: 'all'
        });
      }
    }
  });
};

export const useCreateUserOrganization = () => {
  const { data: userResponse, refetch: refetchUserResponse } = useGetMyUserInfo();
  const { mutateAsync: createOrganization } = useCreateOrganization();
  const { mutateAsync: updateUserInfo } = useUpdateUser();

  const onCreateUserOrganization = useMemoizedFn(
    async ({ name, company }: { name: string; company: string }) => {
      const alreadyHasOrganization = !!userResponse?.organizations?.[0];
      if (!alreadyHasOrganization) await createOrganization({ name: company });
      if (userResponse) {
        await updateUserInfo({
          userId: userResponse.user.id,
          name
        });
        await refetchUserResponse();
      }
      await refetchUserResponse();
    }
  );

  return onCreateUserOrganization;
};
