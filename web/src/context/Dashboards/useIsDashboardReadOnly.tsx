import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { canEdit, getIsOwner } from '@/lib/share';
import last from 'lodash/last';
import { useMemo } from 'react';

export const useIsDashboardReadOnly = ({
  dashboardId,
  readOnly
}: {
  dashboardId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const {
    data: dashboardData,
    isFetched,
    isError
  } = useGetDashboard(
    { id: dashboardId },
    {
      enabled: false,
      select: (x) => ({
        permission: x.permission,
        versions: x.versions
      })
    }
  );

  const isViewingOldVersion = useMemo(() => {
    if (!dashboardVersionNumber) return false;
    if (dashboardVersionNumber !== last(dashboardData?.versions)?.version_number) return true;
    return false;
  }, [dashboardVersionNumber, dashboardData]);

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (isError) return true;
    if (!isFetched) return true;
    if (!canEdit(dashboardData?.permission)) return true;
    if (isVersionHistoryMode) return true;
    if (isViewingOldVersion) return true;
    return false;
  }, [isError, isFetched, dashboardData, isVersionHistoryMode, isViewingOldVersion]);

  const isEditor = canEdit(dashboardData?.permission);

  return {
    isVersionHistoryMode,
    isReadOnly,
    isViewingOldVersion,
    isFetched,
    isError,
    isEditor
  };
};
