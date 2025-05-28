import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import isEqual from 'lodash/isEqual';
import React, { useMemo, useState } from 'react';
import type { IColorTheme } from '../Common';
import { ThemeList } from '../Common/ThemeList';
import { ColorStyleSegments } from './ColorStyleSegments';
import { COLORFUL_THEMES, ColorAppSegments, MONOCHROME_THEMES } from './config';

export const ColorsApp: React.FC<{
  colors: IBusterMetricChartConfig['colors'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
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
        selectedSegment={selectedSegment}
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
  colors: IBusterMetricChartConfig['colors'];
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
