import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { initializeMetrics } from '../metrics/metricQueryHelpers';
import { getDashboardById } from './requests';

export const useEnsureDashboardConfig = (params?: { prefetchData?: boolean }) => {
  const { prefetchData = true } = params || {};
  const queryClient = useQueryClient();

  const { openErrorMessage } = useBusterNotifications();

  const method = useMemoizedFn(
    async (dashboardId: string, initializeMetrics = true, password?: string) => {
      const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST');
      let dashboardResponse = queryClient.getQueryData(options.queryKey);
      if (!dashboardResponse) {
        const res = await getDashboardAndInitializeMetrics({
          id: dashboardId,
          version_number: 'LATEST',
          password,
          queryClient,
          shouldInitializeMetrics: initializeMetrics,
          prefetchMetricsData: prefetchData,
        }).catch(() => {
          openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
        });
        if (res) {
          queryClient.setQueryData(
            dashboardQueryKeys.dashboardGetDashboard(res.dashboard.id, 'LATEST').queryKey,
            res
          );
          dashboardResponse = res;
        }
      }

      return dashboardResponse;
    }
  );

  return method;
};

export const getDashboardAndInitializeMetrics = async ({
  id,
  version_number,
  password,
  queryClient,
  shouldInitializeMetrics = true,
  prefetchMetricsData = false,
}: {
  id: string;
  version_number?: number | 'LATEST' | undefined;
  password?: string;
  queryClient: QueryClient;
  shouldInitializeMetrics?: boolean;
  prefetchMetricsData?: boolean;
}) => {
  const chosenVersionNumber = version_number === 'LATEST' ? undefined : version_number;
  return getDashboardById({
    id: id || '',
    password,
    version_number: chosenVersionNumber,
  }).then((data) => {
    const latestVersion = last(data.versions)?.version_number || 1;
    const isLatestVersion = data.dashboard.version_number === latestVersion;
    if (isLatestVersion) {
      setOriginalDashboard(data.dashboard);
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST').queryKey,
        data
      );
    }

    if (data.dashboard.version_number) {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
    }

    if (shouldInitializeMetrics || prefetchMetricsData) {
      initializeMetrics(data.metrics, queryClient, !!prefetchMetricsData);
    }

    return data;
  });
};
