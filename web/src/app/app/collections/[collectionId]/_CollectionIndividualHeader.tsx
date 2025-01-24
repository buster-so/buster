'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '../../_components/AppContentHeader';
import {
  canEditCollection,
  useCollectionsContextSelector,
  useIndividualCollection
} from '@/context/Collections';
import { Breadcrumb, Button, Dropdown, MenuProps } from 'antd';
import Link from 'next/link';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { AppMaterialIcons, EditableTitle } from '@/components';
import { FavoriteStar } from '../../_components/Lists/FavoriteStar';
import { ShareMenu } from '../../_components/ShareMenu';
import { BusterCollection } from '@/api/buster_rest/collection';
import { BusterShareAssetType } from '@/api/buster_rest';
import { Text } from '@/components';
import { useAntToken } from '@/styles/useAntToken';
import { useMemoizedFn } from 'ahooks';
import { BreadcrumbSeperator } from '@/components/breadcrumb';
import { measureTextWidth } from '@/utils/canvas';

export const CollectionsIndividualHeader: React.FC<{}> = () => {
  const selectedThreadId = useBusterThreadsContextSelector((x) => x.selectedThreadId);
  const createPageLink = useAppLayoutContextSelector((s) => s.createPageLink);
  const openedCollectionId = useCollectionsContextSelector((x) => x.openedCollectionId);
  const updateCollection = useCollectionsContextSelector((x) => x.updateCollection);
  const openAddTypeModal = useCollectionsContextSelector((x) => x.openAddTypeModal);
  const setOpenAddTypeModal = useCollectionsContextSelector((x) => x.setOpenAddTypeModal);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const { collection } = useIndividualCollection({ collectionId: openedCollectionId });

  const collectionTitle = collection?.name || 'No collection title';

  const textWidth = useMemo(() => {
    return measureTextWidth(collectionTitle);
  }, [collectionTitle, editingTitle]);

  const collectionBaseTitle = selectedThreadId ? collection?.name : 'Collections';

  const onSetTitleValue = useMemoizedFn((value: string) => {
    updateCollection({
      id: collection.id,
      name: value
    });
  });

  const onChangeTitle = useMemoizedFn((value: string) => {
    updateCollection({
      id: collection.id,
      name: value
    });
  });

  const items = useMemo(
    () =>
      [
        {
          title: (
            <Link
              suppressHydrationWarning
              className={`!flex !h-full cursor-pointer items-center truncate`}
              href={createPageLink({ route: BusterRoutes.APP_COLLECTIONS })}>
              {collectionBaseTitle}
            </Link>
          )
        },
        {
          title: editingTitle ? (
            <EditableTitle
              level={5}
              editing={editingTitle}
              showBottomBorder
              style={{ width: textWidth.width }}
              onSetValue={onSetTitleValue}
              onChange={onChangeTitle}
              onEdit={setEditingTitle}
              className="w-full">
              {collectionTitle}
            </EditableTitle>
          ) : (
            <Text
              ellipsis={{
                tooltip: true
              }}>
              {collectionTitle}
            </Text>
          )
        }
      ].filter((item) => item.title),
    [collectionBaseTitle, editingTitle, textWidth.width, collectionTitle, createPageLink]
  );

  return (
    <AppContentHeader>
      <div className="flex h-full w-full items-center justify-between space-x-3 overflow-hidden">
        <div className="flex h-full items-center space-x-1 overflow-hidden">
          <Breadcrumb
            className="flex h-full items-center"
            items={items}
            separator={<BreadcrumbSeperator />}
          />

          {collection && (
            <div className="flex items-center space-x-0">
              <ThreeDotDropdown collection={collection} setEditingTitle={setEditingTitle} />

              <FavoriteStar
                id={collection.id}
                type={BusterShareAssetType.COLLECTION}
                name={collectionTitle}
              />
            </div>
          )}
        </div>

        {collection && canEditCollection(collection) && (
          <ContentRight
            collection={collection}
            openAddTypeModal={openAddTypeModal}
            setOpenAddTypeModal={setOpenAddTypeModal}
          />
        )}
      </div>
    </AppContentHeader>
  );
};

const ContentRight: React.FC<{
  collection: BusterCollection;
  openAddTypeModal: boolean;
  setOpenAddTypeModal: (open: boolean) => void;
}> = React.memo(({ collection, setOpenAddTypeModal, openAddTypeModal }) => {
  const onButtonClick = useMemoizedFn(() => {
    setOpenAddTypeModal(true);
  });

  return (
    <div className="flex items-center space-x-2">
      <ShareMenu shareType={BusterShareAssetType.COLLECTION} collection={collection}>
        <Button type="text" icon={<AppMaterialIcons icon="share_windows" size={16} />} />
      </ShareMenu>
      <Button icon={<AppMaterialIcons icon="add" />} onClick={onButtonClick} type="default">
        Add to collection
      </Button>
    </div>
  );
});
ContentRight.displayName = 'ContentRight';

const ThreeDotDropdown: React.FC<{
  collection: BusterCollection;
  setEditingTitle: (editing: boolean) => void;
}> = React.memo(({ collection, setEditingTitle }) => {
  const deleteCollection = useCollectionsContextSelector((x) => x.deleteCollection);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const token = useAntToken();

  const items: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'delete',
        label: 'Delete collection',
        icon: <AppMaterialIcons icon="delete" />,
        onClick: async () => {
          try {
            await deleteCollection(collection.id);
            onChangePage({ route: BusterRoutes.APP_COLLECTIONS });
          } catch (error) {
            //
          }
        }
      },
      {
        key: 'rename',
        label: 'Rename collection',
        icon: <AppMaterialIcons icon="edit" />,
        onClick: () => {
          setEditingTitle(true);
        }
      }
    ],
    [collection.id, deleteCollection, onChangePage, setEditingTitle]
  );

  const memoizedMenu = useMemo(() => {
    return {
      items
    };
  }, [items]);

  return (
    <div className="flex items-center">
      <Dropdown trigger={['click']} menu={memoizedMenu}>
        <Button
          type="text"
          icon={
            <AppMaterialIcons
              style={{
                color: token.colorIcon
              }}
              icon="more_horiz"
              size={16}
            />
          }></Button>
      </Dropdown>
    </div>
  );
});
ThreeDotDropdown.displayName = 'ThreeDotDropdown';
