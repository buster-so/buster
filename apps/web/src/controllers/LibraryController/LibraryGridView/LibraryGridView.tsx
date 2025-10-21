import type { AssetType } from '@buster/server-shared/assets';
import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { faker } from '@faker-js/faker';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import type { BusterCollectionListItem } from '@/api/asset_interfaces/collection';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/icons';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography/Text';
import { useMounted } from '@/hooks/useMount';
import { AssetTypeTranslations } from '@/lib/assets/asset-translations';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';
import { LibraryItemContextMenu } from '../LibraryItemDropdown';
import type { LibrarySearchParams } from '../schema';
import { LibraryCollectionsScroller } from './LibraryCollectionsScroller';
import { LibrarySectionContainer } from './LibrarySectionContainer';

export const LibraryGridView = React.memo(
  ({
    allResults,
    collections,
    isFetchingNextPage,
    isLoading,
    isPending,
    className,
    filters,
    scrollContainerRef,
    allGroups,
  }: {
    allGroups: undefined | Record<string, LibraryAssetListItem[]>;
    allResults: LibraryAssetListItem[];
    collections: BusterCollectionListItem[];
    filters: LibrarySearchParams;
    isFetchingNextPage: boolean;
    isLoading: boolean;
    isPending: boolean;
    className?: string;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    // Calculate number of columns based on viewport width
    const [columns, setColumns] = React.useState(3);
    const hasCollections = collections.length > 0;
    const hasResults = allResults.length > 0;
    const hasGroups = allGroups !== undefined;
    const groupBy = filters.group_by;
    const isInitialLoading = (isLoading || isPending) && !hasResults;

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

    return (
      <ScrollArea
        key={hasGroups ? 'grouped' : 'ungrouped'}
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

        {isInitialLoading && <div className="text-text-tertiary text-center py-8">Loading...</div>}

        {!isInitialLoading && !hasGroups && (
          <LibraryUngroupedView
            allResults={allResults}
            columns={columns}
            scrollContainerRef={scrollContainerRef}
          />
        )}
        {!isInitialLoading && hasGroups && (
          <LibraryGroupedView
            allGroups={allGroups}
            columns={columns}
            scrollContainerRef={scrollContainerRef}
            groupBy={groupBy}
            allResults={allResults}
          />
        )}

        {isFetchingNextPage && (
          <div className="text-text-tertiary text-center py-4">Loading more...</div>
        )}
      </ScrollArea>
    );
  }
);

const LibraryGridItem = React.memo((props: LibraryAssetListItem) => {
  const { asset_id, asset_type, name, updated_at, screenshot_url } = props;
  const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
  const link = createSimpleAssetRoute({
    asset_type,
    id: asset_id,
  }) as LinkProps;

  return (
    <LibraryItemContextMenu {...props}>
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
    </LibraryItemContextMenu>
  );
});

LibraryGridItem.displayName = 'LibraryGridItem';

const LibraryGroupedView = ({
  allGroups,
  columns,
  scrollContainerRef,
  groupBy,
  allResults,
}: {
  allGroups: Record<string, LibraryAssetListItem[]>;
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  groupBy: LibrarySearchParams['group_by'];
  allResults: LibraryAssetListItem[];
}) => {
  if (groupBy === 'none' || !groupBy) {
    return (
      <LibraryUngroupedView
        allResults={allResults}
        columns={columns}
        scrollContainerRef={scrollContainerRef}
      />
    );
  }

  const getGroupMetadata = (
    groupKey: string,
    items: LibraryAssetListItem[]
  ): { title: string; icon: React.ReactNode } => {
    if (groupBy === 'asset_type') {
      const Icon = assetTypeToIcon(groupKey as AssetType);
      return {
        title: AssetTypeTranslations[groupKey as AssetType],
        icon: <Icon />,
      };
    }

    if (groupBy === 'owner') {
      const firstItem = items[0];
      return {
        title: firstItem.created_by_name ?? firstItem.created_by_email,
        icon: (
          <Avatar
            size={16}
            image={firstItem.created_by_avatar_url}
            name={firstItem.created_by_name}
          />
        ),
      };
    }

    if (groupBy === 'created_at' || groupBy === 'updated_at') {
      const dateField = groupBy === 'created_at' ? items[0].created_at : items[0].updated_at;
      return {
        title: formatDate({ date: dateField, format: 'MMM D, YYYY' }),
        icon: <Calendar />,
      };
    }

    const _exhaustiveCheck: never = groupBy;
    console.error('Exhaustive check failed for groupBy', _exhaustiveCheck);
    return { title: 'Unknown', icon: null };
  };

  return (
    <>
      {Object.entries(allGroups).map(([groupKey, items], groupIndex) => {
        const { title, icon } = getGroupMetadata(groupKey, items);

        return (
          <LibraryGroupSection
            key={groupKey}
            title={title}
            icon={icon}
            items={items}
            columns={columns}
            scrollContainerRef={scrollContainerRef}
            className={groupIndex === 0 ? 'mt-11' : 'mt-6'}
          />
        );
      })}
    </>
  );
};

const LibraryGroupSection = ({
  title,
  icon,
  items,
  columns,
  scrollContainerRef,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  items: LibraryAssetListItem[];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) => {
  const virtualStartRef = useRef<HTMLDivElement>(null);
  const _mounted = useMounted(); //keep this because we tanstack virtualizer need to trigger reflow

  // Calculate rows needed for grid
  const rowCount = Math.ceil(items.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    scrollMargin: 0,
    estimateSize: () => 125 + 60 + 16, // Height of image + name + gap
    overscan: 3,
  });

  return (
    <LibrarySectionContainer title={title} icon={icon} className={className}>
      <div
        ref={virtualStartRef}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

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
                {rowItems.map((asset) => (
                  <LibraryGridItem key={asset.asset_id} {...asset} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </LibrarySectionContainer>
  );
};

const LibraryUngroupedView = ({
  allResults,
  columns,
  scrollContainerRef,
}: {
  allResults: LibraryAssetListItem[];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  // Calculate rows needed for grid
  const rowCount = Math.ceil(allResults.length / columns);

  // Ref to measure offset from collections section
  const virtualStartRef = useRef<HTMLDivElement>(null);
  const _mounted = useMounted(); //keep this because we tanstack virtualizer need to trigger reflow

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    scrollMargin: 0,
    estimateSize: () => 125 + 60 + 16, // Height of image + name + gap
    overscan: 3, // Render 3 extra rows above/below for smooth scrolling
  });

  return (
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
  );
};
