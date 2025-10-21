import type { GetUserToOrganizationResponse, OrganizationUser } from '@buster/server-shared/user';
import {
  keepPreviousData,
  type UseQueryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import { useInfiniteScroll } from '@/api/query-helpers';
import { useInfiniteScrollManual } from '@/api/query-helpers/useInfiniteScroll';
import type { ApiError } from '../../../errors';
import { getUserToOrganization } from './requests';

export const useGetUserToOrganization = <TData = GetUserToOrganizationResponse>(
  params: Parameters<typeof getUserToOrganization>[0],
  options?: Omit<
    UseQueryOptions<GetUserToOrganizationResponse, ApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryFn = () => getUserToOrganization(params);

  return useQuery({
    ...userQueryKeys.userGetUserToOrganization(params),
    placeholderData: keepPreviousData,
    queryFn,
    select: options?.select,
    ...options,
  });
};

export const useGetUserToOrganizationInfinite = ({
  scrollConfig,
  ...params
}: Omit<Parameters<typeof getUserToOrganization>[0], 'page'> & {
  scrollConfig?: Parameters<typeof useInfiniteScroll>[0]['scrollConfig'];
}) => {
  return useInfiniteScroll<OrganizationUser>({
    queryKey: ['users', 'list', 'infinite', params] as const,
    staleTime: 1000 * 40, // 40 seconds
    queryFn: ({ pageParam = 1 }) => getUserToOrganization({ ...params, page: pageParam }),
    placeholderData: keepPreviousData,
    scrollConfig,
  });
};

export const useGetUserToOrganizationInfiniteManual = (
  params: Omit<Parameters<typeof getUserToOrganization>[0], 'page'> & {}
) => {
  return useInfiniteScrollManual<OrganizationUser>({
    queryKey: ['users', 'list', 'infinite', params] as const,
    staleTime: 1000 * 40, // 40 seconds
    queryFn: ({ pageParam = 1 }) => getUserToOrganization({ ...params, page: pageParam }),
    placeholderData: keepPreviousData,
  });
};
