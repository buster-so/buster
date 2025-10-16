import type { GetGitHubIntegrationResponse } from '@buster/server-shared/github';
import { queryOptions } from '@tanstack/react-query';

export const githubIntegration = queryOptions<GetGitHubIntegrationResponse>({
  queryKey: ['github-integration'],
  staleTime: 1000 * 5,
});

export const githubIntegrationQueryKeys = {
  githubIntegration,
};
