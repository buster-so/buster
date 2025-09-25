import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import React, { useCallback, useMemo } from 'react';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { Dots } from '@/components/ui/icons';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { canEdit, canFilter, getIsEffectiveOwner } from '@/lib/share';
import {
  useAddContentToDashboardSelectMenu,
  useCollectionSelectMenu,
  useDashboardVersionHistorySelectMenu,
  useDeleteDashboardSelectMenu,
  useEditDashboardWithAI,
  useFavoriteDashboardSelectMenu,
  useFilterDashboardSelectMenu,
  useOpenFullScreenDashboard,
  useRenameDashboardSelectMenu,
  useShareMenuSelectMenu,
} from './threeDotMenuHooks';

export const DashboardThreeDotMenu = React.memo(
  ({
    dashboardId,
    isViewingOldVersion,
    dashboardVersionNumber,
  }: {
    dashboardId: string;
    isViewingOldVersion: boolean;
    dashboardVersionNumber: number | undefined;
  }) => {
    const versionHistoryItems = useDashboardVersionHistorySelectMenu({
      dashboardId,
      dashboardVersionNumber,
    });
    const chatId = useGetChatId();
    const collectionSelectMenu = useCollectionSelectMenu({ dashboardId, dashboardVersionNumber });
    const openFullScreenDashboard = useOpenFullScreenDashboard({ dashboardId });
    const favoriteDashboard = useFavoriteDashboardSelectMenu({
      dashboardId,
      dashboardVersionNumber,
    });
    const deleteDashboardMenu = useDeleteDashboardSelectMenu({ dashboardId });
    const renameDashboardMenu = useRenameDashboardSelectMenu({
      dashboardId,
      dashboardVersionNumber,
    });
    const shareMenu = useShareMenuSelectMenu({ dashboardId, dashboardVersionNumber });
    const addContentToDashboardMenu = useAddContentToDashboardSelectMenu();
    const filterDashboardMenu = useFilterDashboardSelectMenu();
    const { data: permission } = useGetDashboard(
      { id: dashboardId, versionNumber: dashboardVersionNumber },
      { select: useCallback((x: GetDashboardResponse) => x.permission, []) }
    );
    const editDashboardWithAI = useEditDashboardWithAI({ dashboardId, dashboardVersionNumber });
    const isEffectiveOwner = getIsEffectiveOwner(permission);
    const isFilter = canFilter(permission);
    const isEditor = canEdit(permission);

    const items: IDropdownItems = useMemo(
      () =>
        [
          ...(chatId ? [openFullScreenDashboard, { type: 'divider' }] : []),
          editDashboardWithAI,
          { type: 'divider' },
          isEffectiveOwner && !isViewingOldVersion && shareMenu,
          collectionSelectMenu,
          favoriteDashboard,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && addContentToDashboardMenu,
          versionHistoryItems,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && renameDashboardMenu,
          isEffectiveOwner && !isViewingOldVersion && deleteDashboardMenu,
        ].filter(Boolean) as IDropdownItems,
      [
        chatId,
        openFullScreenDashboard,
        filterDashboardMenu,
        addContentToDashboardMenu,
        shareMenu,
        collectionSelectMenu,
        favoriteDashboard,
        versionHistoryItems,
        renameDashboardMenu,
        deleteDashboardMenu,
      ]
    );

    return (
      <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
        <Button prefix={<Dots />} variant="ghost" />
      </Dropdown>
    );
  }
);
DashboardThreeDotMenu.displayName = 'ThreeDotMenuButton';
