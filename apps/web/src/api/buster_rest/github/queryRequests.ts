import { type QueryClient, useQuery } from '@tanstack/react-query';
import { githubIntegrationQueryKeys } from '@/api/query_keys/github';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { getGitHubIntegration } from './request';

export const useGetGitHubIntegration = () => {
  const { openConfirmModal } = useBusterNotifications();

  const queryFn = async () => {
    const result = await openConfirmModal({
      title: 'GitHub Integration',
      content:
        'You must be an administrator of your GitHub organization to connect. If you are not an administrator, the connection will likely fail. Please ensure you have the necessary permissions before proceeding.',
      primaryButtonProps: {
        text: 'Connect',
      },
      onOk: () => {
        return getGitHubIntegration();
      },
    });
    // If user cancels, return a default "not connected" state
    if (!result) {
      return { connected: false };
    }
    return result;
  };

  return useQuery({
    ...githubIntegrationQueryKeys.githubIntegration,
    queryFn,
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
