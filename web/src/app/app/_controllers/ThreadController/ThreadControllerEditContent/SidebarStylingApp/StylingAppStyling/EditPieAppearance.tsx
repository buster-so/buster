import React, { useMemo, useState } from 'react';
import { LabelAndInput } from '../Common';
import {
  DEFAULT_CHART_CONFIG,
  IBusterThreadMessageChartConfig,
  MIN_DONUT_WIDTH
} from '@/api/buster-rest';
import { InputNumber, Segmented, Slider } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { ChartEncodes } from '@/components/charts';

const options: { label: string; value: string }[] = [
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
    pieDonutWidth: IBusterThreadMessageChartConfig['pieDonutWidth'];
    onUpdateChartConfig: (config: Partial<IBusterThreadMessageChartConfig>) => void;
    pieChartAxis: IBusterThreadMessageChartConfig['pieChartAxis'];
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

    return (
      <>
        <LabelAndInput label="Appearance">
          <Segmented
            block
            className="w-full"
            options={options}
            defaultValue={selectedAppearance}
            disabled={hasMultipleYAxis}
            onChange={(value) => {
              setShowDonutWidthSelector(value === 'donut');
              if (value === 'donut') {
                setPieDonutWidth(DEFAULT_CHART_CONFIG.pieDonutWidth);
              } else {
                setPieDonutWidth(0);
              }
            }}
          />
        </LabelAndInput>

        {showDonutWidthSelector && !hasMultipleYAxis && (
          <LabelAndInput label="Donut width">
            <div className="flex items-center space-x-3">
              <InputNumber
                className="max-w-[50px]"
                min={DONUT_WIDTH_MIN}
                max={DONUT_WIDTH_MAX}
                value={value}
                onChange={setPieDonutWidth}
              />
              <Slider
                className="w-full"
                min={DONUT_WIDTH_MIN}
                max={DONUT_WIDTH_MAX}
                value={value}
                onChange={setPieDonutWidth}
              />
            </div>
          </LabelAndInput>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.pieChartAxis.y.length === nextProps.pieChartAxis.y.length;
  }
);
EditPieAppearance.displayName = 'EditPieAppearance';
