import React from 'react';
import { useGetCollectionsList } from '@/api/buster_rest/collections';
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

  return (
    <AppPageLayout
      header={<LibraryHeader layout={layout} filters={filters} />}
      contentContainerId="library-content"
    >
      <div className="mt-10 sm:px-[max(84px,calc(50%-350px))] px-[max(24px,calc(50%-350px))] flex flex-col gap-y-10.5">
        {layout === 'grid' && (
          <React.Fragment>
            <LibrarySectionContainer title="Collections" icon={<Folder />}>
              <LibraryCollectionsScroller collections={collections} />
            </LibrarySectionContainer>
            <LibrarySectionContainer title="Recently visisted" icon={<Clock />}>
              <LibraryGridItems filters={filters} />
            </LibrarySectionContainer>
          </React.Fragment>
        )}
        {layout === 'list' && <span>asdf</span>}
      </div>
    </AppPageLayout>
  );
};
