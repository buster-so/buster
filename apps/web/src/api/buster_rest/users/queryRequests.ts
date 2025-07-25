import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useCreateOrganization } from '../organizations/queryRequests';
import {
  getMyUserInfo,
  getMyUserInfo_server,
  getUser,
  getUser_server,
  inviteUser,
  updateOrganizationUser
} from './requests';
import { organizationQueryKeys } from '@/api/query_keys/organization';
import { UserResponse } from '@buster/server-shared/user';
import type { RustApiError } from '../errors';

export const useGetMyUserInfo = <TData = UserResponse>(
  props?: Omit<UseQueryOptions<UserResponse | null, RustApiError, TData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    ...userQueryKeys.userGetUserMyself,
    queryFn: getMyUserInfo,
    enabled: false, //This is a server only query,
    select: props?.select,
    ...props
  });
};

export const prefetchGetMyUserInfo = async (
  params: Parameters<typeof getMyUserInfo_server>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserMyself,
    queryFn: () => getMyUserInfo_server(params)
  });
  return queryClient;
};

export const useGetUser = (params: Parameters<typeof getUser>[0]) => {
  const queryFn = useMemoizedFn(() => getUser(params));
  return useQuery({
    ...userQueryKeys.userGetUser(params.userId),
    queryFn
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (params: Parameters<typeof updateOrganizationUser>[0]) => {
    const options = userQueryKeys.userGetUser(params.userId);
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
    ...userQueryKeys.userGetUser(userId),
    queryFn: () => getUser_server({ userId })
  });
  return queryClient;
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      const user = queryClient.getQueryData(userQueryKeys.userGetUserMyself.queryKey);

      // Invalidate organization users for all user's organizations
      for (const organization of user?.organizations || []) {
        queryClient.invalidateQueries({
          queryKey: [organizationQueryKeys.organizationUsers(organization.id).queryKey],
          refetchType: 'all'
        });
      }

      // Invalidate all userGetUserToOrganization queries (any params)
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.userGetUserToOrganization({}).queryKey.slice(0, -1),
        refetchType: 'all'
      });
    }
  });
};

export const useCreateUserOrganization = () => {
  const { data: userResponse, refetch: refetchUserResponse } = useGetMyUserInfo({});
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
