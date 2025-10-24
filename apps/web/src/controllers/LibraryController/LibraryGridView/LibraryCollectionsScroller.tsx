import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import React from 'react';
import { GradientHorizontalScoller } from '@/components/ui/scroll-area/GradientHorizontalScoller';
import { CollectionCard } from './LibraryCollectionCard';

interface LibraryCollectionsScrollerProps {
  collections: BusterCollectionListItem[];
}

export const LibraryCollectionsScroller = React.memo(
  ({ collections }: LibraryCollectionsScrollerProps) => {
    return (
      <GradientHorizontalScoller effectTrigger={collections.length}>
        <div className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} {...collection} />
          ))}
        </div>
      </GradientHorizontalScoller>
    );
  }
);

LibraryCollectionsScroller.displayName = 'LibraryCollectionsScroller';
