import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { ChartEncodes, ScatterAxis } from '@/api/asset_interfaces/metric/charts';
import { useLegendAutoShow } from '@/components/ui/charts/BusterChartLegend';

export const EditShowLegend: React.FC<{
  showLegend: IBusterMetricChartConfig['showLegend'];
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  selectedAxis: ChartEncodes;
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
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
            checked={showLegend ?? false}
            onCheckedChange={(v) => onUpdateChartConfig({ showLegend: v })}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditShowLegend.displayName = 'EditShowLegend';
