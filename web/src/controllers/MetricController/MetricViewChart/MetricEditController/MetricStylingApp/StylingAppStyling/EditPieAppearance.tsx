import {
  DEFAULT_CHART_CONFIG,
  type IBusterMetricChartConfig,
  MIN_DONUT_WIDTH
} from '@/api/asset_interfaces';
import { InputNumber } from '@/components/ui/inputs';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { Slider, SliderWithInputNumber } from '@/components/ui/slider';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useState } from 'react';
import { LabelAndInput } from '../Common';

const options: SegmentedItem<'donut' | 'pie'>[] = [
  { label: 'Donut', value: 'donut' },
  { label: 'Pie', value: 'pie' }
];

const DONUT_WIDTH_MIN = MIN_DONUT_WIDTH;
const DONUT_WIDTH_MAX = 50;

export const EditPieAppearance = React.memo(
  ({
    pieDonutWidth,
    onUpdateChartConfig,
    pieChartAxis
  }: {
    pieDonutWidth: IBusterMetricChartConfig['pieDonutWidth'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
    pieChartAxis: IBusterMetricChartConfig['pieChartAxis'];
  }) => {
    const [showDonutWidthSelector, setShowDonutWidthSelector] = useState(pieDonutWidth > 0);
    const [value, setValue] = useState(pieDonutWidth);

    const hasMultipleYAxis = pieChartAxis.y.length > 1;

    const selectedAppearance = useMemo(() => {
      if (hasMultipleYAxis) return 'pie';
      return pieDonutWidth > 0 ? 'donut' : 'pie';
    }, [hasMultipleYAxis, pieDonutWidth]);

    const setPieDonutWidth = useMemoizedFn((value: number | null) => {
      onUpdateChartConfig({ pieDonutWidth: value || 0 });
      setValue(value || 0);
    });

    const onChange = useMemoizedFn((value: SegmentedItem<'donut' | 'pie'>) => {
      setShowDonutWidthSelector(value.value === 'donut');
      if (value.value === 'donut') {
        setPieDonutWidth(DEFAULT_CHART_CONFIG.pieDonutWidth);
      } else {
        setPieDonutWidth(0);
      }
    });

    const onChangeSlider = useMemoizedFn((value: number[]) => {
      setPieDonutWidth(value[0]);
    });

    return (
      <>
        <LabelAndInput label="Appearance">
          <AppSegmented
            block
            className="w-full"
            options={options}
            value={selectedAppearance}
            disabled={hasMultipleYAxis}
            onChange={onChange}
          />
        </LabelAndInput>

        {showDonutWidthSelector && !hasMultipleYAxis && (
          <LabelAndInput label="Donut width">
            <SliderWithInputNumber
              min={DONUT_WIDTH_MIN}
              max={DONUT_WIDTH_MAX}
              value={value}
              onChange={setPieDonutWidth}
            />
          </LabelAndInput>
        )}
      </>
    );
  }
);
EditPieAppearance.displayName = 'EditPieAppearance';
