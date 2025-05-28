import { ColorPicker } from '@/components/ui/color-picker';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../Common';
import type { LoopTrendline } from './EditTrendline';
import { useMemoizedFn } from '@/hooks';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_TRENDLINE_CONFIG } from '@/api/asset_interfaces';

export const TrendlineColorPicker = React.memo(
  ({
    trend,
    colors,
    onUpdateExistingTrendline
  }: {
    trend: LoopTrendline;
    onUpdateExistingTrendline: (trend: LoopTrendline) => void;
    colors: string[];
  }) => {
    const { aggregateAllCategories, trendLineColor } = trend;
    const isInheritColor = trendLineColor === 'inherit' && !aggregateAllCategories;
    const isInvalidInheritColor = trendLineColor === 'inherit' && aggregateAllCategories;

    const onChangeComplete = useMemoizedFn((color: string) => {
      const hexColor = color;
      onUpdateExistingTrendline({ ...trend, trendLineColor: hexColor });
    });

    const handleInheritColorChange = useMemoizedFn((checked: boolean) => {
      onUpdateExistingTrendline({ ...trend, trendLineColor: checked ? 'inherit' : '#000000' });
    });

    const pickerBackgroundImage = useMemo(() => {
      if (isInheritColor) {
        const colorsToUse = colors.slice(0, 4);
        return `repeating-linear-gradient(90deg, ${colorsToUse
          .map((color, index) => `${color} ${index * 25}%, ${color} ${(index + 1) * 25}%`)
          .join(', ')})`;
      }
      return undefined;
    }, [colors, isInheritColor]);

    return (
      <LabelAndInput label="Color">
        <div className="flex w-full items-center justify-end">
          <ColorPicker
            size="small"
            showInput={!isInheritColor}
            showPicker={!isInheritColor}
            pickerBackgroundImage={pickerBackgroundImage}
            value={
              isInvalidInheritColor
                ? DEFAULT_TRENDLINE_CONFIG.trendLineColor
                : trend.trendLineColor || DEFAULT_TRENDLINE_CONFIG.trendLineColor
            }
            onChangeComplete={onChangeComplete}>
            {!aggregateAllCategories && (
              <LabelAndInput label="Inherit color">
                <div className="flex w-full items-center justify-end">
                  <Switch checked={isInheritColor} onCheckedChange={handleInheritColorChange} />
                </div>
              </LabelAndInput>
            )}
          </ColorPicker>
        </div>
      </LabelAndInput>
    );
  }
);
TrendlineColorPicker.displayName = 'TrendlineColorPicker';
