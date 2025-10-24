import type { LibraryAssetListItem } from '@buster/server-shared/library';
import type React from 'react';

export type AssetGridViewListProps = {
  items: LibraryAssetListItem[];
  prelistConent: React.ReactNode;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  groups: undefined | Record<string, LibraryAssetListItem[]>;
  emptyContent: React.ReactNode;
  ContextMenu: React.FC<React.PropsWithChildren<LibraryAssetListItem>>;
  groupBy: 'asset_type' | 'owner' | 'created_at' | 'updated_at' | 'none' | undefined;
};
