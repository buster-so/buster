import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import type { LibrarySearchParams } from './schema';

export type LibraryViewProps = {
  allGroups: undefined | Record<string, LibraryAssetListItem[]>;
  allResults: LibraryAssetListItem[];
  collections: BusterCollectionListItem[];
  filters: LibrarySearchParams;
  isFetchingNextPage: boolean;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isInitialLoading: boolean;
};
