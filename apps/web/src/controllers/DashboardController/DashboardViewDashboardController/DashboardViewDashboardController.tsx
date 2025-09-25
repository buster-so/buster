import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { useGetDashboard, useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';
import { AddToDashboardModal } from '@/components/features/dashboard/AddToDashboardModal';
import { StatusCard } from '@/components/ui/card/StatusCard';
import { useToggleDashboardContentModal } from '@/context/Dashboards/dashboard-content-store';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { canEdit } from '@/lib/share';
import { DashboardContentController } from './DashboardContentController';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardSaveFilePopup } from './DashboardSaveFilePopup';

export const DashboardViewDashboardController: React.FC<{
  dashboardId: string;
  readOnly?: boolean;
  dashboardVersionNumber: number | undefined;
  animate?: boolean;
}> = ({ dashboardId, dashboardVersionNumber, readOnly: readOnlyProp = false, animate = true }) => {
  const {
    data: dashboardResponse,
    isFetched,
    isError,
    error,
  } = useGetDashboard({ id: dashboardId, versionNumber: dashboardVersionNumber });

  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();

  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;
  const { isReadOnly, isViewingOldVersion, isVersionHistoryMode } = useIsDashboardReadOnly({
    dashboardId,
    readOnly: readOnlyProp,
  });
  const isEditor = canEdit(dashboardResponse?.permission);
  const { openDashboardContentModal, onCloseDashboardContentModal, onOpenDashboardContentModal } =
    useToggleDashboardContentModal();

  if (!isFetched) {
    return null;
  }

  if (isError) {
    return (
      <div className="p-10">
        <StatusCard variant="danger" title="Error" message={error?.message || ''} />
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="flex h-full flex-col space-y-3 p-10">
        <DashboardEditTitles
          dashboardId={dashboardId}
          readOnly={isReadOnly}
          title={dashboardResponse?.dashboard?.name || ''}
          description={dashboardResponse?.dashboard?.description || ''}
        />

        <DashboardContentController
          metrics={metrics}
          dashboard={dashboard}
          onUpdateDashboardConfig={onUpdateDashboardConfig}
          onOpenAddContentModal={onOpenDashboardContentModal}
          readOnly={isReadOnly}
          animate={animate}
        />

        {!isReadOnly && !isVersionHistoryMode && !isViewingOldVersion && (
          <DashboardSaveFilePopup dashboardId={dashboardId} />
        )}
      </div>

      {isEditor && !isReadOnly && (
        <AddToDashboardModal
          open={openDashboardContentModal}
          onClose={onCloseDashboardContentModal}
          dashboardId={dashboardId}
          dashboardVersionNumber={dashboardVersionNumber}
        />
      )}
    </ClientOnly>
  );
};
