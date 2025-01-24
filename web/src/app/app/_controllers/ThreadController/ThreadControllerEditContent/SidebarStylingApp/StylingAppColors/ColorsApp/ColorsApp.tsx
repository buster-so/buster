import React, { useMemo, useState } from 'react';
import { ColorStyleSegments } from './ColorStyleSegments';
import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads';
import { ColorAppSegments, COLORFUL_THEMES, MONOCHROME_THEMES } from './config';
import isEqual from 'lodash/isEqual';
import { ThemeCarousel, IColorTheme } from '../Common';
import { useMemoizedFn } from 'ahooks';
import { Text } from '@/components/text';
import { ThemeList } from '../Common/ThemeList';
import { createStyles } from 'antd-style';

export const ColorsApp: React.FC<{
  colors: IBusterThreadMessageChartConfig['colors'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = ({ colors, onUpdateChartConfig }) => {
  const initialSelectedSegment = useMemo(() => {
    const isFromColorfulThemes = COLORFUL_THEMES.some((theme) => isEqual(theme.colors, colors));
    return isFromColorfulThemes ? ColorAppSegments.Colorful : ColorAppSegments.Monochrome;
  }, []);

  const [selectedSegment, setSelectedSegment] = useState<ColorAppSegments>(initialSelectedSegment);

  const selectedSegmentColors = useMemo(() => {
    return selectedSegment === ColorAppSegments.Colorful ? COLORFUL_THEMES : MONOCHROME_THEMES;
  }, [selectedSegment]);

  const onChangeColorTheme = useMemoizedFn((theme: IColorTheme) => {
    onUpdateChartConfig({ colors: theme.colors });
  });

  return (
    <div className="flex flex-col space-y-2">
      <ColorStyleSegments
        initialSelectedSegment={initialSelectedSegment}
        colors={colors}
        setSelectedSegment={setSelectedSegment}
      />

      <ColorPicker
        selectedSegmentColors={selectedSegmentColors}
        colors={colors}
        onChangeColorTheme={onChangeColorTheme}
      />
    </div>
  );
};

const ColorPicker: React.FC<{
  selectedSegmentColors: IColorTheme[];
  colors: IBusterThreadMessageChartConfig['colors'];
  onChangeColorTheme: (theme: IColorTheme) => void;
}> = React.memo(({ selectedSegmentColors, colors, onChangeColorTheme }) => {
  const themes = useMemo(() => {
    return selectedSegmentColors.map((theme) => ({
      ...theme,
      selected: isEqual(theme.colors, colors)
    }));
  }, [selectedSegmentColors, colors]);

  return <ThemeList themes={themes} onChangeColorTheme={onChangeColorTheme} />;
});
ColorPicker.displayName = 'ColorPicker';
