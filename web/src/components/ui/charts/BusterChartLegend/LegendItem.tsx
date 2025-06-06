import { AnimatePresence, motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/utils';
import type { BusterChartLegendItem, BusterChartLegendProps } from './interfaces';
import { LegendItemDot } from './LegendDot';

export const LegendItem: React.FC<{
  item: BusterChartLegendItem;
  onClickItem?: BusterChartLegendProps['onClickItem'];
  onFocusItem?: BusterChartLegendProps['onFocusItem'];
  onHoverItem?: BusterChartLegendProps['onHoverItem'];
}> = React.memo(({ item, onClickItem, onFocusItem: onFocusItemProp, onHoverItem }) => {
  const { inactive } = item;

  const onHoverItemPreflight = useMemoizedFn((hover: boolean) => {
    if (!inactive) onHoverItem?.(item, hover);
  });

  const onFocusItemHandler = useMemoizedFn(() => {
    if (onFocusItemProp) onFocusItemProp(item);
  });

  const onFocusItem = onFocusItemProp ? onFocusItemHandler : undefined;

  return (
    <LegendItemStandard
      onClickItem={onClickItem}
      onHoverItemPreflight={onHoverItemPreflight}
      onFocusItem={onFocusItem}
      item={item}
    />
  );
});
LegendItem.displayName = 'LegendItem';

const headlineTypeToText: Record<
  'current' | 'average' | 'total' | 'median' | 'min' | 'max',
  string
> = {
  current: 'Cur.',
  average: 'Avg.',
  total: 'Total',
  median: 'Med.',
  min: 'Min.',
  max: 'Max.'
};

const headlineAnimation = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: '20px' },
  exit: { opacity: 0, height: 0 }
};

const headlinePreTextAnimation = {
  initial: { opacity: 0, width: 0, marginRight: 0 },
  animate: { opacity: 1, width: 'auto', marginRight: '3px' },
  exit: { opacity: 0, width: 0, marginRight: 0 }
};

const LegendItemStandard = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      onClickItem: BusterChartLegendProps['onClickItem'];
      onHoverItemPreflight: (hover: boolean) => void;
      onFocusItem: (() => void) | undefined;
      item: BusterChartLegendItem;
    }
  >(({ onClickItem, onHoverItemPreflight, onFocusItem, item }, ref) => {
    const clickable = onClickItem !== undefined;
    const { formattedName, inactive, headline } = item;
    const hasHeadline = headline?.type;

    const headlinePreText = useMemo(() => {
      if (hasHeadline && headline.type) return headlineTypeToText[headline.type];
      return '';
    }, [hasHeadline, headline]);

    const onClickItemHandler = useMemoizedFn(() => {
      if (onClickItem) onClickItem(item);
    });

    const onMouseEnterHandler = useMemoizedFn(() => {
      if (onHoverItemPreflight) onHoverItemPreflight(true);
    });

    const onMouseLeaveHandler = useMemoizedFn(() => {
      if (onHoverItemPreflight) onHoverItemPreflight(false);
    });

    const itemWrapperAnimation = useMemo(() => {
      return {
        height: hasHeadline ? 38 : 24,
        borderRadius: hasHeadline ? 8 : 4
      };
    }, [hasHeadline]);

    return (
      <motion.div
        ref={ref}
        initial={false}
        animate={itemWrapperAnimation}
        onClick={onClickItemHandler}
        onMouseEnter={onMouseEnterHandler}
        onMouseLeave={onMouseLeaveHandler}
        className={cn(
          'flex h-[24px] flex-col justify-center space-y-0 rounded-sm px-2.5',
          clickable && 'transition-background hover:bg-item-hover cursor-pointer duration-100'
        )}>
        <AnimatePresence initial={false}>
          {hasHeadline && (
            <motion.div {...headlineAnimation} className="flex items-center space-x-1.5">
              <span
                className={cn(
                  'text-[15px] leading-none font-semibold!',
                  !inactive ? 'text-foreground' : 'text-text-secondary'
                )}>
                {headline?.titleAmount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn('flex flex-nowrap items-center space-x-1.5 whitespace-nowrap', {
            clickable: clickable
          })}>
          <LegendItemDot
            size={!hasHeadline ? 'default' : 'sm'}
            onFocusItem={onFocusItem}
            color={item.color}
            type={item.type}
            inactive={item.inactive}
          />

          <div
            className={cn(
              'flex max-w-[185px] items-center truncate text-base transition-all duration-100 select-none',
              !inactive ? 'text-foreground' : 'text-text-secondary'
            )}>
            <AnimatePresence mode="wait" initial={false}>
              {headlinePreText && (
                <motion.div
                  key={hasHeadline ? 'hasHeadline' : 'noHeadline'}
                  {...headlinePreTextAnimation}>
                  {headlinePreText}
                </motion.div>
              )}
            </AnimatePresence>

            <span>{formattedName}</span>
          </div>
        </div>
      </motion.div>
    );
  })
);
LegendItemStandard.displayName = 'LegendItemStandard';
