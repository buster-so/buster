'use client';

import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { pathNameToRoute } from '@/routes/helpers';
import type { FileViewSecondary } from './useLayoutConfig';
import type { FileType } from '@/api/asset_interfaces';

export const useGetChatParams = () => {
  const params = useParams() as {
    versionNumber: string | undefined;
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
    datasetId: string | undefined;
    messageId: string | undefined;
    reportId: string | undefined;
  };
  const {
    chatId,

    metricId,
    dashboardId,
    collectionId,
    datasetId,
    messageId,
    reportId
  } = params;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryMetricVersionNumber = searchParams.get('metric_version_number');
  const queryDashboardVersionNumber = searchParams.get('dashboard_version_number');
  const queryReportVersionNumber = searchParams.get('report_version_number');
  const secondaryView = searchParams.get('secondary_view') as FileViewSecondary | undefined;
  const currentRoute = pathNameToRoute(pathname, params);

  const metricVersionNumber = useMemo(() => {
    if (!metricId) return undefined;
    if (queryMetricVersionNumber) return Number.parseInt(queryMetricVersionNumber);
    return undefined;
  }, [metricId, queryMetricVersionNumber]);

  const dashboardVersionNumber = useMemo(() => {
    if (!dashboardId) return undefined;
    if (queryDashboardVersionNumber) return Number.parseInt(queryDashboardVersionNumber);
    return undefined;
  }, [dashboardId, queryDashboardVersionNumber]);

  const reportVersionNumber = useMemo(() => {
    if (!reportId) return undefined;
    if (queryReportVersionNumber) return Number.parseInt(queryReportVersionNumber);
    return undefined;
  }, [reportId, queryReportVersionNumber]);

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
      reportId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber,
      reportVersionNumber,
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
