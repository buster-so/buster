import type React from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { cn } from '@/lib/utils';
import { LibraryGridView } from './LibraryGridView';
import { LibraryHeader } from './LibraryHeader';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({ filters, layout }) => {
  const { data: collections } = useGetCollectionsList({});
  const { scrollContainerRef, allResults, isFetchingNextPage } = useLibraryAssetsInfinite({
    ...filters,
    page_size: 45,
    scrollConfig: {
      scrollThreshold: 100,
    },
  });

  const layoutClassName = cn(
    'pt-10 sm:px-[max(84px,calc(10%-150px))] px-[max(24px,calc(50%-350px))] flex flex-col gap-y-10.5'
  );

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filters} />}
      contentContainerId="library-content"
      scrollable={false}
    >
      {layout === 'grid' && (
        <LibraryGridView
          className={layoutClassName}
          allResults={allResults}
          collections={collections}
          filters={filters}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
      {layout === 'list' && <span>asdf</span>}
    </AppPageLayout>
  );
};
