import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  useAddAndRemoveAssetsFromCollection,
  useGetCollection
} from '@/api/buster_rest/collections';
import { useSearch } from '@/api/buster_rest/search';
import { Button } from '@/components/ui/buttons';
import {
  InputSelectModal,
  type InputSelectModalProps
} from '@/components/ui/modal/InputSelectModal';
import { Text } from '@/components/ui/typography';
import { useDebounce, useMemoizedFn } from '@/hooks';
import { formatDate } from '@/lib';
import { ASSET_ICONS } from '../config/assetIcons';
import type { BusterSearchResult } from '@/api/asset_interfaces/search';
import type { BusterListRowItem } from '@/components/ui/list/BusterList';
import type { ShareAssetType } from '@buster/server-shared/share';

export const AddToCollectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  collectionId: string;
}> = React.memo(({ open, onClose, collectionId }) => {
  const { data: collection, isFetched: isFetchedCollection } = useGetCollection(collectionId);
  const { mutateAsync: addAndRemoveAssetsFromCollection } = useAddAndRemoveAssetsFromCollection();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 200 });

  const { data: searchResults } = useSearch({
    query: debouncedSearchTerm,
    asset_types: ['metric', 'dashboard'],
    num_results: 100
  });

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const columns = useMemo<InputSelectModalProps<BusterSearchResult>['columns']>(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        render: (name, data) => {
          const Icon = data.type === 'metric' ? ASSET_ICONS.metrics : ASSET_ICONS.dashboards;
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-icon-color">
                <Icon />
              </span>
              <Text>{name}</Text>
            </div>
          );
        }
      },
      {
        title: 'Updated',
        dataIndex: 'updated_at',
        width: 140,
        render: (value: string) => {
          return formatDate({
            date: value,
            format: 'lll'
          });
        }
      }
    ],
    []
  );

  const rows: BusterListRowItem<BusterSearchResult>[] = useMemo(() => {
    return (
      searchResults?.map((asset) => ({
        id: asset.id,
        data: asset
      })) || []
    );
  }, [searchResults]);

  const handleAddAndRemoveMetrics = useMemoizedFn(async () => {
    const keyedAssets = rows.reduce<
      Record<string, { type: Exclude<ShareAssetType, 'collection'>; id: string }>
    >((acc, asset) => {
      if (asset.data?.type && asset.data?.type !== 'collection') {
        acc[asset.id] = { type: asset.data?.type, id: asset.id };
      }
      return acc;
    }, {});

    const assets = selectedAssets.map<{
      type: Exclude<ShareAssetType, 'collection'>;
      id: string;
    }>((asset) => ({
      id: asset,
      type: keyedAssets[asset].type
    }));
    await addAndRemoveAssetsFromCollection({
      collectionId,
      assets
    });
    onClose();
  });

  const originalIds = useMemo(() => {
    return collection?.assets?.map((asset) => asset.id) || [];
  }, [collection?.assets]);

  const isSelectedChanged = useMemo(() => {
    const newIds = selectedAssets;
    return originalIds.length !== newIds.length || originalIds.some((id) => !newIds.includes(id));
  }, [originalIds, selectedAssets]);

  const removedAssetCount = useMemo(() => {
    return originalIds.filter((id) => !selectedAssets.includes(id)).length;
  }, [originalIds, selectedAssets]);

  const addedAssetCount = useMemo(() => {
    return selectedAssets.filter((id) => !originalIds.includes(id)).length;
  }, [originalIds, selectedAssets]);

  const primaryButtonText = useMemo(() => {
    if (!isFetchedCollection) {
      return 'Loading assets...';
    }

    const hasRemovedItems = removedAssetCount > 0;
    const hasAddedItems = addedAssetCount > 0;

    if (hasRemovedItems && hasAddedItems) {
      return 'Update collection';
    }

    if (hasRemovedItems) {
      return 'Remove assets';
    }

    if (hasAddedItems) {
      return 'Add assets';
    }

    return 'Update collection';
  }, [isFetchedCollection, removedAssetCount, addedAssetCount]);

  const primaryButtonTooltipText = useMemo(() => {
    if (!isFetchedCollection) {
      return '';
    }

    const hasRemovedItems = removedAssetCount > 0;
    const hasAddedItems = addedAssetCount > 0;
    const returnText: string[] = [];

    if (!hasRemovedItems && !hasAddedItems) {
      return 'No changes to update';
    }

    if (hasRemovedItems) {
      returnText.push(`Removing ${removedAssetCount}`);
    }

    if (hasAddedItems) {
      returnText.push(`Adding ${addedAssetCount}`);
    }

    return returnText.join(', ');
  }, [isFetchedCollection, addedAssetCount, removedAssetCount]);

  const emptyState = useMemo(() => {
    if (rows.length === 0) {
      return 'No assets found';
    }
    return undefined;
  }, [rows.length]);

  const footer: NonNullable<InputSelectModalProps['footer']> = useMemo(() => {
    return {
      left:
        selectedAssets.length > 0 ? (
          <Button variant="ghost" onClick={() => setSelectedAssets([])}>
            Clear selected
          </Button>
        ) : undefined,
      secondaryButton: {
        text: 'Cancel',
        onClick: onClose
      },
      primaryButton: {
        text: primaryButtonText,
        onClick: handleAddAndRemoveMetrics,
        disabled: !isSelectedChanged,
        tooltip: primaryButtonTooltipText
      }
    };
  }, [
    selectedAssets.length,
    isSelectedChanged,
    handleAddAndRemoveMetrics,
    primaryButtonText,
    primaryButtonTooltipText
  ]);

  useLayoutEffect(() => {
    if (isFetchedCollection) {
      const assets = collection?.assets?.map((asset) => asset.id) || [];
      setSelectedAssets(assets);
    }
  }, [isFetchedCollection, collection?.assets]);

  return (
    <InputSelectModal
      width={665}
      open={open}
      onClose={onClose}
      columns={columns}
      rows={rows}
      onSelectChange={setSelectedAssets}
      selectedRowKeys={selectedAssets}
      footer={footer}
      emptyState={emptyState}
      searchText={searchTerm}
      handleSearchChange={setSearchTerm}
    />
  );
});

AddToCollectionModal.displayName = 'AddToCollectionModal';
