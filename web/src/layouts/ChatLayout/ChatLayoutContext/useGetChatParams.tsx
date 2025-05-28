'use client';

import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { pathNameToRoute } from '@/routes/helpers';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { FileViewSecondary } from './useLayoutConfig';

export const useGetChatParams = () => {
  const params = useParams() as {
    versionNumber: string | undefined;
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
    datasetId: string | undefined;
    messageId: string | undefined;
  };
  const {
    chatId,
    versionNumber: versionNumberPath,
    metricId,
    dashboardId,
    collectionId,
    datasetId,
    messageId
  } = params;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryMetricVersionNumber = searchParams.get('metric_version_number');
  const queryDashboardVersionNumber = searchParams.get('dashboard_version_number');
  const secondaryView = searchParams.get('secondary_view') as FileViewSecondary | undefined;
  const currentRoute = pathNameToRoute(pathname, params);
  const iCurrentRoute = useAppLayoutContextSelector((x) => x.currentRoute);

  const metricVersionNumber = useMemo(() => {
    if (!metricId) return undefined;
    if (versionNumberPath) return Number.parseInt(versionNumberPath);
    if (queryMetricVersionNumber) return Number.parseInt(queryMetricVersionNumber);
    return undefined;
  }, [versionNumberPath, metricId, queryMetricVersionNumber]);

  const dashboardVersionNumber = useMemo(() => {
    if (!dashboardId) return undefined;
    if (versionNumberPath) return Number.parseInt(versionNumberPath);
    if (queryDashboardVersionNumber) return Number.parseInt(queryDashboardVersionNumber);
    return undefined;
  }, [versionNumberPath, dashboardId, queryDashboardVersionNumber]);

  const isVersionHistoryMode = useMemo(() => {
    if (secondaryView === 'version-history') return true;
    return false;
  }, [secondaryView]);

  return useMemo(
    () => ({
      currentRoute,
      isVersionHistoryMode,
      chatId,
      metricId,
      dashboardId,
      collectionId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber,
      secondaryView
    }),
    //So... currentRoute was always one render cycle behind the app context selector. So we calculate it here.
    [
      currentRoute,
      isVersionHistoryMode,
      chatId,
      metricId,
      dashboardId,
      collectionId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber,
      secondaryView
    ]
  );
};

export type ChatParams = ReturnType<typeof useGetChatParams>;
