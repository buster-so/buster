import { ShareAssetType } from '@/api/asset_interfaces/share';
import {
  useAddDashboardToCollection,
  useDeleteDashboards,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { SaveToCollectionsDropdown } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useThreeDotFavoritesOptions } from '@/components/features/dropdowns/useThreeDotFavoritesOptions';
import { Button } from '@/components/ui/buttons';
import { Dropdown } from '@/components/ui/dropdown';
import { Dots, Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';

export const DashboardSelectedOptionPopup: React.FC<{
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

DashboardSelectedOptionPopup.displayName = 'DashboardSelectedOptionPopup';

const CollectionsButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { openInfoMessage } = useBusterNotifications();
  const { mutateAsync: onAddDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: onRemoveDashboardFromCollection } = useRemoveDashboardFromCollection();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await onAddDashboardToCollection({
      dashboardIds: selectedRowKeys,
      collectionIds
    });
    setSelectedCollections([]);
    onSelectChange([]);
    openInfoMessage('Dashboards saved to collections');
  });

  const onRemoveFromCollectionPreflight = useMemoizedFn(async (collectionId: string) => {
    await onRemoveDashboardFromCollection({
      dashboardIds: selectedRowKeys,
      collectionIds: [collectionId]
    });
    setSelectedCollections([]);
    onSelectChange([]);
    openInfoMessage('Dashboards removed from collections');
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollectionPreflight}
      selectedCollections={selectedCollections}>
      <Button prefix={<ASSET_ICONS.collections />} type="button">
        Collections
      </Button>
    </SaveToCollectionsDropdown>
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteDashboard } = useDeleteDashboards();
  const onDeleteClick = useMemoizedFn(async () => {
    await deleteDashboard({ dashboardId: selectedRowKeys });
    onSelectChange([]);
  });

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const dropdownOptions = useThreeDotFavoritesOptions({
    itemIds: selectedRowKeys,
    assetType: ShareAssetType.DASHBOARD,
    onFinish: () => onSelectChange([])
  });

  return (
    <Dropdown items={dropdownOptions}>
      <Button prefix={<Dots />} />
    </Dropdown>
  );
};
