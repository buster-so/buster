import { cva, type VariantProps } from 'class-variance-authority';
import uniq from 'lodash/uniq';
import React, { useMemo } from 'react';
import { cn } from '@/lib/classMerge';
import Target from '../OtherComponents/Target';
import type { BusterChartLegendItem } from './interfaces';

const itemVariants = cva(
  'dot group relative flex items-center justify-center transition-all duration-300',
  {
    variants: {
      size: {
        sm: 'w-2 h-4',
        default: 'w-4 h-4',
      },
    },
  }
);

const dotVariants = cva('bg-border transition-colors duration-100', {
  variants: {
    size: {
      sm: '',
      default: '',
    },
    type: {
      bar: 'w-4.5 h-4 rounded-sm',
      line: 'w-4.5 h-1 rounded-sm',
      scatter: 'w-4 h-4 rounded-full',
    },
  },

  compoundVariants: [
    {
      size: 'sm',
      type: 'bar',
      className: 'w-2 h-2 rounded-[1.5px]',
    },
    {
      size: 'sm',
      type: 'line',
      className: 'w-2 h-0.5 rounded-1.5px',
    },
    {
      size: 'sm',
      type: 'scatter',
      className: 'w-2 h-2',
    },
  ],
});

export const LegendItemDot: React.FC<
  {
    color: string | string[] | undefined;
    inactive: boolean;
    type: BusterChartLegendItem['type'];
    onFocusItem?: (() => void) | undefined;
  } & VariantProps<typeof itemVariants>
> = React.memo(({ color, type, inactive, onFocusItem, size = 'default' }) => {
  const hasFocusItem = onFocusItem !== undefined;

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      onFocusItem();
    }
  };

  const onFocusItemPreflight = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onFocusItem) {
      e.stopPropagation();
      e.preventDefault();
      onFocusItem();
    }
  };

  const dotStyle = useMemo(() => {
    if (type === 'line') return dotVariants({ size, type: 'line' });
    if (type === 'scatter') return dotVariants({ size, type: 'scatter' });
    return dotVariants({ size, type: 'bar' });
  }, [type, size]);

  const buttonStyle = useButtonColor(color, inactive);

  return (
    <div className={cn(itemVariants({ size }))} data-testid="legend-dot-container">
      <button
        type="button"
        onClick={onClick}
        data-testid="legend-dot"
        className={cn('cursor-pointer', dotStyle, {
          'group-hover:opacity-0': hasFocusItem,
        })}
        style={buttonStyle}
      />
      {hasFocusItem && (
        <button
          type="button"
          onClick={onFocusItemPreflight}
          className="absolute hidden h-full w-full cursor-pointer items-center justify-center overflow-hidden group-hover:flex"
        >
          <div
            data-testid="focus-target"
            className="focus-item group-hover:bg-item-active flex h-full w-full items-center justify-center rounded-sm"
          >
            <div
              className={cn(
                'flex h-full w-full items-center justify-center overflow-hidden text-[11px]'
              )}
            >
              <Target />
            </div>
          </div>
        </button>
      )}
    </div>
  );
});
LegendItemDot.displayName = 'LegendItemDot';

const useButtonColor = (color: string | string[] | undefined, inactive: boolean) => {
  return useMemo(() => {
    if (inactive) return {};

    const isArrayColor = Array.isArray(color);

    if (isArrayColor && color && color.length > 0) {
      // Create a striped pattern with multiple colors

      const colorArray = uniq(color as string[]).slice(0, 4);
      const stripeWidth = 100 / colorArray.length;

      const gradientStops = colorArray.flatMap((colorValue, index) => {
        const start = index * stripeWidth;
        const end = (index + 1) * stripeWidth;
        return [`${colorValue} ${start}%`, `${colorValue} ${end}%`];
      });

      return {
        background: `linear-gradient(-45deg, ${gradientStops.join(', ')})`,
      };
    } else {
      // Single color
      return { backgroundColor: typeof color === 'string' ? color : undefined };
    }
  }, [color, inactive]);
};
