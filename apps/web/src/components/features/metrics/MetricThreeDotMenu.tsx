import type { VerificationStatus } from '@buster/server-shared/share';
import { useNavigate } from '@tanstack/react-router';
import React, { useCallback, useMemo } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
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
  useEditMetricWithAI,
  useOpenChartItem,
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
import { Dots, ShareRight, SquareChartPen, SquareCode, Table, Trash } from '@/components/ui/icons';
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
    const { data: permission } = useGetMetric(
      { id: metricId, versionNumber },
      { select: useCallback((x: BusterMetric) => x.permission, []) }
    );
    const openFullScreenMetric = useOpenChartItem({ metricId, metricVersionNumber: versionNumber });
    const dashboardSelectMenu = useDashboardSelectMenu({ metricId, versionNumber });
    const versionHistoryItems = useMetricVersionHistorySelectMenu({ metricId });
    const collectionSelectMenu = useCollectionSelectMenu({ metricId, versionNumber });
    const statusSelectMenu = useStatusSelectMenu({ metricId, versionNumber });
    const favoriteMetric = useFavoriteMetricSelectMenu({ metricId, versionNumber });
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
    const editWithAI = useEditMetricWithAI({ metricId, versionNumber });
    const shareMenu = useShareMenuSelectMenu({ metricId, versionNumber });
    const drilldownItem = useMetricDrilldownItem({ metricId });

    const isEditor = canEdit(permission);
    const isOwnerEffective = getIsEffectiveOwner(permission);
    const isOwner = getIsOwner(permission);

    const items: IDropdownItems = useMemo(
      () =>
        [
          ...(isChatMode ? [openFullScreenMetric, { type: 'divider' }] : []),
          editWithAI,
          { type: 'divider' },
          isOwnerEffective && !isViewingOldVersion && shareMenu,
          !isViewingOldVersion && collectionSelectMenu,
          !isViewingOldVersion && favoriteMetric,
          { type: 'divider' },
          isEditor && !isViewingOldVersion && editChartMenu,
          !isViewingOldVersion && resultsViewMenu,
          !isViewingOldVersion && sqlEditorMenu,
          { type: 'divider' },
          !isViewingOldVersion && dashboardSelectMenu,
          isEditor && versionHistoryItems,
          isEditor && !isViewingOldVersion && statusSelectMenu,
          { type: 'divider' },
          downloadCSVMenu,
          downloadPNGMenu,
          ...(isOwner && !isViewingOldVersion
            ? [{ type: 'divider' }, renameMetricMenu, deleteMetricMenu]
            : []),
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

const useDashboardSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { data: dashboards } = useGetMetric(
    { id: metricId, versionNumber },
    { select: useCallback((x: BusterMetric) => x.dashboards, []) }
  );
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

const useCollectionSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: selectedCollections } = useGetMetric(
    { id: metricId, versionNumber },
    { select: useCallback((x: BusterMetric) => x.collections?.map((x) => x.id), []) }
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

const useStatusSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { data: metricStatus } = useGetMetric(
    { id: metricId, versionNumber },
    { select: useCallback((x: BusterMetric) => x.status, []) }
  );
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

export const useShareMenuSelectMenu = ({
  metricId,
  versionNumber,
}: {
  metricId: string;
  versionNumber: number | undefined;
}) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId, versionNumber },
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
                assetType={'metric_file'}
              />,
            ]
          : undefined,
    }),
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};
