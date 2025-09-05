import type { VerificationStatus } from '@buster/server-shared/share';
import { useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import {
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard,
} from '@/api/buster_rest/dashboards';
import {
  useBulkUpdateMetricVerificationStatus,
  useDeleteMetric,
  useGetMetric,
  useRemoveMetricFromCollection,
  useSaveMetricToCollections,
} from '@/api/buster_rest/metrics';
import { useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useSaveToDashboardDropdownContent } from '@/components/features/dropdowns/SaveToDashboardDropdown';
import { StatusBadgeIndicator } from '@/components/features/metrics/StatusBadgeIndicator';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent';
import {
  useDownloadMetricDataCSV,
  useDownloadPNGSelectMenu,
} from '@/components/features/metrics/threeDotMenuHooks';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  Dropdown,
  DropdownContent,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import {
  ArrowUpRight,
  Dots,
  ShareRight,
  SquareChartPen,
  SquareCode,
  Table,
  Trash,
} from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useIsChatMode } from '@/context/Chats/useMode';
import { useMetricEditToggle } from '@/layouts/AssetContainer/MetricAssetContainer';
import { canEdit, getIsEffectiveOwner, getIsOwner } from '@/lib/share';
import { ASSET_ICONS } from '../icons/assetIcons';
import {
  useFavoriteMetricSelectMenu,
  useMetricDrilldownItem,
  useMetricVersionHistorySelectMenu,
  useRenameMetricOnPage,
} from './threeDotMenuHooks';

interface MetricThreeDotMenuDropdownProps {
  metricId: string;
  isViewingOldVersion: boolean;
  versionNumber: number | undefined;
  children: React.ReactNode;
}

export const MetricThreeDotMenuDropdown = React.memo(
  ({ metricId, isViewingOldVersion, versionNumber, children }: MetricThreeDotMenuDropdownProps) => {
    const isChatMode = useIsChatMode();
    const { data: permission } = useGetMetric({ id: metricId }, { select: (x) => x.permission });
    const openFullScreenMetric = useOpenFullScreenMetric({ metricId, versionNumber });
    const dashboardSelectMenu = useDashboardSelectMenu({ metricId });
    const versionHistoryItems = useMetricVersionHistorySelectMenu({ metricId });
    const collectionSelectMenu = useCollectionSelectMenu({ metricId });
    const statusSelectMenu = useStatusSelectMenu({ metricId });
    const favoriteMetric = useFavoriteMetricSelectMenu({ metricId });
    const editChartMenu = useEditChartSelectMenu();
    const resultsViewMenu = useResultsViewSelectMenu({ metricId });
    const sqlEditorMenu = useSQLEditorSelectMenu({ metricId });
    const downloadCSVMenu = useDownloadMetricDataCSV({
      metricId,
      metricVersionNumber: versionNumber,
    });
    const downloadPNGMenu = useDownloadPNGSelectMenu({
      metricId,
      metricVersionNumber: versionNumber,
    });
    const deleteMetricMenu = useDeleteMetricSelectMenu({ metricId });
    const renameMetricMenu = useRenameMetricOnPage({
      metricId,
      metricVersionNumber: versionNumber,
    });
    const shareMenu = useShareMenuSelectMenu({ metricId });
    const drilldownItem = useMetricDrilldownItem({ metricId });

    const isEditor = canEdit(permission);
    const isOwnerEffective = getIsEffectiveOwner(permission);
    const isOwner = getIsOwner(permission);

    const items: IDropdownItems = useMemo(
      () =>
        [
          isChatMode && openFullScreenMetric,
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
          isOwner && !isViewingOldVersion && deleteMetricMenu,
        ].filter(Boolean) as IDropdownItems,
      [
        isChatMode,
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
        shareMenu,
      ]
    );

    return (
      <Dropdown items={items} side="left" align="start" contentClassName="max-h-fit" modal>
        {children}
      </Dropdown>
    );
  }
);
MetricThreeDotMenuDropdown.displayName = 'MetricThreeDotMenuDropdown';

export const MetricThreeDotMenuButton = React.memo(
  (props: Omit<MetricThreeDotMenuDropdownProps, 'children'>) => {
    return (
      <MetricThreeDotMenuDropdown {...props}>
        <Button prefix={<Dots />} variant="ghost" data-testid="three-dot-menu-button" />
      </MetricThreeDotMenuDropdown>
    );
  }
);

const useDashboardSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { data: dashboards } = useGetMetric({ id: metricId }, { select: (x) => x.dashboards });
  const { openInfoMessage } = useBusterNotifications();

  const onSaveToDashboard = async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        saveMetricsToDashboard({ metricIds: [metricId], dashboardId })
      )
    );
    openInfoMessage('Metric added to dashboard');
  };

  const onRemoveFromDashboard = async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        removeMetricsFromDashboard({ metricIds: [metricId], dashboardId, useConfirmModal: false })
      )
    );
    openInfoMessage('Metric removed from dashboard');
  };

  const { items, footerContent, selectType, menuHeader } = useSaveToDashboardDropdownContent({
    onSaveToDashboard,
    onRemoveFromDashboard,
    selectedDashboards: dashboards?.map((x) => x.id) || [],
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

  const dashboardDropdownItem: IDropdownItem = useMemo(
    () => ({
      label: 'Add to dashboard',
      value: 'add-to-dashboard',
      closeOnSelect: false,
      icon: <ASSET_ICONS.dashboardAdd />,
      items: [<React.Fragment key="dashboard-sub-menu">{dashboardSubMenu}</React.Fragment>],
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

  const onSaveToCollection = async (collectionIds: string[]) => {
    await saveMetricToCollection({
      metricIds: [metricId],
      collectionIds,
    });
    openInfoMessage('Metrics saved to collections');
  };

  const onRemoveFromCollection = async (collectionId: string) => {
    await removeMetricFromCollection({
      metricIds: [metricId],
      collectionIds: [collectionId],
    });
    openInfoMessage('Metrics removed from collections');
  };

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections: selectedCollections || [],
  });

  const CollectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const collectionDropdownItem: IDropdownItem = useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [
        <React.Fragment key="collection-sub-menu">
          {CollectionSubMenu} {ModalComponent}
        </React.Fragment>,
      ],
    }),
    [CollectionSubMenu, ModalComponent]
  );

  return collectionDropdownItem;
};

const useStatusSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: metricStatus } = useGetMetric({ id: metricId }, { select: (x) => x.status });
  const { mutate: updateStatus } = useBulkUpdateMetricVerificationStatus();
  const isAdmin = useIsUserAdmin();

  const onChangeStatus = async (status: VerificationStatus) => {
    return updateStatus([{ id: metricId, status }]);
  };

  const dropdownProps = useStatusDropdownContent({
    isAdmin,
    selectedStatus: metricStatus || 'notRequested',
    onChangeStatus,
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const statusDropdownItem: IDropdownItem = useMemo(
    () => ({
      label: 'Status',
      value: 'status',
      icon: <StatusBadgeIndicator status={metricStatus || 'notRequested'} />,
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>],
    }),
    [statusSubMenu, metricStatus]
  );

  return statusDropdownItem;
};

const useEditChartSelectMenu = () => {
  const toggleEditMode = useMetricEditToggle();

  return useMemo(
    () => ({
      label: 'Edit chart',
      value: 'edit-chart',
      onClick: () => toggleEditMode(),
      icon: <SquareChartPen />,
    }),
    []
  );
};

const useResultsViewSelectMenu = ({ metricId }: { metricId: string }) => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'View results',
        value: 'results-view',
        link: {
          unsafeRelative: 'path',
          to: '../results' as '/app/metrics/$metricId/results',
          params: (prev) => ({ ...prev, metricId }),
        },
        icon: <Table />,
      }),
    [metricId]
  );
};

const useSQLEditorSelectMenu = ({ metricId }: { metricId: string }) => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'View SQL',
        value: 'sql-editor',
        icon: <SquareCode />,
        link: {
          unsafeRelative: 'path',
          to: '../sql' as '/app/metrics/$metricId/sql',
          params: (prev) => ({ ...prev, metricId }),
        },
      }),
    [metricId]
  );
};

const useDeleteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const navigate = useNavigate();
  const { mutateAsync: deleteMetric } = useDeleteMetric();

  return useMemo(
    () => ({
      label: 'Delete metric',
      value: 'delete-metric',
      icon: <Trash />,
      onClick: async () => {
        await deleteMetric({ ids: [metricId] });
        navigate({ to: '/app/metrics' });
      },
    }),
    [metricId, deleteMetric]
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
              />,
            ]
          : undefined,
    }),
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};

const useOpenFullScreenMetric = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Open chart',
        value: 'open-in-full-screen',
        icon: <ArrowUpRight />,
        linkIcon: 'none',
        link: {
          to: '/app/metrics/$metricId',
          params: {
            metricId,
          },
          search: {
            metric_version_number: versionNumber,
          },
        },
      }),
    [metricId, versionNumber]
  );
};
