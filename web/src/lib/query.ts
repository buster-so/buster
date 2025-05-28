import type { RustApiError } from '@/api/buster_rest/errors';
import { userQueryKeys } from '@/api/query_keys/users';
import type { QueryClient, queryOptions } from '@tanstack/react-query';

export const isQueryStale = (
  options: ReturnType<typeof queryOptions<unknown, RustApiError, unknown>>,
  queryClient: QueryClient
): boolean => {
  const queryState = queryClient.getQueryState(options.queryKey);
  const updatedAt = queryState?.dataUpdatedAt;
  const staleTime =
    (options.staleTime as number) ||
    (queryClient.getDefaultOptions().queries?.staleTime as number) ||
    0;
  const isStale = updatedAt ? Date.now() - updatedAt > staleTime : true;

  return isStale;
};

export const hasOrganizationId = (queryClient: QueryClient): boolean => {
  const organizationId = queryClient.getQueryData(userQueryKeys.userGetUserMyself.queryKey)
    ?.organizations?.[0]?.id;
  return !!organizationId;
};
