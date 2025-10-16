import { type QueryClient, useQuery } from '@tanstack/react-query';
import { githubIntegrationQueryKeys } from '@/api/query_keys/github';
import { getGitHubIntegration } from './request';

export const useGetGitHubIntegration = () => {
  return useQuery({
    ...githubIntegrationQueryKeys.githubIntegration,
    queryFn: getGitHubIntegration,
    refetchOnWindowFocus: true,
  });
};

export const prefetchGitHubIntegration = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...githubIntegrationQueryKeys.githubIntegration,
    queryFn: getGitHubIntegration,
  });
  return queryClient.getQueryData(githubIntegrationQueryKeys.githubIntegration.queryKey);
};
