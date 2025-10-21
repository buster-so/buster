import React from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { LibraryCollectionsScroller } from './LibraryCollectionsScroller';
import { LibraryGridItems } from './LibraryGridItems';
import { LibraryHeader } from './LibraryHeader';
import { LibrarySectionContainer } from './LibrarySectionContainer';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({ filters, layout }) => {
  const { data: collections } = useGetCollectionsList({});
  const { scrollContainerRef, allResults, isLoading, hasNextPage, isFetchingNextPage } =
    useLibraryAssetsInfinite({
      ...filters,
      page_size: 45,
      scrollConfig: {
        scrollThreshold: 100,
      },
    });

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filters} />}
      contentContainerId="library-content"
      scrollable
      scrollContainerRef={scrollContainerRef}
    >
      <div className="mt-10 sm:px-[max(84px,calc(10%-150px))] px-[max(24px,calc(50%-350px))] flex flex-col gap-y-10.5 mb-12">
        {layout === 'grid' && (
          <React.Fragment>
            <LibrarySectionContainer title="Collections" icon={<Folder />}>
              <LibraryCollectionsScroller collections={collections} />
            </LibrarySectionContainer>
            <LibrarySectionContainer title="Recently visisted" icon={<Clock />}>
              <LibraryGridItems filters={filters} allResults={allResults} />
            </LibrarySectionContainer>

            {isFetchingNextPage && (
              <div className="text-text-tertiary text-center py-0">Loading more...</div>
            )}
          </React.Fragment>
        )}
        {layout === 'list' && <span>asdf</span>}
      </div>
    </AppPageLayout>
  );
};
