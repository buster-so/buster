import type { LibraryAssetListItem } from '@buster/server-shared/library';
import type { LibrarySearchParams, SharedWithMeSearchParams } from './schema';

export type LibraryViewProps = {
  allGroups: undefined | Record<string, LibraryAssetListItem[]>;
  allResults: LibraryAssetListItem[];
  filters: LibrarySearchParams | SharedWithMeSearchParams;
  isFetchingNextPage: boolean;
  className?: string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  isInitialLoading: boolean;
  pinCollectionsToTop?: boolean;
  type: 'library' | 'shared-with-me';
};

export type SharedWithMeViewProps = LibraryViewProps;
