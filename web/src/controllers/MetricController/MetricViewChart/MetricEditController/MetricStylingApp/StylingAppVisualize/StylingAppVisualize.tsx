import type React from 'react';
import { StylingLabel } from '../Common';
import { SelectChartType } from './SelectChartType';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { SelectAxis } from './SelectAxis';
import {
  type YAxisConfig,
  type CategoryAxisStyleConfig,
  type Y2AxisConfig,
  ChartType,
  type MetricChartProps,
  type ChartEncodes
} from '@/api/asset_interfaces/metric/charts';
import type { ISelectAxisContext } from './SelectAxis/useSelectAxisContext';
import { StylingMetric } from './StylingMetric';
import { cn } from '@/lib/classMerge';

export const StylingAppVisualize: React.FC<
  {
    barLayout: IBusterMetricChartConfig['barLayout'];
    selectedAxis: ChartEncodes;
    className?: string;
    colors: string[];
    disableTooltip: IBusterMetricChartConfig['disableTooltip'];
  } & Required<YAxisConfig> &
    Required<CategoryAxisStyleConfig> &
    Required<Y2AxisConfig> &
    Omit<ISelectAxisContext, 'selectedAxis'> &
    Required<MetricChartProps>
> = ({ className, colors, ...props }) => {
  const {
    selectedChartType,
    barGroupType,
    lineGroupType,
    barLayout,
    metricColumnId,
    metricHeader,
    metricSubHeader,
    rowCount,
    metricValueAggregate,
    columnLabelFormats,
    columnMetadata,
    columnSettings,
    selectedAxis
  } = props;

  const isMetricChart = selectedChartType === ChartType.Metric;

  return (
    <div className={`flex h-full w-full flex-col space-y-3`}>
      <div className={className}>
        <StylingLabel label="Chart type">
          <SelectChartType
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barLayout={barLayout}
            barGroupType={barGroupType}
            colors={colors}
            columnMetadata={columnMetadata}
            columnSettings={columnSettings}
            selectedAxis={selectedAxis}
          />
        </StylingLabel>
      </div>

      {!isMetricChart && (
        <div className={cn(className, 'h-full')}>
          <SelectAxis {...props} />
        </div>
      )}

      {isMetricChart && (
        <StylingMetric
          className={className}
          columnLabelFormats={columnLabelFormats}
          metricColumnId={metricColumnId}
          metricHeader={metricHeader}
          metricSubHeader={metricSubHeader}
          metricValueAggregate={metricValueAggregate}
          columnMetadata={columnMetadata}
          rowCount={rowCount}
        />
      )}
    </div>
  );
};
