import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { ChartType, type ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { ChartBarAxisX, ChartLine, ChartScatter } from '@/components/ui/icons';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options = [
  {
    icon: <ChartBarAxisX />,
    value: 'bar',
    tooltip: 'Bar'
  },
  {
    icon: <ChartLine />,
    value: 'line',
    tooltip: 'Line'
  },
  // {
  //   icon: <AppMaterialIcons icon="line_chart_area" data-value="area" />,
  //   value: 'area',
  //   tooltip: 'Area'
  // },
  {
    icon: <ChartScatter />,
    value: 'dot',
    tooltip: 'Dot'
  }
].map<SegmentedItem<string>>(({ tooltip, icon, ...option }) => ({
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
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
}> = React.memo(({ columnVisualization, onUpdateColumnSettingConfig, selectedChartType }) => {
  const selectedOption = useMemo(() => {
    if (selectedChartType === ChartType.Bar) return 'bar';
    if (selectedChartType === ChartType.Line) return 'line';
    return options.find((option) => option.value === columnVisualization)?.value || 'bar';
  }, [columnVisualization]);

  const onChange = useMemoizedFn((value: SegmentedItem<string>) => {
    onUpdateColumnSettingConfig({
      columnVisualization: value.value as Required<ColumnSettings>['columnVisualization']
    });
  });

  return (
    <LabelAndInput label="Display as">
      <div className="flex justify-end">
        <AppSegmented options={options} type="button" value={selectedOption} onChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditDisplayAs.displayName = 'EditDisplayAs';
