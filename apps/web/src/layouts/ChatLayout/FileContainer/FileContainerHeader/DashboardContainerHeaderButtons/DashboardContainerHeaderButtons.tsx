'use client';

import React from 'react';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { SaveDashboardToCollectionButton } from '@/components/features/buttons/SaveDashboardToCollectionButton';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { Button } from '@/components/ui/buttons';
import { BarsFilter, Plus } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useDashboardContentStore } from '@/context/Dashboards';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { canEdit, canShare, getIsEffectiveOwner } from '@/lib/share';
import { CreateChatButton } from '../CreateChatButtont';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';
import type { FileContainerButtonsProps } from '../interfaces';
import { DashboardThreeDotMenu } from './DashboardThreeDotMenu';
import { FollowUpWithAssetPopup } from '@/components/features/popups/FollowUpWithAsset';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  ({ selectedFileId }) => {
    const dashboardId = selectedFileId || '';
    const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
    const { isViewingOldVersion } = useIsDashboardReadOnly({
      dashboardId
    });
    const { data: permission, error: dashboardError } = useGetDashboard(
      { id: dashboardId },
      { select: (x) => x.permission }
    );

    if (dashboardError || !permission) return null;

    const isEditor = canEdit(permission);
    const isEffectiveOwner = getIsEffectiveOwner(permission);
    const isShareable = canShare(permission);

    return (
      <FileButtonContainer>
        {/* {isShareable && <FollowUpWithAssetButton dashboardId={dashboardId} />} */}
        <SaveToCollectionButton dashboardId={dashboardId} />
        {isEffectiveOwner && <ShareDashboardButton dashboardId={dashboardId} />}
        {isEditor && !isViewingOldVersion && <AddContentToDashboardButton />}
        <DashboardThreeDotMenu
          dashboardId={dashboardId}
          isViewingOldVersion={isViewingOldVersion}
        />
        <HideButtonContainer show={selectedLayout === 'file-only'}>
          <CreateChatButton assetId={dashboardId} assetType="dashboard" />
        </HideButtonContainer>
      </FileButtonContainer>
    );
  }
);

DashboardContainerHeaderButtons.displayName = 'DashboardContainerHeaderButtons';

const SaveToCollectionButton = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { data: collections } = useGetDashboard(
    { id: dashboardId },
    { select: (x) => x.collections?.map((x) => x.id) }
  );

  return (
    <SaveDashboardToCollectionButton
      dashboardIds={[dashboardId]}
      selectedCollections={collections || []}
    />
  );
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const AddContentToDashboardButton = React.memo(() => {
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);

  return (
    <AppTooltip title="Add content">
      <Button variant="ghost" prefix={<Plus />} onClick={onOpenAddContentModal} />
    </AppTooltip>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';

const FollowUpWithAssetButton = React.memo(({ dashboardId }: { dashboardId: string }) => {
  return (
    <FollowUpWithAssetPopup assetId={dashboardId} assetType="dashboard">
      <Button variant="ghost" prefix={<BarsFilter />} />
    </FollowUpWithAssetPopup>
  );
});
FollowUpWithAssetButton.displayName = 'FollowUpWithAssetButton';
