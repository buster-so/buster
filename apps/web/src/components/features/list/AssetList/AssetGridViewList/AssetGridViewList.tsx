import type { GroupedAssets, LibraryAssetListItem } from '@buster/server-shared/library';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Grid2 from '@/components/ui/icons/NucleoIconOutlined/grid-2';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Text } from '@/components/ui/typography/Text';
import { useMounted } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import type { AssetGridViewListProps } from '../AssetList.types';
import { getGroupMetadata } from '../grouping-meta-helpers';
import { AssetGridItem } from './AssetGridCard';
import { AssetGridSectionContainer } from './AssetGridSectionContainer';

export const AssetGridViewList = React.memo(
  ({
    items,
    isFetchingNextPage,
    isInitialLoading: isInitialLoadingProp,
    className,
    groups,
    scrollContainerRef,
    ContextMenu,
    prelistContent,
    groupBy,
    emptyContent,
    type,
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
        {prelistContent}

        {!isInitialLoading &&
          hasItems &&
          (hasGroups ? (
            <AssetGridGroupedView
              groups={groups}
              columns={columns}
              scrollContainerRef={scrollContainerRef}
              groupBy={groupBy}
              items={items}
              hasPrelistContent={!!prelistContent}
              ContextMenu={ContextMenu}
              type={type}
            />
          ) : (
            <AssetGridUngroupedView
              items={items}
              columns={columns}
              scrollContainerRef={scrollContainerRef}
              hasPrelistContent={!!prelistContent}
              ContextMenu={ContextMenu}
              type={type}
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

type VirtualListItem =
  | {
      type: 'header';
      groupKey: string;
      title: string;
      icon: React.ReactNode;
      isFirst: boolean;
    }
  | {
      type: 'row';
      items: LibraryAssetListItem[];
      rowIndex: number;
    };

const AssetGridGroupedView = ({
  groups,
  columns,
  scrollContainerRef,
  groupBy,
  ContextMenu,
  items,
  hasPrelistContent,
  type,
}: {
  groups: AssetGridViewListProps['groups'];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  groupBy: AssetGridViewListProps['groupBy'];
  ContextMenu: AssetGridViewListProps['ContextMenu'];
  items: LibraryAssetListItem[];
  hasPrelistContent: boolean;
  type: AssetGridViewListProps['type'];
}) => {
  const _mounted = useMounted();

  if (groupBy === 'none' || !groups) {
    return (
      <AssetGridUngroupedView
        items={items}
        columns={columns}
        scrollContainerRef={scrollContainerRef}
        hasPrelistContent={hasPrelistContent}
        ContextMenu={ContextMenu}
        type={type}
      />
    );
  }

  // Flatten groups into a single virtual list structure
  const virtualItems: VirtualListItem[] = React.useMemo(() => {
    const result: VirtualListItem[] = [];
    const groupEntries = Object.entries(groups ?? {});

    groupEntries.forEach(([groupKey, groupItems], groupIndex) => {
      if (groupItems.length === 0) return;
      const { title, icon } = getGroupMetadata(
        groupKey as keyof GroupedAssets,
        groupItems,
        groupBy
      );

      // Add group header
      result.push({
        type: 'header',
        groupKey,
        title,
        icon,
        isFirst: groupIndex === 0,
      });

      // Add rows for this group
      const rowCount = Math.ceil(groupItems.length / columns);
      for (let i = 0; i < rowCount; i++) {
        const startIndex = i * columns;
        const rowItems = groupItems.slice(startIndex, startIndex + columns);
        result.push({
          type: 'row',
          items: rowItems,
          rowIndex: i,
        });
      }
    });

    return result;
  }, [groups, columns, groupBy]);

  const bottomSpacing = 12; // gap before content

  const rowVirtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      if (item.type === 'header') {
        // Header height: icon + text + spacing
        // First header gets extra top margin if there's prelist content
        // Non-first headers get margin-top for spacing between sections
        const baseHeaderHeight = 18; // height of the header itself
        const topSpacing = item.isFirst && hasPrelistContent ? 24 : index > 0 ? 24 : 0;
        return topSpacing + baseHeaderHeight + bottomSpacing;
      }
      // Row height: item height + gap
      return 125 + 60 + 16; // image + name + gap
    },
    overscan: 5,
    scrollMargin: 0,
  });

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = virtualItems[virtualRow.index];

        if (item.type === 'header') {
          // Calculate padding based on whether this is first header and if there's prelist content
          const topPadding = item.isFirst && hasPrelistContent ? 24 : virtualRow.index > 0 ? 24 : 0;

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                paddingTop: `${topPadding}px`,
                paddingBottom: `${bottomSpacing}px`,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div className="flex items-center space-x-1 mx-2">
                <span className="text-text-secondary">{item.icon}</span>
                <Text variant={'secondary'} size={'sm'}>
                  {item.title}
                </Text>
              </div>
            </div>
          );
        }

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
              {item.items.map((asset) => (
                <AssetGridItem key={asset.asset_id} {...asset} ContextMenu={ContextMenu} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AssetGridUngroupedView = ({
  items,
  columns,
  scrollContainerRef,
  hasPrelistContent,
  ContextMenu,
  type,
}: {
  items: LibraryAssetListItem[];
  columns: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  hasPrelistContent: boolean;
  ContextMenu: AssetGridViewListProps['ContextMenu'];
  type: AssetGridViewListProps['type'];
}) => {
  // Calculate rows needed for grid
  const rowCount = Math.ceil(items.length / columns);

  // Ref to measure offset from collections section
  const virtualStartRef = useRef<HTMLDivElement>(null);
  const _mounted = useMounted(); //keep this because we tanstack virtualizer need to trigger reflow when switching between list/grid

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    overscan: 5,
    scrollMargin: 0,
    estimateSize: () => 125 + 60 + 16, // Height of image + name + gap
  });

  return (
    <AssetGridSectionContainer
      title={type === 'library' ? 'Library' : 'Assets'}
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
