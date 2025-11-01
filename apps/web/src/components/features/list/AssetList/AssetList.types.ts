import type { LibraryAssetListItem } from '@buster/server-shared/library';
import type React from 'react';
import type { BusterListRow } from '@/components/ui/list/BusterListNew/interfaces';

export type AssetGridViewListProps = {
  items: LibraryAssetListItem[];
  prelistContent?: React.ReactNode;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  groups: undefined | Record<string, LibraryAssetListItem[]>;
  emptyContent: React.ReactNode;
  ContextMenu: React.ComponentType<
    React.PropsWithChildren<
      LibraryAssetListItem & { open?: boolean; onOpenChange?: (open: boolean) => void }
    >
  >;
  groupBy: 'asset_type' | 'owner' | 'created_at' | 'updated_at' | 'none' | undefined;
  type: 'library' | 'shared-with-me';
};

export type AssetListItem = Pick<
  LibraryAssetListItem,
  | 'asset_id'
  | 'asset_type'
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'created_by_name'
  | 'created_by_avatar_url'
  | 'screenshot_url'
>;

export type AssetListViewListProps = AssetGridViewListProps & {
  prelistItems?: BusterListRow<LibraryAssetListItem>[];
};
