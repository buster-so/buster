import { ShareAssetType, VerificationStatus } from '@/api/asset_interfaces';
import {
  useAddAndRemoveMetricsFromDashboard,
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard
} from '@/api/buster_rest/dashboards';
import {
  useBulkUpdateMetricVerificationStatus,
  useDeleteMetric,
  useRemoveMetricFromCollection,
  useSaveMetricToCollections
} from '@/api/buster_rest/metrics';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { SaveToDashboardDropdown } from '@/components/features/dropdowns/SaveToDashboardDropdown';
import { useThreeDotFavoritesOptions } from '@/components/features/dropdowns/useThreeDotFavoritesOptions';
import { StatusBadgeButton } from '@/components/features/metrics/StatusBadgeIndicator';
import { Button } from '@/components/ui/buttons';
import { Dropdown } from '@/components/ui/dropdown';
import { Dots, Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useUserConfigContextSelector } from '@/context/Users';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import uniq from 'lodash/uniq';
import React, { useMemo, useState } from 'react';

export const MetricSelectedOptionPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  hasSelected: boolean;
}> = React.memo(({ selectedRowKeys, onSelectChange, hasSelected }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionsButton
          key="collections"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <DashboardButton
          key="dashboard"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <StatusButton
          key="status"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <DeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />,
        <ThreeDotButton
          key="three-dot"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={hasSelected}
    />
  );
});

MetricSelectedOptionPopup.displayName = 'MetricSelectedOptionPopup';

const CollectionsButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { openInfoMessage } = useBusterNotifications();
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    await saveMetricToCollection({
      metricIds: selectedRowKeys,
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    await removeMetricFromCollection({
      metricIds: selectedRowKeys,
      collectionIds: [collectionId]
    });
    openInfoMessage('Metrics removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <Button prefix={<ASSET_ICONS.collectionAdd />}>Collections</Button>
    </SaveToCollectionsDropdown>
  );
};

const DashboardButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { mutateAsync: addMetricsToDashboard } = useAddMetricsToDashboard();
  const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
  const { openWarningNotification, openConfirmModal } = useBusterNotifications();

  const warningNotification = useMemoizedFn((): boolean => {
    if (selectedRowKeys.length > 15) {
      openWarningNotification({
        title: 'You can edit up to 15 metrics at a time from this menu',
        message: 'Please remove some metrics'
      });
      return true;
    }
    return false;
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    if (warningNotification()) return;

    const newDashboards = selectedDashboards.filter((id) => dashboardIds.includes(id));

    openConfirmModal({
      title: 'Remove from dashboard',
      content: 'Are you sure you want to remove these metrics from the dashboard?',
      onOk: async () => {
        await Promise.all(
          newDashboards.map((dashboardId) =>
            removeMetricsFromDashboard({
              dashboardId,
              metricIds: selectedRowKeys,
              useConfirmModal: false
            })
          )
        );
        setSelectedDashboards((prev) => prev.filter((id) => !dashboardIds.includes(id)));
      }
    });
  });

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    if (warningNotification()) return;

    const newDashboards = uniq([...selectedDashboards, ...dashboardIds]);

    setSelectedDashboards(newDashboards);

    await Promise.all(
      newDashboards.map((dashboardId) =>
        addMetricsToDashboard({
          dashboardId,
          metricIds: selectedRowKeys
        })
      )
    );
  });

  const { run: debouncedClearSavedDashboards } = useDebounceFn(
    (v: boolean) => {
      if (v === false) {
        setSelectedDashboards([]);
      }
    },
    { wait: 18000 }
  );

  return (
    <SaveToDashboardDropdown
      side="top"
      align="center"
      onOpenChange={debouncedClearSavedDashboards}
      selectedDashboards={selectedDashboards}
      onRemoveFromDashboard={onRemoveFromDashboard}
      onSaveToDashboard={onSaveToDashboard}>
      <Button prefix={<ASSET_ICONS.dashboardAdd />} type="button">
        Dashboard
      </Button>
    </SaveToDashboardDropdown>
  );
};

const StatusButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: updateStatus } = useBulkUpdateMetricVerificationStatus();
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const onVerify = useMemoizedFn(async (data: { id: string; status: VerificationStatus }[]) => {
    await updateStatus(data);
    onSelectChange([]);
  });

  return (
    <StatusBadgeButton
      status={VerificationStatus.NOT_REQUESTED}
      id={selectedRowKeys}
      onVerify={onVerify}
      isAdmin={isAdmin}
    />
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteMetric } = useDeleteMetric();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = async () => {
    openConfirmModal({
      title: 'Delete metric',
      content: 'Are you sure you want to delete these metrics?',
      onOk: async () => {
        await deleteMetric({ ids: selectedRowKeys });
        onSelectChange([]);
      }
    });
  };

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  const dropdownOptions = useThreeDotFavoritesOptions({
    itemIds: selectedRowKeys,
    assetType: ShareAssetType.METRIC,
    onFinish: () => onSelectChange([])
  });

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
});

ThreeDotButton.displayName = 'ThreeDotButton';
