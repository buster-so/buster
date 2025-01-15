import { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads/threadConfigInterfaces';
import React, { MouseEventHandler, useMemo, useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { AppMaterialIcons, AppSegmented, AppTooltip } from '@/components';
import { Segmented, SegmentedProps } from 'antd';
import { ChartType, ColumnSettings } from '@/components/charts/interfaces';
import { SegmentedLabeledOption, SegmentedValue } from 'antd/es/segmented';
import { useMemoizedFn } from 'ahooks';
import { useEditAppSegmented } from './useEditAppSegmented';

const options: SegmentedLabeledOption<SegmentedValue>[] = [
  {
    icon: <AppMaterialIcons icon="bar_chart" data-value="bar" />,
    value: 'bar',
    tooltip: 'Bar'
  },
  {
    icon: <AppMaterialIcons icon="show_chart" data-value="line" />,
    value: 'line',
    tooltip: 'Line'
  },
  // {
  //   icon: <AppMaterialIcons icon="line_chart_area" data-value="area" />,
  //   value: 'area',
  //   tooltip: 'Area'
  // },
  {
    icon: <AppMaterialIcons icon="scatter_plot" data-value="dot" />,
    value: 'dot',
    tooltip: 'Dot'
  }
].map(({ tooltip, icon, ...option }) => ({
  ...option,
  icon: (
    <AppTooltip title={tooltip}>
      <span className="flex items-center justify-center">{icon}</span>
    </AppTooltip>
  )
}));

export const EditDisplayAs: React.FC<{
  columnVisualization: Required<ColumnSettings>['columnVisualization'];
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
}> = React.memo(({ columnVisualization, onUpdateColumnSettingConfig, selectedChartType }) => {
  const selectedOption = useMemo(() => {
    if (selectedChartType === ChartType.Bar) return 'bar';
    if (selectedChartType === ChartType.Line) return 'line';
    return options.find((option) => option.value === columnVisualization)?.value || 'bar';
  }, [columnVisualization]);

  const { onClick } = useEditAppSegmented({
    onClick: (value) => {
      onUpdateColumnSettingConfig({
        columnVisualization: value as Required<ColumnSettings>['columnVisualization']
      });
    }
  });

  return (
    <LabelAndInput label="Display as">
      <div className="flex justify-end">
        <AppSegmented
          options={options as SegmentedProps['options']}
          block={false}
          bordered={false}
          value={selectedOption}
          onClick={onClick}
        />
      </div>
    </LabelAndInput>
  );
});
EditDisplayAs.displayName = 'EditDisplayAs';
