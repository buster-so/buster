import last from 'lodash/last';
import { useCallback, useMemo } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { canEdit } from '@/lib/share';
import { useChatIsVersionHistoryMode } from '../Chats/useIsVersionHistoryMode';
import { useGetDashboardParams } from './useGetDashboardParams';

export const useIsDashboardReadOnly = ({
  dashboardId,
  readOnly,
}: {
  dashboardId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatIsVersionHistoryMode({ type: 'dashboard_file' });
  const { dashboardVersionNumber } = useGetDashboardParams();
  const {
    data: dashboardData,
    isFetched,
    isError,
  } = useGetDashboard(
    { id: dashboardId, versionNumber: 'LATEST' },
    {
      select: useCallback((x: BusterDashboardResponse) => {
        return {
          permission: x.permission,
          versions: x.versions,
          version_number: x.dashboard.version_number,
        };
      }, []),
    }
  );

  const isViewingOldVersion = checkIfDashboardIsViewingOldVersion(
    dashboardVersionNumber,
    dashboardData
  );

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (isError) return true;
    if (!isFetched) return true;
    if (!canEdit(dashboardData?.permission)) return true;
    if (isVersionHistoryMode) return true;
    if (isViewingOldVersion) return true;
    return false;
  }, [isError, isFetched, dashboardData, isVersionHistoryMode, isViewingOldVersion, readOnly]);

  return {
    isFetched,
    isError,
    isVersionHistoryMode,
    isReadOnly,
    isViewingOldVersion,
  };
};

const checkIfDashboardIsViewingOldVersion = (
  dashboardVersionNumber: number | undefined,
  dashboardData?: {
    versions: BusterDashboardResponse['versions'];
    version_number: BusterDashboardResponse['dashboard']['version_number'];
  }
) => {
  if (!dashboardVersionNumber) return false;
  if (dashboardVersionNumber !== last(dashboardData?.versions)?.version_number) return true;
  return false;
};
