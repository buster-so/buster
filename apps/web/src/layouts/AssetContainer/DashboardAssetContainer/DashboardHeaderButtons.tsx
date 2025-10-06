import React, { useCallback } from 'react';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { CreateChatButton } from '@/components/features/AssetLayout/CreateChatButton';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { ClosePageButton } from '@/components/features/chat/ClosePageButton';
import { DashboardThreeDotMenu } from '@/components/features/dashboard/DashboardThreeDotMenu';
import { useIsEmbed } from '@/context/BusterAssets/useIsEmbed';
import { useIsChatMode, useIsFileMode } from '@/context/Chats/useMode';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';

export const DashboardContainerHeaderButtons: React.FC<{
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}> = React.memo(({ dashboardId, dashboardVersionNumber }) => {
  const isChatMode = useIsChatMode();
  const isFileMode = useIsFileMode();
  const isEmbed = useIsEmbed();
  const { isViewingOldVersion } = useIsDashboardReadOnly({
    dashboardId: dashboardId || '',
  });
  const { data: permission } = useGetDashboard(
    { id: dashboardId, versionNumber: dashboardVersionNumber },
    { select: useCallback((x: BusterDashboardResponse) => x.permission, []) }
  );

  const isEffectiveOwner = getIsEffectiveOwner(permission);
  const isEditor = canEdit(permission);

  return (
    <FileButtonContainer>
      {isEffectiveOwner && !isViewingOldVersion && (
        <ShareDashboardButton
          dashboardId={dashboardId}
          dashboardVersionNumber={dashboardVersionNumber}
        />
      )}
      {!isEmbed && (
        <DashboardThreeDotMenu
          dashboardId={dashboardId}
          isViewingOldVersion={isViewingOldVersion}
          dashboardVersionNumber={dashboardVersionNumber}
        />
      )}
      <HideButtonContainer show={isFileMode && isEditor}>
        <CreateChatButton assetId={dashboardId} assetType="dashboard_file" />
      </HideButtonContainer>
      {isChatMode && <ClosePageButton isEmbed={isEmbed} />}
    </FileButtonContainer>
  );
});

DashboardContainerHeaderButtons.displayName = 'DashboardContainerHeaderButtons';
