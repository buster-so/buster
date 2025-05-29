'use client';

import last from 'lodash/last';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  useGetDashboard,
  usePrefetchGetDashboardClient,
  useSaveDashboard
} from '@/api/buster_rest/dashboards';
import {
  useGetMetric,
  usePrefetchGetMetricClient,
  usePrefetchGetMetricDataClient,
  useSaveMetric
} from '@/api/buster_rest/metrics';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { timeout } from '@/lib/timeout';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const useListVersionHistories = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const router = useRouter();
  const { onCloseVersionHistory } = useCloseVersionHistory();
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const {
    versions: dashboardVersions,
    selectedQueryVersion: dashboardSelectedQueryVersion,
    currentVersionNumber: dashboardCurrentVersionNumber,
    onRestoreVersion: onRestoreDashboardVersion,
    isSaving: isSavingDashboard,
    onPrefetchAsset: onPrefetchDashboardAsset
  } = useListDashboardVersions({
    assetId,
    type
  });
  const {
    versions: metricVersions,
    selectedQueryVersion: metricSelectedQueryVersion,
    currentVersionNumber: metricCurrentVersionNumber,
    onRestoreVersion: onRestoreMetricVersion,
    isSaving: isSavingMetric,
    onPrefetchAsset: onPrefetchMetricAsset
  } = useListMetricVersions({
    assetId,
    type
  });

  const listItems = useMemo(() => {
    const items = type === 'metric' ? metricVersions : dashboardVersions;
    return items ? [...items].reverse() : [];
  }, [type, dashboardVersions, metricVersions]);

  const currentVersionNumber = useMemo(() => {
    return type === 'metric' ? metricCurrentVersionNumber : dashboardCurrentVersionNumber;
  }, [type, dashboardCurrentVersionNumber, metricCurrentVersionNumber]);

  const selectedQueryVersion = useMemo(() => {
    return type === 'metric' ? metricSelectedQueryVersion : dashboardSelectedQueryVersion;
  }, [type, dashboardSelectedQueryVersion, metricSelectedQueryVersion]);

  const onClickRestoreVersion = useMemoizedFn(
    async (versionNumber: number, rereouteToAsset = true) => {
      setRestoringVersion(versionNumber);

      if (type === 'metric') {
        await onRestoreMetricVersion(versionNumber);
        if (rereouteToAsset) {
          await onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_METRIC_ID_CHART,
              metricId: assetId
            })
          );
        }
      }
      if (type === 'dashboard') {
        await onRestoreDashboardVersion(versionNumber);
        if (rereouteToAsset) {
          await onChangePage(
            createBusterRoute({
              route: BusterRoutes.APP_DASHBOARD_ID,
              dashboardId: assetId
            })
          );
        }
      }
      onCloseVersionHistory();
      await timeout(500);
      setRestoringVersion(null);
    }
  );

  const onPrefetchAsset = useMemoizedFn(async (versionNumber: number, link: string) => {
    router.prefetch(link);

    if (type === 'metric') {
      await onPrefetchMetricAsset(versionNumber);
    } else {
      await onPrefetchDashboardAsset(versionNumber);
    }
  });

  const isRestoringVersion = useMemo(() => {
    return isSavingDashboard || isSavingMetric || restoringVersion !== null;
  }, [isSavingDashboard, isSavingMetric, restoringVersion]);

  return {
    listItems,
    currentVersionNumber,
    selectedQueryVersion,
    onClickRestoreVersion,
    isRestoringVersion,
    restoringVersion,
    onPrefetchAsset
  };
};

type UseListVersionReturn = {
  versions:
    | {
        version_number: number;
        updated_at: string;
      }[]
    | undefined;
  selectedQueryVersion: number | undefined;
  onRestoreVersion: (versionNumber: number) => Promise<unknown>;
  currentVersionNumber: number | undefined;
  isSaving: boolean;
  onPrefetchAsset: (versionNumber: number) => Promise<void>;
};

const useListDashboardVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}): UseListVersionReturn => {
  const prefetchGetDashboard = usePrefetchGetDashboardClient();
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const { mutateAsync: updateDashboard, isPending: isSaving } = useSaveDashboard({
    updateOnSave: true
  });
  const { data: dashboardData } = useGetDashboard(
    {
      id: type === 'dashboard' ? assetId : undefined,
      versionNumber: null
    },
    {
      enabled: !!assetId && type === 'dashboard', //we used version null so that we can get the latest version and all versions
      select: (x) => ({
        versions: x.versions,
        version_number: x.dashboard.version_number
      })
    }
  );

  const versions = dashboardData?.versions;
  const currentVersionNumber = last(versions)?.version_number;

  const selectedQueryVersion = useMemo(() => {
    if (dashboardVersionNumber) return dashboardVersionNumber;
    return last(versions)?.version_number;
  }, [versions, dashboardVersionNumber]);

  const onRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    await updateDashboard({
      id: assetId,
      restore_to_version: versionNumber
    });
  });

  const onPrefetchAsset = useMemoizedFn(async (versionNumber: number) => {
    prefetchGetDashboard(assetId, versionNumber);
  });

  return useMemo(() => {
    return {
      versions,
      selectedQueryVersion,
      onRestoreVersion,
      currentVersionNumber,
      isSaving,
      onPrefetchAsset
    };
  }, [
    versions,
    currentVersionNumber,
    onRestoreVersion,
    selectedQueryVersion,
    isSaving,
    onPrefetchAsset
  ]);
};

const useListMetricVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}): UseListVersionReturn => {
  const { mutateAsync: updateMetric, isPending: isSaving } = useSaveMetric({
    updateOnSave: true
  });
  const prefetchGetMetric = usePrefetchGetMetricClient();
  const prefetchGetMetricData = usePrefetchGetMetricDataClient();
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);

  const { data: metric } = useGetMetric(
    {
      id: type === 'metric' ? assetId : undefined,
      versionNumber: null
    },
    {
      enabled: !!assetId && type === 'metric', //we do not want to have undefined versions when
      select: (x) => ({
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );
  const versions = metric?.versions;
  const currentVersionNumber = last(versions)?.version_number;

  const selectedQueryVersion = useMemo(() => {
    if (metricVersionNumber) return metricVersionNumber;
    return last(versions)?.version_number;
  }, [versions, metricVersionNumber]);

  const onRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    await updateMetric({
      id: assetId,
      restore_to_version: versionNumber
    });
  });

  const onPrefetchAsset = useMemoizedFn(async (versionNumber: number) => {
    await Promise.all([
      prefetchGetMetric({ id: assetId, versionNumber }),
      prefetchGetMetricData({ id: assetId, versionNumber })
    ]);
  });

  return useMemo(() => {
    return {
      versions,
      selectedQueryVersion,
      onRestoreVersion,
      currentVersionNumber,
      isSaving,
      onPrefetchAsset
    };
  }, [
    versions,
    currentVersionNumber,
    onRestoreVersion,
    selectedQueryVersion,
    isSaving,
    onPrefetchAsset
  ]);
};
