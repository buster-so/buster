import React, { useMemo, useState } from 'react';
import { VerificationStatus } from '@buster/server-shared/share';
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
import { StatusBadgeIndicator } from '@/components/features/metrics/StatusBadgeIndicator';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
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
  Pencil,
  ShareRight,
  SquareChart,
  SquareChartPen,
  SquareCode,
  Table,
  Trash
} from '@/components/ui/icons';
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
import { timeout } from '@/lib/timeout';
import { ensureElementExists } from '@/lib/element';
import { downloadElementToImage, exportJSONToCSV } from '@/lib/exportUtils';
import { canEdit, getIsEffectiveOwner, getIsOwner } from '@/lib/share';
import { BusterRoutes } from '@/routes';
import { assetParamsToRoute } from '@/lib/assets';
import {
  useFavoriteMetricSelectMenu,
  useVersionHistorySelectMenu,
  useMetricDrilldownItem
} from '@/components/features/metrics/ThreeDotMenu';

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
    const { data: permission } = useGetMetric({ id: metricId }, { select: (x) => x.permission });
    const openFullScreenMetric = useOpenFullScreenMetric({ metricId, versionNumber });
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
    const drilldownItem = useMetricDrilldownItem({ metricId });

    const isEditor = canEdit(permission);
    const isOwnerEffective = getIsEffectiveOwner(permission);
    const isOwner = getIsOwner(permission);

    const items: DropdownItems = useMemo(
      () =>
        [
          chatId && openFullScreenMetric,
          // drilldownItem,
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
        drilldownItem,
        isEditor,
        isOwner,
        isOwnerEffective,
        renameMetricMenu,
        dashboardSelectMenu,
        deleteMetricMenu,
        downloadCSVMenu,
        downloadPNGMenu,
        isViewingOldVersion,
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
  const { openInfoMessage } = useBusterNotifications();

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        saveMetricsToDashboard({ metricIds: [metricId], dashboardId })
      )
    );
    openInfoMessage('Metric added to dashboard');
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        removeMetricsFromDashboard({ metricIds: [metricId], dashboardId, useConfirmModal: false })
      )
    );
    openInfoMessage('Metric removed from dashboard');
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
      closeOnSelect: false,
      icon: <ASSET_ICONS.dashboardAdd />,
      items: [<React.Fragment key="dashboard-sub-menu">{dashboardSubMenu}</React.Fragment>]
    }),
    [dashboardSubMenu]
  );

  return dashboardDropdownItem;
};

const useCollectionSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: selectedCollections } = useGetMetric(
    { id: metricId },
    { select: (x) => x.collections?.map((x) => x.id) }
  );
  const { openInfoMessage } = useBusterNotifications();

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
    selectedCollections: selectedCollections || []
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
    [CollectionSubMenu, ModalComponent]
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
    selectedStatus: metricStatus || 'notRequested',
    onChangeStatus
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const statusDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Status',
      value: 'status',
      icon: <StatusBadgeIndicator status={metricStatus || 'notRequested'} />,
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>]
    }),
    [statusSubMenu, metricStatus]
  );

  return statusDropdownItem;
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
    [onClickButton]
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
    return assetParamsToRoute({
      type: 'metric',
      chatId,
      assetId: metricId,
      page: 'results'
    });
  }, [chatId, metricId]);

  return useMemo(
    () => ({
      label: 'Results view',
      value: 'results-view',
      link,
      icon: <Table />
    }),
    [link]
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
    return assetParamsToRoute({
      type: 'metric',
      chatId,
      assetId: metricId,
      page: 'sql'
    });
  }, [chatId, metricId]);

  return useMemo(
    () => ({
      label: 'SQL Editor',
      value: 'sql-editor',
      icon: <SquareCode />,
      link
    }),
    [link]
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
    [canDownload, metricId, name, openErrorMessage]
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
    [metricId, onChangePage, deleteMetric]
  );
};

const useRenameMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Pencil />,
      onClick: async () => {
        const route = assetParamsToRoute({
          type: 'metric',
          assetId: metricId,
          chatId,
          dashboardId,
          page: 'chart'
        });
        await onChangePage(route);
        await timeout(100);
        const input = await ensureElementExists(
          () => document.getElementById(METRIC_CHART_TITLE_INPUT_ID) as HTMLInputElement
        );
        if (input) {
          input.focus();
          input.select();
        }
      }
    }),
    [onSetFileView]
  );
};

export const useShareMenuSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share metric',
      value: 'share-metric',
      icon: <ShareRight />,
      disabled: !isEffectiveOwner,
      items:
        isEffectiveOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={metricId}
                shareAssetConfig={shareAssetConfig}
                assetId={metricId}
                assetType={'metric'}
              />
            ]
          : undefined
    }),
    [metricId, shareAssetConfig, isEffectiveOwner]
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
      link: assetParamsToRoute({
        type: 'metric',
        assetId: metricId,
        page: 'chart',
        versionNumber
      })
    }),
    [metricId, versionNumber]
  );
};
