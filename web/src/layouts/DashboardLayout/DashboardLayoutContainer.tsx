'use client';

import React from 'react';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { AddToDashboardModal } from '@/components/features/modal/AddToDashboardModal';
import { useDashboardContentStore } from '@/context/Dashboards';
import { canEdit } from '@/lib/share';

export const DashboardLayoutContainer: React.FC<{
  children: React.ReactNode;
  dashboardId: string;
}> = ({ children, dashboardId }) => {
  return (
    <>
      {children}
      <MemoizedAddToDashboardModal dashboardId={dashboardId} />
    </>
  );
};

const MemoizedAddToDashboardModal = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { data: permission } = useGetDashboard(
    { id: dashboardId },
    { select: (x) => x.permission }
  );
  const isEditor = canEdit(permission);
  const { openAddContentModal, onCloseAddContentModal } = useDashboardContentStore();

  if (!isEditor) return null;

  return (
    <AddToDashboardModal
      open={openAddContentModal}
      onClose={onCloseAddContentModal}
      dashboardId={dashboardId}
    />
  );
});

MemoizedAddToDashboardModal.displayName = 'MemoizedAddToDashboardModal';
