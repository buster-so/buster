import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import type { IColorTheme } from './interfaces';
import { ThemeColorDots } from './ThemeColorDots';
import { Dots } from '../../../ui/icons';
import { Button } from '../../../ui/buttons';
import { Popover } from '../../../ui/popover';

export const ThemeList: React.FC<{
  themes: Required<IColorTheme>[];
  className?: string;
  onChangeColorTheme: (theme: IColorTheme) => void;
  themeThreeDotsMenu?: React.FC<{ theme: IColorTheme }>;
}> = ({ themes, className, themeThreeDotsMenu, onChangeColorTheme }) => {
  return (
    <div
      className={cn(
        'bg-item-select rounded-sm border p-1',
        'flex w-full flex-col space-y-0.5 overflow-y-auto',
        className
      )}>
      {themes.map((theme) => (
        <ColorOption
          key={theme.id}
          theme={theme}
          selected={theme.selected}
          onChangeColorTheme={onChangeColorTheme}
          threeDotMenu={theme.hideThreeDotMenu ? undefined : themeThreeDotsMenu}
        />
      ))}
    </div>
  );
};

const ColorOption: React.FC<{
  theme: IColorTheme;
  selected: boolean;
  threeDotMenu?: React.FC<{ theme: IColorTheme }>;
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ theme, selected, threeDotMenu, onChangeColorTheme }) => {
  const { name, colors } = theme;

  const ThreeDotMenuComponent = threeDotMenu;

  return (
    <div
      onClick={() => {
        onChangeColorTheme(theme);
      }}
      data-testid={`color-theme-${name}`}
      data-selected={selected}
      className={cn(
        'flex w-full items-center justify-between space-x-2.5 overflow-hidden',
        'h-7 min-h-7 cursor-pointer rounded-sm px-3 py-2',
        selected ? 'bg-background border' : 'bg-item-active hover:bg-nav-item-hover'
      )}>
      <Text truncate variant={selected ? 'default' : 'secondary'}>
        {name}
      </Text>

      <div className="flex items-center gap-x-1">
        <ThemeColorDots selected={selected} colors={colors} />

        {ThreeDotMenuComponent && (
          <div onClick={(e) => e.stopPropagation()}>
            <Popover
              className="p-0"
              content={<ThreeDotMenuComponent theme={theme} />}
              trigger="click">
              <Button variant={'ghost'} size={'small'} prefix={<Dots />}></Button>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
});
ColorOption.displayName = 'ColorOption';
