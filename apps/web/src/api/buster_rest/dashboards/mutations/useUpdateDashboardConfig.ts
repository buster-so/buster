import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useSaveDashboard } from './useSaveDashboard';
import { useUpdateDashboard } from './useUpdateDashboard';

/**
 * useUpdateDashboardConfig
 * Client-optmistic update for the dashboard.config field, then persists.
 */
export const useUpdateDashboardConfig = () => {
  const { mutateAsync: dashboardsUpdateDashboard } = useUpdateDashboard({
    updateOnSave: true,
  });
  const queryClient = useQueryClient();

  const method = async ({
    dashboardId,
    ...newDashboard
  }: Partial<BusterDashboard['config']> & {
    dashboardId: string;
  }) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST');
    const previousDashboard = queryClient.getQueryData(options.queryKey);
    const previousConfig = previousDashboard?.dashboard?.config;

    if (previousConfig) {
      const newConfig = create(previousConfig, (draft) => {
        Object.assign(draft, newDashboard);
      });

      return dashboardsUpdateDashboard({
        id: dashboardId,
        config: newConfig,
      });
    }
  };

  return useMutation({
    mutationFn: method,
  });
};
