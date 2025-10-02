import type {
  BarAndLineAxis,
  ChartConfigProps,
  ChartEncodes,
  ScatterAxis,
} from '@buster/server-shared/metrics';
import React from 'react';
import { useLegendAutoShow } from '@/components/ui/charts-shared/useLegendAutoShow';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditShowLegend: React.FC<{
  showLegend: ChartConfigProps['showLegend'];
  selectedChartType: ChartConfigProps['selectedChartType'];
  selectedAxis: ChartEncodes;
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = React.memo(
  ({ showLegend: showLegendProp, selectedAxis, selectedChartType, onUpdateChartConfig }) => {
    const categoryAxisColumnNames = (selectedAxis as ScatterAxis)?.category;
    const colorByColumnNames = (selectedAxis as BarAndLineAxis)?.colorBy;
    const allYAxisColumnNames = (selectedAxis as ScatterAxis)?.y;

    const showLegend = useLegendAutoShow({
      selectedChartType,
      showLegendProp,
      categoryAxisColumnNames,
      allYAxisColumnNames,
      colorByColumnNames,
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
