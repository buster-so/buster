import React, { useCallback } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard, useSaveDashboard } from '@/api/buster_rest/dashboards';
import { DashboardViewDashboardController } from '@/controllers/DashboardController/DashboardViewDashboardController';
import { ScrollArea } from '../../ui/scroll-area';
import { useVersionHistoryModalCommon } from './useVersionHistoryModalCommon';
import { VersionHistoryModal, type VersionHistoryModalProps } from './VersionHistoryModal';

type DashboardVersionModalProps = Pick<VersionHistoryModalProps, 'onClose' | 'versionNumber'> & {
  dashboardId: string;
};

export const DashboardVersionModal = React.memo(
  ({ onClose, versionNumber: versionNumberProp, dashboardId }: DashboardVersionModalProps) => {
    const { data } = useGetDashboard(
      { id: dashboardId, versionNumber: 'LATEST' },
      {
        select: useCallback(
          (x: BusterDashboardResponse) => ({
            versions: x.versions,
            name: x.dashboard.name,
          }),
          []
        ),
      }
    );
    const { mutateAsync: updateDashboard, isPending: isRestoringVersion } = useSaveDashboard({
      updateOnSave: true,
      updateVersion: true,
    });

    const {
      title,
      versionNumber,
      versionHistoryItems,
      onClickVersion,
      onClickRestoreVersion,
      learnMoreButton,
    } = useVersionHistoryModalCommon({
      versionNumber: versionNumberProp,
      versions: data?.versions,
      title: data?.name,
      isRestoringVersion,
      onClose,
      updateAsset: async (versionNumber: number) => {
        await updateDashboard({
          id: dashboardId,
          restore_to_version: versionNumber,
        });
      },
    });

    return (
      <VersionHistoryModal
        onClose={onClose}
        versionNumber={versionNumber}
        title={title}
        versionHistoryItems={versionHistoryItems}
        onClickVersion={onClickVersion}
        onClickRestoreVersion={onClickRestoreVersion}
        isRestoringVersion={isRestoringVersion}
        learnMoreButton={learnMoreButton}
      >
        {versionNumber && (
          <ScrollArea className="h-full">
            <DashboardViewDashboardController
              dashboardId={dashboardId}
              readOnly
              dashboardVersionNumber={versionNumber}
              animate={false}
            />
          </ScrollArea>
        )}
      </VersionHistoryModal>
    );
  }
);
