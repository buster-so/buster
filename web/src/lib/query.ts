import type { QueryClient, queryOptions } from '@tanstack/react-query';
import type { RustApiError } from '@/api/buster_rest/errors';
import { userQueryKeys } from '@/api/query_keys/users';

export const isQueryStale = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- It really doesn't matter what the type is here
  options: ReturnType<typeof queryOptions<any, RustApiError, any>>,
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
