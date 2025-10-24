import type { BusterCollectionListItem } from '@buster/server-shared/collections';
import React from 'react';
import { CollectionCard } from './LibraryCollectionCard';

export const LibraryCollectionGrid = React.memo(
  ({ collections }: { collections: BusterCollectionListItem[] }) => {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} {...collection} />
        ))}
      </div>
    );
  }
);

LibraryCollectionGrid.displayName = 'LibraryCollectionGrid';
