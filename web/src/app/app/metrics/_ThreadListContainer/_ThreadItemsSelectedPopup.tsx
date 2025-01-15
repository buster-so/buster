import React, { useState } from 'react';
import { AppMaterialIcons } from '@/components';
import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { Button, Dropdown, DropdownProps } from 'antd';
import { StatusBadgeButton } from '../../_components/Lists';
import { BusterVerificationStatus } from '@/api/buster-rest';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useUserConfigContextSelector } from '@/context/Users';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useMemoizedFn, useMount } from 'ahooks';
import { SaveToCollectionsDropdown } from '../../_components/Buttons';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const ThreadSelectedOptionPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  hasSelected: boolean;
}> = ({ selectedRowKeys, onSelectChange, hasSelected }) => {
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
};

const CollectionsButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { openInfoMessage } = useBusterNotifications();
  const saveThreadToCollection = useBusterThreadsContextSelector(
    (state) => state.saveThreadToCollection
  );
  const removeThreadFromCollection = useBusterThreadsContextSelector(
    (state) => state.removeThreadFromCollection
  );

  const collectionsList = useCollectionsContextSelector((state) => state.collectionsList);
  const getInitialCollections = useCollectionsContextSelector(
    (state) => state.getInitialCollections
  );

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    const allSaves: Promise<void>[] = selectedRowKeys.map((threadId) => {
      return saveThreadToCollection({
        threadId,
        collectionIds
      });
    });
    await Promise.all(allSaves);
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    const allSelectedButLast = selectedRowKeys.slice(0, -1);
    const lastThreadId = selectedRowKeys[selectedRowKeys.length - 1];
    const allRemoves: Promise<void>[] = allSelectedButLast.map((threadId) => {
      return removeThreadFromCollection({ threadId, collectionId, ignoreFavoriteUpdates: true });
    });
    await removeThreadFromCollection({
      threadId: lastThreadId,
      collectionId,
      ignoreFavoriteUpdates: false
    });
    await Promise.all(allRemoves);
    openInfoMessage('Metrics removed from collections');
  });

  useMount(() => {
    if (!collectionsList.length) getInitialCollections();
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <Button icon={<AppMaterialIcons icon="note_stack" />} type="default">
        Collections
      </Button>
    </SaveToCollectionsDropdown>
  );
};

const DashboardButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  return (
    <Dropdown menu={{ items: [{ label: 'Dashboard', key: 'dashboard' }] }}>
      <Button icon={<AppMaterialIcons icon="grid_view" fill />} type="default">
        Dashboard
      </Button>
    </Dropdown>
  );
};

const StatusButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  return (
    <StatusBadgeButton
      status={BusterVerificationStatus.notRequested}
      type="thread"
      id={selectedRowKeys}
      onChangedStatus={async () => {
        onSelectChange([]);
      }}
    />
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const deleteThread = useBusterThreadsContextSelector((state) => state.deleteThread);
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteClick = async () => {
    openConfirmModal({
      title: 'Delete thread',
      content: 'Are you sure you want to delete these threads?',
      onOk: async () => {
        await deleteThread({ threadIds: selectedRowKeys });
        onSelectChange([]);
      }
    });
  };

  return (
    <Button icon={<AppMaterialIcons icon="delete" />} type="default" onClick={onDeleteClick}>
      Delete
    </Button>
  );
};

const ThreeDotButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const bulkEditFavorites = useUserConfigContextSelector((state) => state.bulkEditFavorites);
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);

  const dropdownOptions: Required<DropdownProps>['menu']['items'] = [
    {
      label: 'Add to favorites',
      icon: <AppMaterialIcons icon="star" />,
      key: 'add-to-favorites',
      onClick: async () => {
        const allFavorites: string[] = [...userFavorites.map((f) => f.id), ...selectedRowKeys];
        //   bulkEditFavorites(allFavorites);
        alert('TODO - feature not implemented yet');
      }
    },
    {
      label: 'Remove from favorites',
      icon: <AppMaterialIcons icon="close" />,
      key: 'remove-from-favorites',
      onClick: async () => {
        const allFavorites: string[] = userFavorites
          .map((f) => f.id)
          .filter((id) => !selectedRowKeys.includes(id));
        bulkEditFavorites(allFavorites);
      }
    }
  ];

  return (
    <Dropdown menu={{ items: dropdownOptions }} trigger={['click']}>
      <Button icon={<AppMaterialIcons icon="more_horiz" />} type="default" />
    </Dropdown>
  );
};
