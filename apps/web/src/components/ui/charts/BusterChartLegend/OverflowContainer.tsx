import { useVirtualizer } from '@tanstack/react-virtual';
import React from 'react';
import { Popover } from '@/components/ui/popover/Popover';
import { cn } from '@/lib/classMerge';
import type { BusterChartLegendItem, BusterChartLegendProps } from './interfaces';
import { LegendItemDot } from './LegendDot';
import { LegendItem } from './LegendItem';

export const OverflowButton: React.FC<{
  legendItems: BusterChartLegendItem[];
  onFocusClick?: BusterChartLegendProps['onFocusItem'];
  onClickItem?: BusterChartLegendProps['onClickItem'];
  onHoverItem?: BusterChartLegendProps['onHoverItem'];
}> = React.memo(({ legendItems, onFocusClick, onClickItem, onHoverItem }) => {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <Popover
        align="center"
        side="left"
        className="flex max-h-[420px] max-w-[265px]! min-w-[240px] flex-col overflow-hidden px-0 py-0.5"
        // onOpenChange={setOpen}
        content={
          <OverflowPopoverContent
            legendItems={legendItems}
            onClickItem={onClickItem}
            onFocusClick={onFocusClick}
            onHoverItem={onHoverItem}
          />
        }
      >
        <div
          className={cn(
            'flex h-[24px] cursor-pointer items-center space-x-1.5 rounded-sm px-2 py-1',
            'hover:bg-item-hover'
          )}
        >
          <LegendItemDot type={'bar'} color={undefined} inactive={true} />
          <span className="text-sm text-nowrap select-none">Next {legendItems.length}</span>
        </div>
      </Popover>
    </span>
  );
});
OverflowButton.displayName = 'OverflowButton';

const OverflowPopoverContent = React.memo(
  ({
    legendItems,
    onClickItem,
    onFocusClick,
    onHoverItem,
  }: {
    legendItems: BusterChartLegendItem[];
    onClickItem: BusterChartLegendProps['onClickItem'];
    onFocusClick: BusterChartLegendProps['onFocusItem'];
    onHoverItem: BusterChartLegendProps['onHoverItem'];
  }) => {
    const parentRef = React.useRef<HTMLDivElement>(null);
    const hasHeadline = legendItems.some((item) => item.headline);

    const rowVirtualizer = useVirtualizer({
      count: legendItems.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => (hasHeadline ? 38 : 24), // Estimated height of each row
      overscan: 10,
    });

    return (
      <div ref={parentRef} className="max-h-[100%] w-full overflow-auto min-h-7">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = legendItems[virtualRow.index];
            if (!item) return null;
            return (
              <div
                key={item.id + item.serieName}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="p-0.5"
              >
                <LegendItem
                  item={item}
                  onClickItem={onClickItem}
                  onFocusItem={onFocusClick}
                  onHoverItem={onHoverItem}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

OverflowPopoverContent.displayName = 'OverflowPopoverContent';
