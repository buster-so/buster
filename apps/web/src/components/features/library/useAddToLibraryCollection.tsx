import type { AssetType } from '@buster/server-shared/assets';
import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetMetricResponse } from '@buster/server-shared/metrics';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { useMemo, useState } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces/chat';
import { useGetAsset } from '@/api/buster_rest/assets/useGetAsset';
import {
  useAddAssetToCollection,
  useGetCollectionsList,
  useRemoveAssetFromCollection,
} from '@/api/buster_rest/collections';
import {
  useDeleteLibraryAssets,
  useLibraryAssetsInfiniteManual,
  usePostLibraryAssets,
} from '@/api/buster_rest/library';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  createDropdownItems,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Plus } from '@/components/ui/icons';
import { useWhyDidYouUpdate } from '@/hooks/useWhyDidYouUpdate';
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
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { mutateAsync: addAssetsToLibrary } = usePostLibraryAssets();
  const { mutateAsync: removeAssetsFromLibrary } = useDeleteLibraryAssets();
  const { allResults, fetchNextPage, isFetchingNextPage } = useLibraryAssetsInfiniteManual({
    page_size: 25,
    assetTypes: allAssetsExceptCollection,
  });
  const collectionsList = collectionsListResponse?.data || defaultCollectionsList;

  const { data: assetResult } = useGetAsset(
    {
      type: assetType,
      assetId,
      chosenVersionNumber: 'LATEST',
    },
    {
      select: (v) => {
        if (
          assetType === 'dashboard_file' ||
          assetType === 'report_file' ||
          assetType === 'metric_file' ||
          assetType === 'chat'
        ) {
          const dashboard = v as
            | GetDashboardResponse
            | GetReportResponse
            | GetMetricResponse
            | IBusterChat;
          return {
            added_to_library: dashboard.added_to_library,
            collections: dashboard.collections,
          };
        }
        const _exhaustiveCheck: 'collection' = assetType;
        return {
          added_to_library: false,
          collections: [],
        };
      },
    }
  );
  const collectionsForAsset = assetResult?.collections || [];
  const addedToLibrary = assetResult?.added_to_library || false;

  const selectedCollections = useMemo(() => {
    const selectedCollectionIds = new Set<string>([]);
    collectionsForAsset.forEach((collection) => {
      selectedCollectionIds.add(collection.id);
    });
    return selectedCollectionIds;
  }, [collectionsForAsset.length]);

  const dropdownItems: IDropdownItems = useMemo(() => {
    const collections = collectionsList.map((collection) =>
      createDropdownItem({
        label: collection.name,
        value: collection.id,
        icon: <ASSET_ICONS.collections />,
        selected: selectedCollections.has(collection.id),
        link: {
          to: '/app/collections/$collectionId',
          params: { collectionId: collection.id },
        },
        onClick: () => {
          const isSelected = selectedCollections.has(collection.id);
          const payload = {
            id: collection.id,
            assets: [{ id: assetId, type: assetType }],
          };
          if (isSelected) removeAssetFromCollection(payload);
          else addAssetToCollection(payload);
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
            selected: addedToLibrary,
            onClick: () => {
              const payload = [{ assetId, assetType }];
              if (addedToLibrary) removeAssetsFromLibrary(payload);
              else addAssetsToLibrary(payload);
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
    addedToLibrary,
    collectionsList,
    selectedCollections,
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
