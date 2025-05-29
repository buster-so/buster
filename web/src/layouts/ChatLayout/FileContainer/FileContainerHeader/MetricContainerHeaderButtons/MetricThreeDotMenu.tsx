import React, { useMemo, useState } from 'react';
import { ShareAssetType, VerificationStatus } from '@/api/asset_interfaces/share';
import {
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard
} from '@/api/buster_rest/dashboards';
import {
  useBulkUpdateMetricVerificationStatus,
  useDeleteMetric,
  useGetMetric,
  useGetMetricData,
  useRemoveMetricFromCollection,
  useSaveMetricToCollections
} from '@/api/buster_rest/metrics';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useSaveToDashboardDropdownContent } from '@/components/features/dropdowns/SaveToDashboardDropdown';
import { useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { StatusBadgeIndicator } from '@/components/features/metrics/StatusBadgeIndicator';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent';
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
  History,
  Pencil,
  ShareRight,
  SquareChart,
  SquareChartPen,
  SquareCode,
  Star,
  Table,
  Trash
} from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useUserConfigContextSelector } from '@/context/Users';
import { METRIC_CHART_CONTAINER_ID } from '@/controllers/MetricController/MetricViewChart/config';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/controllers/MetricController/MetricViewChart/MetricViewChartHeader';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import {
  type MetricFileViewSecondary,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { timeout } from '@/lib';
import { downloadElementToImage, exportJSONToCSV } from '@/lib/exportUtils';
import { canEdit, getIsEffectiveOwner, getIsOwner } from '@/lib/share';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const ThreeDotMenuButton = React.memo(
  ({
    metricId,
    isViewingOldVersion,
    versionNumber
  }: {
    metricId: string;
    isViewingOldVersion: boolean;
    versionNumber: number | undefined;
  }) => {
    const chatId = useChatIndividualContextSelector((x) => x.chatId);
    const { openSuccessMessage } = useBusterNotifications();
    const { data: permission } = useGetMetric({ id: metricId }, { select: (x) => x.permission });
    const openFullScreenMetric = useOpenFullScreenMetric({ metricId, versionNumber });
    const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
    const dashboardSelectMenu = useDashboardSelectMenu({ metricId });
    const versionHistoryItems = useVersionHistorySelectMenu({ metricId });
    const collectionSelectMenu = useCollectionSelectMenu({ metricId });
    const statusSelectMenu = useStatusSelectMenu({ metricId });
    const favoriteMetric = useFavoriteMetricSelectMenu({ metricId });
    const editChartMenu = useEditChartSelectMenu();
    const resultsViewMenu = useResultsViewSelectMenu({ chatId, metricId });
    const sqlEditorMenu = useSQLEditorSelectMenu({ chatId, metricId });
    const downloadCSVMenu = useDownloadCSVSelectMenu({ metricId });
    const downloadPNGMenu = useDownloadPNGSelectMenu({ metricId });
    const deleteMetricMenu = useDeleteMetricSelectMenu({ metricId });
    const renameMetricMenu = useRenameMetricSelectMenu({ metricId });
    const shareMenu = useShareMenuSelectMenu({ metricId });

    const isEditor = canEdit(permission);
    const isOwnerEffective = getIsEffectiveOwner(permission);
    const isOwner = getIsOwner(permission);

    const items: DropdownItems = useMemo(
      () =>
        [
          chatId && openFullScreenMetric,
          isOwnerEffective && !isViewingOldVersion && shareMenu,
          isEditor && !isViewingOldVersion && statusSelectMenu,
          { type: 'divider' },
          !isViewingOldVersion && dashboardSelectMenu,
          !isViewingOldVersion && collectionSelectMenu,
          !isViewingOldVersion && favoriteMetric,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && editChartMenu,
          !isViewingOldVersion && resultsViewMenu,
          !isViewingOldVersion && sqlEditorMenu,
          isEditor && versionHistoryItems,
          { type: 'divider' },
          downloadCSVMenu,
          downloadPNGMenu,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && renameMetricMenu,
          isOwner && !isViewingOldVersion && deleteMetricMenu
        ].filter(Boolean) as DropdownItems,
      [
        chatId,
        openFullScreenMetric,
        isEditor,
        isOwner,
        isOwnerEffective,
        renameMetricMenu,
        dashboardSelectMenu,
        deleteMetricMenu,
        downloadCSVMenu,
        downloadPNGMenu,
        openSuccessMessage,
        onSetSelectedFile,
        versionHistoryItems,
        favoriteMetric,
        statusSelectMenu,
        collectionSelectMenu,
        editChartMenu,
        resultsViewMenu,
        sqlEditorMenu,
        shareMenu
      ]
    );

    return (
      <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
        <Button prefix={<Dots />} variant="ghost" data-testid="three-dot-menu-button" />
      </Dropdown>
    );
  }
);
ThreeDotMenuButton.displayName = 'ThreeDotMenuButton';

const useDashboardSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { data: dashboards } = useGetMetric({ id: metricId }, { select: (x) => x.dashboards });

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        saveMetricsToDashboard({ metricIds: [metricId], dashboardId })
      )
    );
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        removeMetricsFromDashboard({ metricIds: [metricId], dashboardId })
      )
    );
  });

  const { items, footerContent, selectType, menuHeader } = useSaveToDashboardDropdownContent({
    onSaveToDashboard,
    onRemoveFromDashboard,
    selectedDashboards: dashboards?.map((x) => x.id) || []
  });

  const dashboardSubMenu = useMemo(() => {
    return (
      <DropdownContent
        menuHeader={menuHeader}
        selectType={selectType}
        items={items}
        footerContent={footerContent}
      />
    );
  }, [items, footerContent, menuHeader, selectType]);

  const dashboardDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Add to dashboard',
      value: 'add-to-dashboard',
      icon: <ASSET_ICONS.dashboardAdd />,
      items: [<React.Fragment key="dashboard-sub-menu">{dashboardSubMenu}</React.Fragment>]
    }),
    [dashboardSubMenu]
  );

  return dashboardDropdownItem;
};

const useVersionHistorySelectMenu = ({ metricId }: { metricId: string }) => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);

  const { data } = useGetMetric(
    { id: metricId },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: DropdownItems = useListVersionDropdownItems({
    versions,
    selectedVersion: version_number,
    chatId,
    fileId: metricId,
    fileType: 'metric',
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

const useCollectionSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: collections } = useGetMetric({ id: metricId }, { select: (x) => x.collections });
  const { openInfoMessage } = useBusterNotifications();

  const selectedCollections = useMemo(() => {
    return collections?.map((x) => x.id) || [];
  }, [collections]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveMetricToCollection({
      metricIds: [metricId],
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeMetricFromCollection({
      metricIds: [metricId],
      collectionIds: [collectionId]
    });
    openInfoMessage('Metrics removed from collections');
  });

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections
  });

  const CollectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const collectionDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [
        <React.Fragment key="collection-sub-menu">
          {CollectionSubMenu} {ModalComponent}
        </React.Fragment>
      ]
    }),
    [CollectionSubMenu]
  );

  return collectionDropdownItem;
};

const useStatusSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: metricStatus } = useGetMetric({ id: metricId }, { select: (x) => x.status });
  const { mutate: updateStatus } = useBulkUpdateMetricVerificationStatus();
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);

  const onChangeStatus = useMemoizedFn(async (status: VerificationStatus) => {
    return updateStatus([{ id: metricId, status }]);
  });

  const dropdownProps = useStatusDropdownContent({
    isAdmin,
    selectedStatus: metricStatus || VerificationStatus.NOT_REQUESTED,
    onChangeStatus
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const statusDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Status',
      value: 'status',
      icon: <StatusBadgeIndicator status={metricStatus || VerificationStatus.NOT_REQUESTED} />,
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>]
    }),
    [statusSubMenu]
  );

  return statusDropdownItem;
};

const useFavoriteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: name } = useGetMetric({ id: metricId }, { select: (x) => x.name });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: metricId,
    type: ShareAssetType.METRIC,
    name: name || ''
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

const useEditChartSelectMenu = () => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const onClickButton = useMemoizedFn(() => {
    const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
    onSetFileView({ secondaryView: editableSecondaryView, fileView: 'chart' });
  });
  return useMemo(
    () => ({
      label: 'Edit chart',
      value: 'edit-chart',
      onClick: onClickButton,
      icon: <SquareChartPen />
    }),
    []
  );
};

