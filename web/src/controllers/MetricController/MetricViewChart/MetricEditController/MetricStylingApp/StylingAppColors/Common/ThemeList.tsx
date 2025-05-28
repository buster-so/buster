import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import React from 'react';
import { ThemeColorDots } from './ThemeColorDots';
import type { IColorTheme } from './interfaces';

export const ThemeList: React.FC<{
  themes: {
    selected: boolean;
    name: string;
    colors: string[];
  }[];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = ({ themes, onChangeColorTheme }) => {
  return (
    <div
      className={cn(
        'bg-item-select rounded-sm border p-1',
        'flex w-full flex-col space-y-0.5 overflow-y-auto'
      )}>
      {themes.map((theme) => (
        <ColorOption
          key={theme.name}
          theme={theme}
          selected={theme.selected}
          onChangeColorTheme={onChangeColorTheme}
        />
      ))}
    </div>
  );
};

const ColorOption: React.FC<{
  theme: IColorTheme;
  selected: boolean;
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ theme, selected, onChangeColorTheme }) => {
  const { name, colors } = theme;

  return (
    <div
      onClick={() => onChangeColorTheme(theme)}
      className={cn(
        'flex w-full items-center justify-between space-x-2.5 overflow-hidden',
        'cursor-pointer rounded-sm px-3 py-2',
        selected ? 'bg-background border' : 'bg-item-active hover:bg-nav-item-hover'
      )}>
      <Text truncate variant={selected ? 'default' : 'secondary'}>
        {name}
      </Text>

      <ThemeColorDots selected={selected} colors={colors} />
    </div>
  );
});
ColorOption.displayName = 'ColorOption';
