import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { getOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { useSaveDashboard } from './useSaveDashboard';

/**
 * useUpdateDashboard
 * Provides a client-first update mutation and optionally persists to server.
 */
export const useUpdateDashboard = (params?: {
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const { updateOnSave = false, updateVersion = false, saveToServer = false } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: dashboardsUpdateDashboard } = useSaveDashboard({
    updateOnSave,
    updateVersion,
  });

  const mutationFn = async (variables: Parameters<typeof dashboardsUpdateDashboard>[0]) => {
    if (saveToServer) {
      return await dashboardsUpdateDashboard({
        ...variables,
        update_version: updateVersion,
      });
    }
  };

  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      const originalDashboard = getOriginalDashboard(variables.id);
      if (!originalDashboard) {
        console.warn('No original dashboard found', variables);
        return;
      }
      const updatedDashboard = create(originalDashboard, (draft) => {
        Object.assign(draft, variables);
      });
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(variables.id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.dashboard = updatedDashboard;
        });
      });
    },
  });
};
