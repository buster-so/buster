import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography/Text';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';
import { LibraryCollectionsScroller } from './LibraryCollectionsScroller';
import { LibrarySectionContainer } from './LibrarySectionContainer';
import type { LibrarySearchParams } from './schema';

export const LibraryGridView = React.memo(
  ({
    allResults,
    collections,
    filters,
    isFetchingNextPage,
    className,
  }: {
    allResults: LibraryAssetListItem[];
    collections: BusterCollectionListItem[];
    filters: LibrarySearchParams;
    isFetchingNextPage: boolean;
    className?: string;
  }) => {
    const viewportRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
      count: allResults.length,
      getScrollElement: () => viewportRef.current,
      lanes: 1,
      estimateSize: () => 200, // Height of card + gap
      overscan: 1, // Render 5 extra items above/below for smooth scrolling
    });

    return (
      <ScrollArea
        viewportRef={viewportRef}
        className={'h-full '}
        viewportClassName={cn(
          'pb-12 relative',
          'pt-10 sm:px-[max(84px,calc(10%-150px))] px-[max(24px,calc(50%-350px))]',
          className
        )}
      >
        <LibrarySectionContainer title="Collections" icon={<Folder />}>
          <LibraryCollectionsScroller collections={collections} />
        </LibrarySectionContainer>
        <LibrarySectionContainer title="Recently visisted" icon={<Clock />} className="mt-11">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const asset = allResults[virtualItem.index];
              if (!asset) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="pb-4"
                >
                  <LibraryGridItem {...asset} />
                </div>
              );
            })}
          </div>
        </LibrarySectionContainer>

        {isFetchingNextPage && (
          <div className="text-text-tertiary text-center py-4">Loading more...</div>
        )}
      </ScrollArea>
    );
  }
);

const LibraryGridItem = React.memo(
  ({ asset_id, asset_type, name, updated_at, screenshot_url }: LibraryAssetListItem) => {
    const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
    const link = createSimpleAssetRoute({
      asset_type,
      id: asset_id,
    }) as LinkProps;

    return (
      <Link {...link} preload={false} className="h-full">
        <div className="group border rounded cursor-pointer hover:shadow hover:bg-item-hover-active overflow-hidden h-full flex flex-col">
          <div className="px-2.5 flex-1 pt-1.5 bg-item-select min-h-[125px] max-h-[125px] overflow-hidden">
            <img
              src={imageUrl}
              alt={name}
              className={cn('w-full h-full object-contain object-left rounded-t-sm bg-background')}
            />
          </div>
          <div className="px-3 pt-2.5 pb-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover">
            <Text>{name}</Text>
            <div className="flex items-center space-x-1 text-xs text-text-tertiary">
              <Clock />
              <Text variant={'tertiary'} size="sm">
                {formatDate({
                  date: updated_at,
                  format: 'MMM D',
                })}
              </Text>
            </div>
          </div>
        </div>
      </Link>
    );
  }
);

LibraryGridItem.displayName = 'LibraryGridItem';
