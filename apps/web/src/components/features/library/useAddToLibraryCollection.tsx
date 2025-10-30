import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import { useMemo, useState } from 'react';
import { useAddAssetToCollection, useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfiniteManual } from '@/api/buster_rest/library';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  createDropdownItems,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Plus } from '@/components/ui/icons';
import { getAssetSelectedQuery } from '@/layouts/AppAssetCheckLayout/getAssetSelectedQuery';
import { ASSET_ICONS } from '../icons/assetIcons';
import { NewCollectionModal } from '../modals/NewCollectionModal';

const defaultCollectionsList: BusterCollectionListItem[] = [];

const allAssetsExceptCollection: AssetType[] = [
  'dashboard_file',
  'report_file',
  'metric_file',
  'chat',
];

export const useAddToLibraryCollection = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: AssetType;
}): IDropdownItems => {
  const [openCollectionModal, setOpenCollectionModal] = useState(false);

  const { data: collectionsListResponse } = useGetCollectionsList();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const { allResults, fetchNextPage, isFetchingNextPage } = useLibraryAssetsInfiniteManual({
    page_size: 25,
    assetTypes: allAssetsExceptCollection,
  });
  const collectionsList = collectionsListResponse?.data || defaultCollectionsList;

  const dropdownItems: IDropdownItems = useMemo(() => {
    const collections = collectionsList.map((collection) =>
      createDropdownItem({
        label: collection.name,
        value: collection.id,
        icon: <ASSET_ICONS.collections />,
        link: {
          to: '/app/collections/$collectionId',
          params: { collectionId: collection.id },
        },
      })
    );

    return createDropdownItems([
      {
        label: 'Save to library',
        value: 'save-to-library',
        icon: <ASSET_ICONS.collections />,
        onScrollToBottom: () => fetchNextPage(),
        selectType: 'multiple',
        isFetchingNextPage,
        items: [
          {
            label: 'Library',
            value: 'library',
            icon: <ASSET_ICONS.library />,
            link: {
              to: '/app/library',
            },
          },
          ...collections,
        ],
        footerContent: (
          <>
            <Button
              block
              variant="ghost"
              prefix={<Plus />}
              loading={isFetchingNextPage}
              onClick={() => setOpenCollectionModal(true)}
              className="justify-start!"
            >
              Create collection
            </Button>
            <NewCollectionModal
              open={openCollectionModal}
              onClose={() => setOpenCollectionModal(false)}
              useChangePage={true}
              onCollectionCreated={async (collectionId) => {
                await addAssetToCollection({
                  id: collectionId,
                  assets: [{ id: assetId, type: assetType }],
                });
              }}
            />
          </>
        ),
      },
    ]);
  }, [
    collectionsList,
    addAssetToCollection,
    openCollectionModal,
    setOpenCollectionModal,
    allResults,
    assetId,
    assetType,
    fetchNextPage,
    isFetchingNextPage,
  ]);

  return dropdownItems;
};
