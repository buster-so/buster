import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { queryKeys } from '@/api/query_keys';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useOriginalDashboardStore } from '@/context/Dashboards';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import { useQueryClient } from '@tanstack/react-query';
import last from 'lodash/last';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import {
  useDashboardQueryStore,
  useGetLatestDashboardVersionMemoized
} from './dashboardQueryStore';
import { dashboardsGetDashboard } from './requests';

export const useEnsureDashboardConfig = (prefetchData = true) => {
  const queryClient = useQueryClient();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics(prefetchData);
  const { openErrorMessage } = useBusterNotifications();
  const getLatestDashboardVersion = useGetLatestDashboardVersionMemoized();

  const method = useMemoizedFn(async (dashboardId: string) => {
    const latestVersion = getLatestDashboardVersion(dashboardId);
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, latestVersion);
    let dashboardResponse = queryClient.getQueryData(options.queryKey);
    if (!dashboardResponse) {
      const res = await prefetchDashboard(dashboardId, latestVersion || undefined).catch((e) => {
        openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
        return null;
      });
      if (res) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(res.dashboard.id, res.dashboard.version_number)
            .queryKey,
          res
        );
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

export const useGetDashboardAndInitializeMetrics = (prefetchData = true) => {
  const queryClient = useQueryClient();
  const setOriginalDashboards = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const onSetLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const initializeMetrics = useMemoizedFn((metrics: BusterDashboardResponse['metrics']) => {
    for (const metric of Object.values(metrics)) {
      const prevMetric = queryClient.getQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);
      queryClient.setQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
        upgradedMetric
      );
      if (prefetchData) {
        prefetchGetMetricDataClient(
          { id: metric.id, version_number: metric.version_number },
          queryClient
        );
      }
    }
  });

  return useMemoizedFn(async (id: string, version_number: number | null | undefined) => {
    const { password } = getAssetPassword?.(id) || {};

    return dashboardsGetDashboard({
      id: id || '',
      password,
      version_number: version_number || undefined
    }).then((data) => {
      initializeMetrics(data.metrics);
      setOriginalDashboards(data.dashboard);

      if (data.dashboard.version_number) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        onSetLatestDashboardVersion(data.dashboard.id, last(data.versions)?.version_number || 0);
      }

      return data;
    });
  });
};
