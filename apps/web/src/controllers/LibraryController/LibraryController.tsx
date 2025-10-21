import type React from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { LibraryCollectionsScroller } from './LibraryCollectionsScroller';
import { LibraryHeader } from './LibraryHeader';
import { LibrarySectionContainer } from './LibrarySectionContainer';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({ filters, layout }) => {
  const { scrollContainerRef, allResults, isLoading, hasNextPage, isFetchingNextPage } =
    useLibraryAssetsInfinite({
      ...filters,
      page_size: 60,
      scrollConfig: {
        scrollThreshold: 100,
      },
    });

  const { data: collections } = useGetCollectionsList({});

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filters} />}
      contentContainerId="library-content"
    >
      <div className="mt-10 sm:px-[max(84px,calc(50%-350px))] px-[max(24px,calc(50%-350px))]">
        <LibrarySectionContainer title="Collections" icon={<Folder />}>
          <LibraryCollectionsScroller collections={collections} />
        </LibrarySectionContainer>
      </div>
    </AppPageLayout>
  );
};
