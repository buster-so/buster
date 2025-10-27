import type { GroupedAssets, LibraryAssetListItem } from '@buster/server-shared/library';
import type { LibrarySearchParams, SharedWithMeSearchParams } from './schema';

export type LibraryViewProps = {
  allGroups: undefined | GroupedAssets;
  allResults: LibraryAssetListItem[];
  filters: LibrarySearchParams | SharedWithMeSearchParams;
  isFetchingNextPage: boolean;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isInitialLoading: boolean;
  pinCollections: boolean;
  type: 'library' | 'shared-with-me';
};

export type SharedWithMeViewProps = LibraryViewProps;
