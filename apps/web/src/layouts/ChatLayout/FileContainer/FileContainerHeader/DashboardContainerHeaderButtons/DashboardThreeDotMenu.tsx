import React, { useMemo, useState } from 'react';
import { ShareAssetType } from '@buster/server-shared/share';
import {
  useAddDashboardToCollection,
  useDeleteDashboards,
  useGetDashboard,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import { useListVersionDropdownItems } from '@/components/features/versionHistory/useListVersionDropdownItems';
import { Button } from '@/components/ui/buttons';
import {
  Dropdown,
  DropdownContent,
  type DropdownItem,
  type DropdownItems
} from '@/components/ui/dropdown';
import {
  ArrowUpRight,
  Dots,
  Download4,
  Filter,
  History,
  Pencil,
  Plus,
  ShareRight,
  SquareChart,
  Star,
  Trash
} from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useDashboardContentStore } from '@/context/Dashboards';
import { DASHBOARD_TITLE_INPUT_ID } from '@/controllers/DashboardController/DashboardViewDashboardController/DashboardEditTitle';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { timeout } from '@/lib';
import { downloadElementToImage, exportJSONToCSV } from '@/lib/exportUtils';
import { canEdit, canFilter, getIsEffectiveOwner } from '@/lib/share';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

export const DashboardThreeDotMenu = React.memo(
  ({ dashboardId, isViewingOldVersion }: { dashboardId: string; isViewingOldVersion: boolean }) => {
    const versionHistoryItems = useVersionHistorySelectMenu({ dashboardId });
    const chatId = useChatIndividualContextSelector((x) => x.chatId);
    const collectionSelectMenu = useCollectionSelectMenu({ dashboardId });
    const openFullScreenDashboard = useOpenFullScreenDashboard({ dashboardId });
    const favoriteDashboard = useFavoriteDashboardSelectMenu({ dashboardId });
    const deleteDashboardMenu = useDeleteDashboardSelectMenu({ dashboardId });
    const renameDashboardMenu = useRenameDashboardSelectMenu({ dashboardId });
    const shareMenu = useShareMenuSelectMenu({ dashboardId });
    const addContentToDashboardMenu = useAddContentToDashboardSelectMenu();
    const filterDashboardMenu = useFilterDashboardSelectMenu();
    const downloadCSVMenu = useDownloadDashboardCSVSelectMenu({ dashboardId });
    const downloadPNGMenu = useDownloadDashboardPNGSelectMenu({ dashboardId });
    const { data: permission } = useGetDashboard(
      { id: dashboardId },
      { select: (x) => x.permission }
    );
    const isEffectiveOwner = getIsEffectiveOwner(permission);
    const isFilter = canFilter(permission);
    const isEditor = canEdit(permission);

    const items: DropdownItems = useMemo(
      () =>
        [
          chatId && openFullScreenDashboard,
          isFilter && !isViewingOldVersion && filterDashboardMenu,
          isEditor && !isViewingOldVersion && addContentToDashboardMenu,
          { type: 'divider' },
          isEffectiveOwner && !isViewingOldVersion && shareMenu,
          collectionSelectMenu,
          favoriteDashboard,
          versionHistoryItems,
          { type: 'divider' },
          downloadCSVMenu,
          downloadPNGMenu,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && renameDashboardMenu,
          isEffectiveOwner && !isViewingOldVersion && deleteDashboardMenu
        ].filter(Boolean) as DropdownItems,
      [
        chatId,
        openFullScreenDashboard,
        filterDashboardMenu,
        addContentToDashboardMenu,
        shareMenu,
        collectionSelectMenu,
        favoriteDashboard,
        versionHistoryItems,
        downloadCSVMenu,
        downloadPNGMenu,
        renameDashboardMenu,
        deleteDashboardMenu
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

const useVersionHistorySelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);

  const { data } = useGetDashboard(
    { id: dashboardId },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.dashboard?.version_number
      })
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: DropdownItems = useListVersionDropdownItems({
    versions,
    selectedVersion: version_number,
    chatId,
    fileId: dashboardId,
    fileType: 'dashboard',
    useVersionHistoryMode: true
  });

  const reverseVersionHistoryItems = useMemo(() => {
    return [...versionHistoryItems].reverse();
  }, [versionHistoryItems]);

  return useMemo(
    () => ({
      label: 'Version history',
      value: 'version-history',
      icon: <History />,
      items: [
        <React.Fragment key="version-history-sub-menu">
          <DropdownContent items={reverseVersionHistoryItems} selectType="single" />
        </React.Fragment>
      ]
    }),
    [versionHistoryItems]
  );
};

const useCollectionSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: saveDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: removeDashboardFromCollection } = useRemoveDashboardFromCollection();
  const { data: collections } = useGetDashboard(
    { id: dashboardId },
    { select: (x) => x.collections }
  );
  const { openInfoMessage } = useBusterNotifications();

  const selectedCollections = useMemo(() => {
    return collections?.map((x) => x.id) || [];
  }, [collections]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveDashboardToCollection({ dashboardIds: [dashboardId], collectionIds });
    openInfoMessage('Dashboard saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeDashboardFromCollection({
      dashboardIds: [dashboardId],
      collectionIds: [collectionId]
    });
    openInfoMessage('Dashboard removed from collections');
  });

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections
  });

  const collectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const collectionDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [
        <React.Fragment key="collection-sub-menu">
          {collectionSubMenu} {ModalComponent}
        </React.Fragment>
      ]
    }),
    [collectionSubMenu]
  );

  return collectionDropdownItem;
};

const useFavoriteDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { data: title } = useGetDashboard(
    { id: dashboardId },
    { select: (x) => x?.dashboard?.name }
  );
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: dashboardId,
    type: 'dashboard',
    name: title || ''
  });

  const item: DropdownItem = useMemo(
    () => ({
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      value: 'add-to-favorites',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: onFavoriteClick
    }),
    [isFavorited, onFavoriteClick]
  );

  return item;
};

const useDeleteDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: deleteDashboard } = useDeleteDashboards();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  return useMemo(
    () => ({
      label: 'Delete dashboard',
      value: 'delete-dashboard',
      icon: <Trash />,
      onClick: async () => {
        await deleteDashboard({ dashboardId });
        onChangePage({ route: BusterRoutes.APP_DASHBOARDS });
      }
    }),
    [dashboardId]
  );
};

const useRenameDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  return useMemo(
    () => ({
      label: 'Rename dashboard',
      value: 'rename-dashboard',
      icon: <Pencil />,
      onClick: async () => {
        onSetFileView({ fileView: 'dashboard', fileId: dashboardId });
        await timeout(125);
        const input = document.getElementById(DASHBOARD_TITLE_INPUT_ID) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }),
    [dashboardId]
  );
};

const useAddContentToDashboardSelectMenu = () => {
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);

  return useMemo(
    () => ({
      label: 'Add content',
      value: 'add-content',
      icon: <Plus />,
      onClick: onOpenAddContentModal
    }),
    [onOpenAddContentModal]
  );
};

const useFilterDashboardSelectMenu = () => {
  return useMemo(
    () => ({
      label: 'Filter dashboard',
      value: 'filter-dashboard',
      icon: <Filter />,
      items: [
        <div className="p-2.5" key="coming-soon">
          Coming soon 🤙...
        </div>
      ]
    }),
    []
  );
};

const useOpenFullScreenDashboard = ({ dashboardId }: { dashboardId: string }) => {
  return useMemo(
    () => ({
      label: 'Open in dashboard page',
      value: 'open-in-full-screen',
      icon: <ArrowUpRight />,
      link: createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId
      })
    }),
    [dashboardId]
  );
};

export const useShareMenuSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { data: dashboard } = useGetDashboard({ id: dashboardId }, { select: getShareAssetConfig });
  const isOwner = getIsEffectiveOwner(dashboard?.permission);

  return useMemo(
    () => ({
      label: 'Share',
      value: 'share-dashboard',
      icon: <ShareRight />,
      disabled: !isOwner,
      items:
        isOwner && dashboard
          ? [
              <ShareMenuContent
                key={dashboardId}
                shareAssetConfig={dashboard}
                assetId={dashboardId}
                assetType={'dashboard'}
              />
            ]
          : undefined
    }),
    [dashboardId, dashboard, isOwner]
  );
};

const useDownloadDashboardCSVSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: dashboardResponse } = useGetDashboard({ id: dashboardId });
  const { openErrorMessage } = useBusterNotifications();

  return useMemo(
    () => ({
      label: 'Download as CSV',
      value: 'download-csv',
      icon: <Download4 />,
      loading: isDownloading,
      onClick: async () => {
        if (!dashboardResponse?.metrics || !dashboardResponse?.dashboard?.name) {
          openErrorMessage('Dashboard data not available for export');
          return;
        }

        setIsDownloading(true);
        try {
          const metricIds = Object.keys(dashboardResponse.metrics);
          
          const aggregatedData = metricIds.map((metricId) => {
            const metric = dashboardResponse.metrics[metricId];
            return {
              metric_id: metricId,
              metric_name: metric.name,
              metric_description: metric.description || '',
              metric_status: metric.status,
              created_at: metric.created_at,
              updated_at: metric.updated_at
            };
          });

          await exportJSONToCSV(aggregatedData, `${dashboardResponse.dashboard.name}_metrics`);
        } catch (error) {
          console.error('Error exporting dashboard CSV:', error);
          openErrorMessage('Failed to export dashboard as CSV');
        } finally {
          setIsDownloading(false);
        }
      }
    }),
    [dashboardResponse, isDownloading, openErrorMessage]
  );
};

const useDownloadDashboardPNGSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: dashboardResponse } = useGetDashboard({ id: dashboardId });

  return useMemo(
    () => ({
      label: 'Download as PNG',
      value: 'download-png',
      icon: <SquareChart />,
      onClick: async () => {
        const dashboardContainer = document.querySelector('.dashboard-content-controller') as HTMLElement;
        if (dashboardContainer && dashboardResponse?.dashboard?.name) {
          try {
            return await downloadElementToImage(dashboardContainer, `${dashboardResponse.dashboard.name}.png`);
          } catch (error) {
            console.error('Error exporting dashboard PNG:', error);
          }
        }

        openErrorMessage('Failed to download PNG');
      }
    }),
    [dashboardResponse, openErrorMessage]
  );
};
