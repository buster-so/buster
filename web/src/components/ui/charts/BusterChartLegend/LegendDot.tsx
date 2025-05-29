import { cva, type VariantProps } from 'class-variance-authority';
import React, { useMemo } from 'react';
import { ChartType } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { Target } from '../../icons';
import type { BusterChartLegendItem } from './interfaces';

const itemVariants = cva(
  'dot group relative flex items-center justify-center transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'w-2 h-3',
        default: 'w-4.5 h-3'
      }
    }
  }
);

const dotVariants = cva('bg-border transition-colors duration-100', {
  variants: {
    size: {
      sm: '',
      default: ''
    },
    type: {
      bar: 'w-4.5 h-3 rounded-sm',
      line: 'w-4.5 h-1 rounded-sm',
      scatter: 'w-3 h-3 rounded-full'
    }
  },

  compoundVariants: [
    {
      size: 'sm',
      type: 'bar',
      className: 'w-2 h-2 rounded-[1.5px]'
    },
    {
      size: 'sm',
      type: 'line',
      className: 'w-2 h-0.5 rounded-1.5px'
    },
    {
      size: 'sm',
      type: 'scatter',
      className: 'w-2 h-2'
    }
  ]
});

export const LegendItemDot: React.FC<
  {
    color: string | undefined;
    inactive: boolean;
    type: BusterChartLegendItem['type'];
    onFocusItem?: () => void;
  } & VariantProps<typeof itemVariants>
> = React.memo(({ color, type, inactive, onFocusItem, size = 'default' }) => {
  const hasFocusItem = onFocusItem !== undefined;

  const onClick = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      onFocusItem();
    }
  });

  const onFocusItemPreflight = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      e.preventDefault();
      onFocusItem();
    }
  });

  const dotStyle = useMemo(() => {
    if (type === ChartType.Line) return dotVariants({ size, type: 'line' });
    if (type === ChartType.Scatter) return dotVariants({ size, type: 'scatter' });
    return dotVariants({ size, type: 'bar' });
  }, [type, size]);

  return (
    <div className={cn(itemVariants({ size }))} data-testid="legend-dot-container">
      <button
        type="button"
        onClick={onClick}
        data-testid="legend-dot"
        className={cn(dotStyle, dotVariants({ size }), {
          'group-hover:opacity-0': hasFocusItem
        })}
        style={{ backgroundColor: !inactive ? color : undefined }}
      />
      {hasFocusItem && (
        <button
          type="button"
          onClick={onFocusItemPreflight}
          className="absolute hidden h-full w-full items-center justify-center overflow-hidden group-hover:flex">
          <div
            data-testid="focus-target"
            className="focus-item group-hover:bg-item-hover flex h-full w-full items-center justify-center rounded-sm">
            <div
              className={cn(
                'flex h-full w-full items-center justify-center overflow-hidden',
                size === 'sm' ? 'text2xs' : 'text2xs'
              )}>
              <Target />
            </div>
          </div>
        </button>
      )}
    </div>
  );
});
LegendItemDot.displayName = 'LegendItemDot';