const useResultsViewSelectMenu = ({
  chatId,
  metricId
}: {
  chatId: string | undefined;
  metricId: string;
}) => {
  const link = useMemo(() => {
    if (!chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_RESULTS,
        metricId: metricId
      });
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
      chatId: chatId,
      metricId: metricId
    });
  }, [chatId, metricId]);

  return useMemo(
    () => ({
      label: 'Results view',
      value: 'results-view',
      link,
      icon: <Table />
    }),
    []
  );
};

const useSQLEditorSelectMenu = ({
  chatId,
  metricId
}: {
  chatId: string | undefined;
  metricId: string;
}) => {
  const link = useMemo(() => {
    if (!chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_SQL,
        metricId: metricId
      });
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_METRIC_ID_SQL,
      chatId: chatId,
      metricId: metricId
    });
  }, [chatId, metricId]);

  return useMemo(
    () => ({
      label: 'SQL Editor',
      value: 'sql-editor',
      icon: <SquareCode />,
      link
    }),
    []
  );
};

const useDownloadCSVSelectMenu = ({ metricId }: { metricId: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: metricData } = useGetMetricData({ id: metricId }, { enabled: false });
  const { data: name } = useGetMetric({ id: metricId }, { select: (x) => x.name });

  return useMemo(
    () => ({
      label: 'Download as CSV',
      value: 'download-csv',
      icon: <Download4 />,
      loading: isDownloading,
      onClick: async () => {
        const data = metricData?.data;
        if (data && name) {
          setIsDownloading(true);
          await exportJSONToCSV(data, name);
          setIsDownloading(false);
        }
      }
    }),
    [metricData, isDownloading, name]
  );
};

const useDownloadPNGSelectMenu = ({ metricId }: { metricId: string }) => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: name } = useGetMetric({ id: metricId }, { select: (x) => x.name });
  const { data: selectedChartType } = useGetMetric(
    { id: metricId },
    { select: (x) => x.chart_config?.selectedChartType }
  );

  const canDownload = selectedChartType && selectedChartType !== 'table';

  return useMemo(
    () => ({
      label: 'Download as PNG',
      value: 'download-png',
      disabled: !canDownload,
      icon: <SquareChart />,
      onClick: async () => {
        const node = document.getElementById(METRIC_CHART_CONTAINER_ID(metricId)) as HTMLElement;
        if (node) {
          try {
            return await downloadElementToImage(node, `${name}.png`);
          } catch (error) {
            console.error(error);
          }
        }

        openErrorMessage('Failed to download PNG');
      }
    }),
    [canDownload]
  );
};

const useDeleteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: deleteMetric } = useDeleteMetric();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  return useMemo(
    () => ({
      label: 'Delete metric',
      value: 'delete-metric',
      icon: <Trash />,
      onClick: async () => {
        await deleteMetric({ ids: [metricId] });
        onChangePage({ route: BusterRoutes.APP_METRIC });
      }
    }),
    [metricId]
  );
};

const useRenameMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Pencil />,
      onClick: async () => {
        onSetFileView({ fileView: 'chart' });
        await timeout(125);
        const input = document.getElementById(METRIC_CHART_TITLE_INPUT_ID) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }),
    [metricId]
  );
};

export const useShareMenuSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId },
    { select: getShareAssetConfig }
  );
  const isOwner = getIsOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share metric',
      value: 'share-metric',
      icon: <ShareRight />,
      disabled: !isOwner,
      items:
        isOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={metricId}
                shareAssetConfig={shareAssetConfig}
                assetId={metricId}
                assetType={ShareAssetType.METRIC}
              />
            ]
          : undefined
    }),
    [metricId, shareAssetConfig, isOwner]
  );
};

const useOpenFullScreenMetric = ({
  metricId,
  versionNumber
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  return useMemo(
    () => ({
      label: 'Open in metric page',
      value: 'open-in-full-screen',
      icon: <ArrowUpRight />,
      link: versionNumber
        ? createBusterRoute({
            route: BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
            metricId,
            versionNumber
          })
        : createBusterRoute({
            route: BusterRoutes.APP_METRIC_ID_CHART,
            metricId
          })
    }),
    [metricId, versionNumber]
  );
};
