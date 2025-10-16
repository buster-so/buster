import { useMutation, useQueryClient } from '@tanstack/react-query';
import { githubIntegrationQueryKeys } from '@/api/query_keys/github';
import { initiateGitHubAppInstall, removeGitHubIntegration } from './request';

export const useInitiateGitHubAppInstall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initiateGitHubAppInstall,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: githubIntegrationQueryKeys.githubIntegration.queryKey,
      });
    },
  });
};

export const useDeleteGitHubIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeGitHubIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: githubIntegrationQueryKeys.githubIntegration.queryKey,
      });
    },
  });
};
