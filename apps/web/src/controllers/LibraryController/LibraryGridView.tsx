import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { faker } from '@faker-js/faker';
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

// const allResults: LibraryAssetListItem[] = Array.from({ length: 100 }, (_, index) => ({
//   asset_id: `asset-${index}`,
//   asset_type: 'dashboard_file',
//   name: `Asset ${index}`,
//   updated_at: new Date().toISOString(),
//   screenshot_url: faker.image.url(),
//   created_at: new Date().toISOString(),
//   created_by: `user-${index}`,
//   created_by_name: `User ${index}`,
//   created_by_email: `user${index}@example.com`,
//   created_by_avatar_url: `https://via.placeholder.com/150?text=User+${index}`,
// }));

export const LibraryGridView = React.memo(
  ({
    allResults,
    collections,
    isFetchingNextPage,
    className,
    scrollContainerRef,
  }: {
    allResults: LibraryAssetListItem[];
    collections: BusterCollectionListItem[];
    filters: LibrarySearchParams;
    isFetchingNextPage: boolean;
    className?: string;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    // Calculate number of columns based on viewport width
    const [columns, setColumns] = React.useState(3);
    const hasCollections = collections.length > 0;
    const hasResults = allResults.length > 0;

    React.useEffect(() => {
      const updateColumns = () => {
        if (window.innerWidth >= 1024) {
          setColumns(3);
        } else {
          setColumns(2);
        }
      };

      updateColumns();
      window.addEventListener('resize', updateColumns);
      return () => window.removeEventListener('resize', updateColumns);
    }, []);

    // Calculate rows needed for grid
    const rowCount = Math.ceil(allResults.length / columns);

    // Ref to measure offset from collections section
    const virtualStartRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => scrollContainerRef.current,
      scrollMargin: 0,
      estimateSize: () => 125 + 60 + 16, // Height of image + name + gap
      overscan: 3, // Render 3 extra rows above/below for smooth scrolling
    });

    return (
      <ScrollArea
        viewportRef={scrollContainerRef}
        className={'h-full '}
        viewportClassName={cn(
          'pb-12 relative',
          'pt-10 sm:px-[max(84px,calc(10%-150px))] px-[max(24px,calc(50%-350px))]',
          className
        )}
      >
        {hasCollections && (
          <LibrarySectionContainer title="Collections" icon={<Folder />}>
            <LibraryCollectionsScroller collections={collections} />
          </LibrarySectionContainer>
        )}

        {hasResults && (
          <LibrarySectionContainer title="Recently visisted" icon={<Clock />} className="mt-11">
            <div
              ref={virtualStartRef}
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * columns;
                const items = allResults.slice(startIndex, startIndex + columns);

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {items.map((asset) => (
                        <LibraryGridItem key={asset.asset_id} {...asset} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </LibrarySectionContainer>
        )}

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
          <div
            className={cn(
              'px-2.5 flex-1 pt-1.5 bg-item-select overflow-hidden',
              'max-h-[125px] min-h-[125px] h-[125px] '
            )}
          >
            <img
              src={imageUrl}
              alt={name}
              className={cn('w-full h-full object-contain object-left rounded-t-sm bg-background')}
            />
          </div>
          <div className="h-[60px] px-3 pt-2.5 pb-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover flex-shrink-0 justify-center">
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
