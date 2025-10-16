import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slackQueryKeys } from '@/api/query_keys/slack';
import { useBusterNotifications } from '@/context/BusterNotifications';
import {
  getSlackChannels,
  getSlackIntegration,
  initiateSlackOAuth,
  removeSlackIntegration,
  updateSlackIntegration,
} from './request';

// GET /api/v2/slack/integration
export const useGetSlackIntegration = (enabled = true) => {
  return useQuery({
    ...slackQueryKeys.slackGetIntegration,
    queryFn: getSlackIntegration,
    enabled,
  });
};

export const prefetchSlackIntegration = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...slackQueryKeys.slackGetIntegration,
    queryFn: getSlackIntegration,
  });
  return queryClient.getQueryData(slackQueryKeys.slackGetIntegration.queryKey);
};

// GET /api/v2/slack/channels
export const useGetSlackChannels = (enabled = true) => {
  const { data: slackIntegration } = useGetSlackIntegration();
  return useQuery({
    ...slackQueryKeys.slackGetChannels,
    queryFn: getSlackChannels,
    enabled: enabled && slackIntegration?.connected,
  });
};

// POST /api/v2/slack/auth/init
export const useInitiateSlackOAuth = () => {
  const { openErrorNotification } = useBusterNotifications();
  const mutationFn = async () => {
    const result = await initiateSlackOAuth();
    if (result.auth_url) {
      window.location.href = result.auth_url;
    } else {
      openErrorNotification({
        title: 'Failed to initiate Slack OAuth',
        description: 'Please try again later',
        duration: 5000,
      });
    }
  };

  return useMutation({
    mutationFn,
  });
};

// PUT /api/v2/slack/integration
export const useUpdateSlackIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSlackIntegration,
    onSuccess: () => {
      // Invalidate the integration query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: slackQueryKeys.slackGetIntegration.queryKey,
        refetchType: 'all',
      });
    },
  });
};

// DELETE /api/v2/slack/integration
export const useRemoveSlackIntegration = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = async () => {
    const ignoreConfirm = false;

    const method = async () => {
      return await removeSlackIntegration();
    };

    if (ignoreConfirm) {
      return method();
    }

    return openConfirmModal({
      title: 'Remove Slack Integration',
      content:
        'Are you sure you want to remove the Slack integration? This will disconnect your workspace from Slack.',
      primaryButtonProps: {
        text: 'Remove',
      },
      onOk: method,
    });
  };

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate both integration and channels queries
      queryClient.invalidateQueries({
        queryKey: slackQueryKeys.slackGetIntegration.queryKey,
        refetchType: 'all',
      });
      queryClient.setQueryData(slackQueryKeys.slackGetChannels.queryKey, { channels: [] });
    },
  });
};
