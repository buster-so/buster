import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { queryKeys } from '@/api/query_keys';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useOriginalDashboardStore } from '@/context/Dashboards';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { upgradeMetricToIMetric } from '@/lib/metrics/upgradeToIMetric';
import { Query, useQueryClient } from '@tanstack/react-query';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { dashboardsGetDashboard } from './requests';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { RustApiError } from '../errors';
import last from 'lodash/last';

export const useEnsureDashboardConfig = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics(prefetchData);
  const { openErrorMessage } = useBusterNotifications();
  const getLatestDashboardVersion = useGetLatestDashboardVersionNumber();

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

export const useGetDashboardAndInitializeMetrics = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const setOriginalDashboards = useOriginalDashboardStore((x) => x.setOriginalDashboard);
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
      id: id!,
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
      }

      return data;
    });
  });
};

export const useGetDashboardVersionNumber = (props?: {
  versionNumber?: number | null; //if null it will not use a params from the query params
}) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { dashboardId: dashboardIdPathParam } = useParams() as {
    dashboardId: string | undefined;
  };
  const versionNumberQueryParam = useSearchParams().get('dashboard_version_number');
  const versionNumberFromParams = dashboardIdPathParam ? versionNumberQueryParam : undefined;

  const paramVersionNumber = useMemo(() => {
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  const latestVersionNumber = useGetLatestDashboardVersion({ dashboardId: dashboardIdPathParam! });

  const selectedVersionNumber: number | null = useMemo(() => {
    if (versionNumberProp === null) return null;
    return paramVersionNumber || latestVersionNumber || 0;
  }, [paramVersionNumber, latestVersionNumber]);

  return useMemo(() => {
    return { selectedVersionNumber, paramVersionNumber, latestVersionNumber };
  }, [selectedVersionNumber, selectedVersionNumber, latestVersionNumber]);
};

type PredicateType = (query: Query<BusterDashboardResponse, RustApiError>) => boolean;
const filterDashboardPredicate = <PredicateType>((query) => {
  const lastKey = last(query.queryKey);
  return (
    typeof lastKey === 'number' &&
    !!lastKey &&
    query.state.data !== undefined &&
    query.state.data !== null &&
    'versions' in query.state.data
  );
});

const getLatestVersionNumber = (
  queries: [readonly unknown[], BusterDashboardResponse | undefined][]
) => {
  let maxVersion = -Infinity;

  // Single pass: filter and find max version
  for (const [queryKey, data] of queries) {
    if (data && typeof data === 'object' && 'versions' in data) {
      const lastVersion = last(data.versions);
      const version = Number(lastVersion?.version_number);
      maxVersion = Math.max(maxVersion, version, data.dashboard.version_number);
    }
  }

  return maxVersion === -Infinity ? null : maxVersion;
};

const useGetLatestDashboardVersion = ({ dashboardId }: { dashboardId: string }) => {
  const queryClient = useQueryClient();
  const [latestVersion, setLatestVersion] = useState<number | null>(null);

  const memoizedKey = useMemo(() => {
    return dashboardQueryKeys.dashboardGetDashboard(dashboardId, null).queryKey.slice(0, -1);
  }, [dashboardId]);

  const updateLatestVersion = useMemoizedFn(() => {
    const queries = queryClient.getQueriesData<BusterDashboardResponse, any>({
      queryKey: memoizedKey,
      predicate: filterDashboardPredicate
    });
    const newVersion = getLatestVersionNumber(queries);
    setLatestVersion(newVersion);
  });

  useEffect(() => {
    // Initial computation
    updateLatestVersion();

    // Subscribe to cache updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.query.queryKey[2] === last(memoizedKey) &&
        event.query.queryKey[1] === memoizedKey[1]
      ) {
        updateLatestVersion();
      }
    });

    return () => unsubscribe();
  }, [memoizedKey, updateLatestVersion]);

  return latestVersion;
};

//This is a helper function that returns the latest version number for a metric
export const useGetLatestDashboardVersionNumber = () => {
  const queryClient = useQueryClient();

  const method = useMemoizedFn((dashboardId: string) => {
    const queries = queryClient.getQueriesData<BusterDashboardResponse, any>({
      queryKey: dashboardQueryKeys.dashboardGetDashboard(dashboardId, null).queryKey.slice(0, -1),
      predicate: filterDashboardPredicate
    });

    return getLatestVersionNumber(queries);
  });

  return method;
};
