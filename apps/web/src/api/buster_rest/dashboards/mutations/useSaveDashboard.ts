import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import last from 'lodash/last';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { initializeMetrics } from '../dashboardQueryHelpers';
import { dashboardsUpdateDashboard } from '../requests';

/**
 * useSaveDashboard
 * Saves the dashboard to the server and updates cache optionally.
 */
export const useSaveDashboard = (params?: { updateOnSave?: boolean; updateVersion?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const updateVersion = params?.updateVersion || true;

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (variables: Parameters<typeof dashboardsUpdateDashboard>[0]) =>
      dashboardsUpdateDashboard({
        ...variables,
        update_version: variables.update_version ?? updateVersion,
      }),
    onMutate: (variables) => {
      const options = dashboardQueryKeys.dashboardGetDashboard(variables.id, 'LATEST');
      queryClient.setQueryData(options.queryKey, (old) => {
        if (!old) return old;
        if (!old.dashboard) return old;
        if (old.dashboard.config && variables.config) {
          old.dashboard.config = Object.assign(old.dashboard.config, variables.config);
        }
        if (old.dashboard.name && variables.name) {
          old.dashboard.name = variables.name;
        }
        if (old.dashboard.description && variables.description) {
          old.dashboard.description = variables.description;
        }

        return old;
      });
    },
    onSuccess: (data, variables) => {
      if (updateOnSave && data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST').queryKey,
          data
        );

        if (variables.restore_to_version) {
          console.warn('TODO check if this is correct');
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST')
              .queryKey,
          });
        }
      }

      initializeMetrics(data.metrics, queryClient, true);

      const isLatestVersion = data.dashboard.version_number === last(data.versions)?.version_number;
      if (isLatestVersion) setOriginalDashboard(data.dashboard);
      navigate({
        to: '.',
        ignoreBlocker: true,
        search: (prev) => ({ ...prev, dashboard_version_number: undefined }),
      });
    },
  });
};
