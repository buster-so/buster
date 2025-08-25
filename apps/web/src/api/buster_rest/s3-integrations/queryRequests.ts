import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { s3IntegrationsQueryKeys } from '@/api/query_keys/s3Integrations';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import type { CreateS3IntegrationRequest } from '@buster/server-shared/s3-integrations';
import { getS3Integration, createS3Integration, deleteS3Integration } from './request';

// GET /api/v2/s3-integrations
export const useGetS3Integration = (enabled = true) => {
  return useQuery({
    ...s3IntegrationsQueryKeys.s3IntegrationGet,
    queryFn: getS3Integration,
    enabled
  });
};

// POST /api/v2/s3-integrations
export const useCreateS3Integration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateS3IntegrationRequest) => createS3Integration(data),
    onSuccess: () => {
      // Invalidate the integration query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: s3IntegrationsQueryKeys.s3IntegrationGet.queryKey,
        refetchType: 'all'
      });
    }
  });
};

// DELETE /api/v2/s3-integrations/:id
export const useDeleteS3Integration = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = useMemoizedFn(async (id: string) => {
    return openConfirmModal({
      title: 'Remove Storage Integration',
      content:
        'Are you sure you want to remove the storage integration? This will disconnect your storage bucket from Buster.',
      primaryButtonProps: {
        text: 'Remove'
      },
      onOk: async () => deleteS3Integration(id)
    });
  });

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate the integration query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: s3IntegrationsQueryKeys.s3IntegrationGet.queryKey,
        refetchType: 'all'
      });
    }
  });
};
