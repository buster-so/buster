import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import type { IBusterThreadMessageChartConfig } from '@/api/buster_rest/threads/threadConfigInterfaces';
import { ChartEncodes, ScatterAxis } from '@/components/charts';
import { useLegendAutoShow } from '@/components/charts/BusterChartLegend';

export const EditShowLegend: React.FC<{
  showLegend: IBusterThreadMessageChartConfig['showLegend'];
  selectedChartType: IBusterThreadMessageChartConfig['selectedChartType'];
  selectedAxis: ChartEncodes;
  onUpdateChartConfig: (chartConfig: Partial<IBusterThreadMessageChartConfig>) => void;
}> = React.memo(
  ({ showLegend: showLegendProp, selectedAxis, selectedChartType, onUpdateChartConfig }) => {
    const categoryAxisColumnNames = (selectedAxis as ScatterAxis)?.category;
    const allYAxisColumnNames = (selectedAxis as ScatterAxis)?.y;

    const showLegend = useLegendAutoShow({
      selectedChartType,
      showLegendProp,
      categoryAxisColumnNames,
      allYAxisColumnNames
    });

    return (
      <LabelAndInput label={'Show legend'}>
        <div className="flex justify-end">
          <Switch
            defaultChecked={showLegend ?? false}
            defaultValue={showLegend}
            onChange={(v) => onUpdateChartConfig({ showLegend: v })}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => true
);
EditShowLegend.displayName = 'EditShowLegend';
