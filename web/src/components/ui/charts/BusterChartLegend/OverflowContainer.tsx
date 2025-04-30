import { Popover } from '@/components/ui/popover/Popover';
import React from 'react';
import { BusterChartLegendItem, BusterChartLegendProps } from './interfaces';
import { LegendItem } from './LegendItem';
import { cn } from '@/lib/classMerge';
import { LegendItemDot } from './LegendDot';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { useVirtualizer } from '@tanstack/react-virtual';

export const OverflowButton: React.FC<{
  legendItems: BusterChartLegendItem[];
  onFocusClick?: BusterChartLegendProps['onFocusItem'];
  onClickItem?: BusterChartLegendProps['onClickItem'];
  onHoverItem?: BusterChartLegendProps['onHoverItem'];
}> = React.memo(({ legendItems, onFocusClick, onClickItem, onHoverItem }) => {
  return (
    <Popover
      align="center"
      side="left"
      className="flex max-h-[420px] max-w-[265px]! min-w-[240px] flex-col overflow-hidden px-0 py-0.5"
      content={
        <OverflowPopoverContent
          legendItems={legendItems}
          onClickItem={onClickItem}
          onFocusClick={onFocusClick}
          onHoverItem={onHoverItem}
        />
      }>
      <div
        className={cn(
          'flex h-[24px] cursor-pointer items-center space-x-1.5 rounded-sm px-2 py-1',
          'hover:bg-item-hover'
        )}>
        <LegendItemDot type={ChartType.Bar} color={undefined} inactive={true} />
        <span className="text-sm text-nowrap select-none">Next {legendItems.length}</span>
      </div>
    </Popover>
  );
});
OverflowButton.displayName = 'OverflowButton';

const OverflowPopoverContent = React.memo(
  ({
    legendItems,
    onClickItem,
    onFocusClick,
    onHoverItem
  }: {
    legendItems: BusterChartLegendItem[];
    onClickItem: BusterChartLegendProps['onClickItem'];
    onFocusClick: BusterChartLegendProps['onFocusItem'];
    onHoverItem: BusterChartLegendProps['onHoverItem'];
  }) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
      count: legendItems.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 24, // Estimated height of each row
      overscan: 15
    });

    return (
      <div
        ref={parentRef}
        style={{
          maxHeight: `100%`,
          width: `100%`,
          overflow: 'auto'
        }}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = legendItems[virtualRow.index];
            return (
              <div
                key={item.id + item.serieName}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="p-0.5">
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
