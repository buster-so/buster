import type React from 'react';
import { useLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { useLibraryLayout } from '@/context/Library/useLibraryLayout';
import { LibraryHeader } from './LibraryHeader';
import type { LibraryLayout, LibrarySearchParams } from './schema';

export type LibraryControllerProps = {
  filters: LibrarySearchParams;
  layout: LibraryLayout;
};

export const LibraryController: React.FC<LibraryControllerProps> = ({
  filters,
  layout: initialLayout,
}) => {
  const { layout, setLayout } = useLibraryLayout({ initialLayout });

  const { scrollContainerRef, allResults, isLoading, hasNextPage, isFetchingNextPage } =
    useLibraryAssetsInfinite({
      ...filters,
      page_size: 10,
      scrollConfig: {
        scrollThreshold: 100,
      },
    });
  return (
    <AppPageLayout
      header={<LibraryHeader setLayout={setLayout} layout={layout} filters={filters} />}
    >
      {layout}
    </AppPageLayout>
  );
};
