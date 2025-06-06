import type React from 'react';
import { cn } from '@/lib/classMerge';

export const ThemeColorDots: React.FC<{
  selected: boolean;
  colors: string[];
  numberOfColors?: number | 'all';
}> = ({ selected, colors, numberOfColors = 'all' }) => {
  const numberOfColorsToShow = numberOfColors === 'all' ? colors.length : numberOfColors;

  return (
    <div className="flex shrink-0 items-center gap-0">
      {colors.slice(0, numberOfColorsToShow).map((color, colorIdx) => (
        <div
          key={color + colorIdx}
          className={cn(
            'ball rounded-full',
            colorIdx > 0 && '-ml-0.5 h-2 w-2 shadow-[0_0_0_0.75px]',
            !selected ? 'shadow-item-select' : 'shadow-background'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};
ThemeColorDots.displayName = 'ThemeColorDots';
