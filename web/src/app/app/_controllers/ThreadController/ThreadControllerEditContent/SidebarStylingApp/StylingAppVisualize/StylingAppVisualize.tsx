import React from 'react';
import { StylingLabel } from '../Common';
import { SelectChartType } from './SelectChartType';
import { IBusterThreadMessageChartConfig } from '@/api/busterv2/threads/threadConfigInterfaces';
import { SelectAxis } from './SelectAxis';
import {
  YAxisConfig,
  XAxisConfig,
  CategoryAxisStyleConfig,
  Y2AxisConfig,
  ChartType,
  MetricChartProps,
  ChartEncodes
} from '@/components/charts';
import { ISelectAxisContext } from './SelectAxis/useSelectAxisContext';
import { StylingMetric } from './StylingMetric';

export const StylingAppVisualize: React.FC<
  {
    barLayout: IBusterThreadMessageChartConfig['barLayout'];
    selectedView: IBusterThreadMessageChartConfig['selectedView'];
    selectedAxis: ChartEncodes;
    className?: string;
    colors: string[];
    disableTooltip: IBusterThreadMessageChartConfig['disableTooltip'];
  } & Required<YAxisConfig> &
    Required<XAxisConfig> &
    Required<CategoryAxisStyleConfig> &
    Required<Y2AxisConfig> &
    Omit<ISelectAxisContext, 'selectedAxis'> &
    Required<MetricChartProps>
> = ({ selectedView, className, colors, ...props }) => {
  const {
    selectedChartType,
    barGroupType,
    lineGroupType,
    barLayout,
    metricColumnId,
    metricHeader,
    metricSubHeader,
    metricValueLabel,
    metricValueAggregate,
    columnLabelFormats,
    columnMetadata,
    columnSettings,
    selectedAxis
  } = props;

  const isMetricChart = selectedChartType === ChartType.Metric;

  return (
    <div className={`flex w-full flex-col space-y-3`}>
      <div className={className}>
        <StylingLabel label="Chart type">
          <SelectChartType
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barLayout={barLayout}
            selectedView={selectedView}
            barGroupType={barGroupType}
            colors={colors}
            columnMetadata={columnMetadata}
            columnSettings={columnSettings}
            selectedAxis={selectedAxis}
          />
        </StylingLabel>
      </div>

      {!isMetricChart && (
        <div className={className}>
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
          metricValueLabel={metricValueLabel}
          metricValueAggregate={metricValueAggregate}
          columnMetadata={columnMetadata}
        />
      )}
    </div>
  );
};
