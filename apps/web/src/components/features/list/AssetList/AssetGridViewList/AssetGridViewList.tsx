import type { LibraryAssetListItem } from '@buster/server-shared/library';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useRef } from 'react';
import { getScreenshotSkeleton } from '@/components/features/Skeletons/get-screenshot-skeleton';
import Clock from '@/components/ui/icons/NucleoIconOutlined/clock';
import Folder from '@/components/ui/icons/NucleoIconOutlined/folder';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography/Text';
import { useMounted } from '@/hooks/useMount';
import { formatDate } from '@/lib/date';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { cn } from '@/lib/utils';
import { getGroupMetadata } from '../grouping-meta-helpers';
import { AssetGridSectionContainer } from './AssetGridSectionContainer';
import type { AssetGridViewListProps } from './AssetGridViewList.types';

export const LibraryGridView = React.memo(
  ({
    items,
    isFetchingNextPage,
    isInitialLoading: isInitialLoadingProp,
    className,
    groups,
    scrollContainerRef,
    ContextMenu,
    prelistConent,
    groupBy,
    emptyContent,
  }: AssetGridViewListProps) => {
    // Calculate number of columns based on viewport width
    const [columns, setColumns] = React.useState(3);
    const hasItems = items.length > 0;
    const hasGroups = groups !== undefined;
    const isInitialLoading = isInitialLoadingProp && !hasItems;

    React.useEffect(() => {
      const updateColumns = () => {
        if (window.innerWidth >= 1650) {
          setColumns(5);
        } else if (window.innerWidth >= 1500) {
          setColumns(4);
        } else if (window.innerWidth >= 900) {
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
        {prelistConent}

        {!isInitialLoading &&
          hasItems &&
          (hasGroups ? (
            <AssetGridGroupedView
              groups={groups}
              columns={columns}
              scrollContainerRef={scrollContainerRef}
              groupBy={groupBy}
              items={items}
              hasPrelistContent={!!prelistConent}
              ContextMenu={ContextMenu}
            />
          ) : (
            <AssetGridUngroupedView
              items={items}
              columns={columns}
              scrollContainerRef={scrollContainerRef}
              hasPrelistContent={!!prelistConent}
              ContextMenu={ContextMenu}
            />
          ))}

        {!isInitialLoading && !hasItems && emptyContent}

        {isFetchingNextPage && (
          <div className="text-text-tertiary text-center py-4">Loading more...</div>
        )}
      </ScrollArea>
    );
  }
);

const AssetGridItem = React.memo(
  (props: LibraryAssetListItem & Pick<AssetGridViewListProps, 'ContextMenu'>) => {
    const { asset_id, asset_type, ContextMenu, name, updated_at, screenshot_url } = props;
    const imageUrl = screenshot_url ?? getScreenshotSkeleton(asset_type);
    const link = createSimpleAssetRoute({
      asset_type,
      id: asset_id,
    }) as LinkProps;

    return (
      <ContextMenu {...props}>
        <Link {...link} preload={false} className="h-full">
          <div className="group border rounded cursor-pointer hover:bg-item-hover-active hover:border-gray-dark! overflow-hidden h-full flex flex-col">
            <div
              className={cn(
                'px-2.5 flex-1 pt-1.5 bg-item-select overflow-hidden',
                'max-h-[125px] min-h-[125px] h-[125px] '
              )}
            >
              <img
                src={imageUrl}
                alt={name}
                className={cn('w-full h-full object-contain object-top rounded-t-sm bg-background')}
              />
            </div>
            <div className="h-[60px] px-3 pt-2.5 pb-3 flex flex-col space-y-0.5 border-t group-hover:bg-item-hover flex-shrink-0 justify-center bg-background">
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
      </ContextMenu>
    );
  }
);

AssetGridItem.displayName = 'AssetGridItem';

const AssetGridGroupedView = ({
  groups,
  columns,
  scrollContainerRef,
  groupBy,
  ContextMenu,
  items,
  hasPrelistContent,
}: {
  groups: AssetGridViewListProps['groups'];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  groupBy: AssetGridViewListProps['groupBy'];
  items: LibraryAssetListItem[];
  hasPrelistContent: boolean;
  ContextMenu: AssetGridViewListProps['ContextMenu'];
}) => {
  if (groupBy === 'none' || !groupBy) {
    return (
      <AssetGridUngroupedView
        items={items}
        columns={columns}
        scrollContainerRef={scrollContainerRef}
        hasPrelistContent={hasPrelistContent}
        ContextMenu={ContextMenu}
      />
    );
  }

  return (
    <>
      {Object.entries(groups ?? {}).map(([groupKey, items], groupIndex) => {
        const { title, icon } = getGroupMetadata(groupKey, items, groupBy);

        return (
          <AssetGridGroupSection
            key={groupKey}
            title={title}
            icon={icon}
            items={items}
            columns={columns}
            scrollContainerRef={scrollContainerRef}
            className={hasPrelistContent ? (groupIndex === 0 ? 'mt-11' : 'mt-6') : ''}
            ContextMenu={ContextMenu}
          />
        );
      })}
    </>
  );
};

const AssetGridGroupSection = ({
  title,
  icon,
  items,
  columns,
  scrollContainerRef,
  className,
  ContextMenu,
}: {
  title: string;
  icon: React.ReactNode;
  items: LibraryAssetListItem[];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  ContextMenu: AssetGridViewListProps['ContextMenu'];
}) => {
  const virtualStartRef = useRef<HTMLDivElement>(null);
  const _mounted = useMounted(); //keep this because we tanstack virtualizer need to trigger reflow

  // Calculate rows needed for grid
  const rowCount = Math.ceil(items.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    ...commonRowVirtualizerProps,
  });

  return (
    <AssetGridSectionContainer title={title} icon={icon} className={className}>
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
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {rowItems.map((asset) => (
                  <AssetGridItem key={asset.asset_id} {...asset} ContextMenu={ContextMenu} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AssetGridSectionContainer>
  );
};

const commonRowVirtualizerProps = {
  overscan: 5,
  scrollMargin: 0,
  estimateSize: () => 125 + 60 + 16, // Height of image + name + gap
};

const AssetGridUngroupedView = ({
  items,
  columns,
  scrollContainerRef,
  hasPrelistContent,
  ContextMenu,
}: {
  items: LibraryAssetListItem[];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  hasPrelistContent: boolean;
  ContextMenu: AssetGridViewListProps['ContextMenu'];
}) => {
  // Calculate rows needed for grid
  const rowCount = Math.ceil(items.length / columns);

  // Ref to measure offset from collections section
  const virtualStartRef = useRef<HTMLDivElement>(null);
  const _mounted = useMounted(); //keep this because we tanstack virtualizer need to trigger reflow when switching between list/grid

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    ...commonRowVirtualizerProps,
  });

  return (
    <AssetGridSectionContainer
      title="Library"
      icon={<Grid2 />}
      className={hasPrelistContent ? 'mt-11' : ''}
    >
      <div
        ref={virtualStartRef}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const slicedItems = items.slice(startIndex, startIndex + columns);

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
              <div
                className="grid gap-4 pb-4"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {slicedItems.map((asset) => (
                  <AssetGridItem key={asset.asset_id} {...asset} ContextMenu={ContextMenu} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AssetGridSectionContainer>
  );
};
