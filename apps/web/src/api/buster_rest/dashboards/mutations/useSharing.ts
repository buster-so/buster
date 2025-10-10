import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { shareDashboard, unshareDashboard, updateDashboardShare } from '../requests';

/**
 * useShareDashboard
 */
export const useShareDashboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareDashboard,
    onMutate: ({ id, params }) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST').queryKey;

      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = [
            ...params.map((p) => ({
              ...p,
              name: p.name,
              avatar_url: p.avatar_url || null,
            })),
            ...(draft.individual_permissions || []),
          ].sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (_, variables) => {
      const partialMatchedKey = dashboardQueryKeys
        .dashboardGetDashboard(variables.id, 'LATEST')
        .queryKey.slice(0, -1);
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all',
      });
    },
  });
};

/**
 * useUnshareDashboard
 */
export const useUnshareDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = (
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || []
          ).sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
  });
};

/**
 * useUpdateDashboardShare
 */
export const useUpdateDashboardShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDashboardShare,
    onMutate: ({ id, params }) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = (
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return { ...t, ...found };
              return t;
            }) || []
          ).sort((a, b) => a.email.localeCompare(b.email));

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
          if (params.workspace_sharing !== undefined) {
            draft.workspace_sharing = params.workspace_sharing;
          }
        });
      });
    },
  });
};
