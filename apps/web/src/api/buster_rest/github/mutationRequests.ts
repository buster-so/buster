import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { githubIntegrationQueryKeys } from '@/api/query_keys/github';
import { initiateGitHubAppInstall, removeGitHubIntegration } from './request';

export const useInitiateGitHubAppInstall = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: initiateGitHubAppInstall,
    onSuccess: ({ redirectUrl }) => {
      queryClient.invalidateQueries({
        queryKey: githubIntegrationQueryKeys.githubIntegration.queryKey,
      });
      navigate({ href: redirectUrl });
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
