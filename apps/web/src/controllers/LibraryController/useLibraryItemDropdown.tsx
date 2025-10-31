import type { AssetType } from '@buster/server-shared/assets';
import { useMemo } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useDeleteLibraryAssets } from '@/api/buster_rest/library';
import {
  useChatShareMenuSelectMenu,
  useFavoriteChatSelectMenu,
} from '@/components/features/chat/threeDotMenuHooks';
import {
  useCollectionShareMenuSelectMenu,
  useFavoriteCollectionSelectMenu,
} from '@/components/features/collections/threeDotMenuHooks';
import {
  useDashboardShareMenuSelectMenu,
  useEditDashboardWithAI,
  useFavoriteDashboardSelectMenu,
} from '@/components/features/dashboard/threeDotMenuHooks';
import {
  useEditMetricWithAI,
  useFavoriteMetricSelectMenu,
  useMetricShareMenuSelectMenu,
} from '@/components/features/metrics/threeDotMenuHooks';
import {
  useEditReportWithAI,
  useFavoriteReportSelectMenu,
  useReportShareMenuSelectMenu,
} from '@/components/features/reports/threeDotMenuHooks';
import type { ContextMenuItems } from '@/components/ui/context-menu';
import { Trash } from '@/components/ui/icons';
import { createMenuDivider, createMenuItem } from '@/components/ui/menu-shared';

const useRemoveFromLibrary = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: AssetType;
}) => {
  const { mutateAsync: onDeleteLibraryAsset, isPending: isDeletingLibraryAsset } =
    useDeleteLibraryAssets();
  return useMemo(() => {
    const removeFromLibraryItem = createMenuItem({
      type: 'item',
      value: 'remove-from-library',
      label: 'Remove from library',
      icon: <Trash />,
      loading: isDeletingLibraryAsset,
      onClick: () => onDeleteLibraryAsset([{ assetId, assetType }]),
    });
    return removeFromLibraryItem;
  }, [assetId, assetType, onDeleteLibraryAsset, isDeletingLibraryAsset]);
};

export const useMetricLibraryItems = (metricId: string) => {
  const editWithAI = useEditMetricWithAI({ metricId, versionNumber: undefined });
  const removeFromLibrary = useRemoveFromLibrary({ assetId: metricId, assetType: 'metric_file' });
  const favoriteMetric = useFavoriteMetricSelectMenu({ metricId, versionNumber: undefined });
  const shareMenu = useMetricShareMenuSelectMenu({ metricId, versionNumber: undefined });
  return useMemo(
    () => [
      editWithAI,
      createMenuDivider(),
      shareMenu,
      favoriteMetric,
      createMenuDivider(),
      removeFromLibrary,
    ],
    [editWithAI, removeFromLibrary, favoriteMetric, shareMenu]
  );
};

export const useDashboardLibraryItems = (dashboardId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({
    assetId: dashboardId,
    assetType: 'dashboard_file',
  });
  const editWithAI = useEditDashboardWithAI({ dashboardId, dashboardVersionNumber: undefined });
  const shareMenu = useDashboardShareMenuSelectMenu({
    dashboardId,
    dashboardVersionNumber: undefined,
  });
  const favoriteDashboard = useFavoriteDashboardSelectMenu({
    dashboardId,
    dashboardVersionNumber: undefined,
  });
  return useMemo(
    () => [
      editWithAI,
      createMenuDivider(),
      shareMenu,
      favoriteDashboard,
      createMenuDivider(),
      removeFromLibrary,
    ],
    [editWithAI, removeFromLibrary, shareMenu, favoriteDashboard]
  );
};

export const useReportLibraryItems = (reportId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({ assetId: reportId, assetType: 'report_file' });
  const editWithAI = useEditReportWithAI({ reportId });
  const shareMenu = useReportShareMenuSelectMenu({ reportId });
  const favoriteReport = useFavoriteReportSelectMenu({ reportId });
  return useMemo(
    () => [
      editWithAI,
      createMenuDivider(),
      shareMenu,
      favoriteReport,
      createMenuDivider(),
      removeFromLibrary,
    ],
    [editWithAI, removeFromLibrary, shareMenu, favoriteReport]
  );
};

export const useCollectionLibraryItems = (collectionId: string): ContextMenuItems => {
  const { mutateAsync: onDeleteCollection } = useDeleteCollection();
  const favoriteCollection = useFavoriteCollectionSelectMenu({ collectionId });
  const shareMenu = useCollectionShareMenuSelectMenu({ collectionId });

  return useMemo(() => {
    return [
      createMenuItem({
        type: 'item',
        value: 'delete',
        label: 'Delete',
        icon: <Trash />,
        onClick: () => onDeleteCollection({ id: collectionId, useConfirmModal: false }),
      }),
      shareMenu,
      createMenuDivider(),
      favoriteCollection,
    ];
  }, [onDeleteCollection, collectionId, favoriteCollection, shareMenu]);
};

export const useChatLibraryItems = (chatId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({ assetId: chatId, assetType: 'chat' });
  const favoriteChat = useFavoriteChatSelectMenu({ chatId });
  const shareMenu = useChatShareMenuSelectMenu({ chatId });
  return useMemo(
    () => [shareMenu, favoriteChat, createMenuDivider(), removeFromLibrary],
    [shareMenu, favoriteChat, removeFromLibrary]
  );
};
