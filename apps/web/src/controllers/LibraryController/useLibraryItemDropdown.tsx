import type { AssetType } from '@buster/server-shared/assets';
import { useMemo } from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';
import { useDeleteLibraryAssets } from '@/api/buster_rest/library';
import { useFavoriteChatSelectMenu } from '@/components/features/chat/threeDotMenuHooks';
import { useFavoriteCollectionSelectMenu } from '@/components/features/collections/threeDotMenuHooks';
import { useEditDashboardWithAI } from '@/components/features/dashboard/threeDotMenuHooks';
import {
  useEditMetricWithAI,
  useFavoriteMetricSelectMenu,
} from '@/components/features/metrics/threeDotMenuHooks';
import { useEditReportWithAI } from '@/components/features/reports/threeDotMenuHooks';
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
  return useMemo(
    () => [editWithAI, removeFromLibrary, createMenuDivider(), favoriteMetric],
    [editWithAI, removeFromLibrary, favoriteMetric]
  );
};

export const useDashboardLibraryItems = (dashboardId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({
    assetId: dashboardId,
    assetType: 'dashboard_file',
  });
  const editWithAI = useEditDashboardWithAI({ dashboardId, dashboardVersionNumber: undefined });
  return useMemo(() => [editWithAI, removeFromLibrary], [editWithAI, removeFromLibrary]);
};

export const useReportLibraryItems = (reportId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({ assetId: reportId, assetType: 'report_file' });
  const editWithAI = useEditReportWithAI({ reportId });
  return useMemo(() => [editWithAI, removeFromLibrary], [editWithAI, removeFromLibrary]);
};

export const useCollectionLibraryItems = (collectionId: string): ContextMenuItems => {
  const { mutateAsync: onDeleteCollection } = useDeleteCollection();
  const favoriteCollection = useFavoriteCollectionSelectMenu({ collectionId });

  return useMemo(() => {
    return [
      createMenuItem({
        type: 'item',
        value: 'delete',
        label: 'Delete',
        icon: <Trash />,
        onClick: () => onDeleteCollection({ id: collectionId, useConfirmModal: false }),
      }),
      createMenuDivider(),
      favoriteCollection,
    ];
  }, [onDeleteCollection, collectionId, favoriteCollection]);
};

export const useChatLibraryItems = (chatId: string) => {
  const removeFromLibrary = useRemoveFromLibrary({ assetId: chatId, assetType: 'chat' });
  const favoriteChat = useFavoriteChatSelectMenu({ chatId });
  return useMemo(() => [removeFromLibrary, favoriteChat], [removeFromLibrary, favoriteChat]);
};
