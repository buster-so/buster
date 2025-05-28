'use client';

import type React from 'react';
import { useState } from 'react';
import { MetricStylingAppSegments } from './config';
import { MetricStylingAppSegment } from './MetricStylingAppSegment';
import { StylingAppColors } from './StylingAppColors';
import { StylingAppStyling } from './StylingAppStyling';
import { StylingAppVisualize } from './StylingAppVisualize';
import {
  type BarAndLineAxis,
  type ChartEncodes,
  ChartType,
  type ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { ScrollArea } from '@/components/ui/scroll-area';

export const MetricStylingApp: React.FC<{
  metricId: string;
}> = ({ metricId }) => {
  const [segment, setSegment] = useState<MetricStylingAppSegments>(
    MetricStylingAppSegments.VISUALIZE
  );
  const { data: chartConfig } = useGetMetric({ id: metricId }, { select: (x) => x.chart_config });
  const { data: metricData } = useGetMetricData({ id: metricId }, { enabled: false });

  if (!chartConfig) return null;

  const columnMetadata = metricData?.data_metadata?.column_metadata || [];
  const rowCount = metricData?.data_metadata?.row_count || 0;

  const {
    selectedChartType,
    lineGroupType,
    barGroupType,
    barLayout,
    columnLabelFormats,
    barAndLineAxis,
    scatterAxis,
    pieChartAxis,
    comboChartAxis,
    columnSettings,
    xAxisDataZoom,
    xAxisLabelRotation,
    xAxisShowAxisLabel,
    xAxisAxisTitle,
    yAxisScaleType,
    yAxisShowAxisLabel,
    yAxisAxisTitle,
    yAxisStartAxisAtZero,
    categoryAxisTitle,
    barShowTotalAtTop,
    y2AxisShowAxisLabel,
    y2AxisAxisTitle,
    y2AxisStartAxisAtZero,
    y2AxisScaleType,
    showLegend,
    showLegendHeadline,
    gridLines,
    goalLines,
    trendlines,
    barSortBy,
    pieDisplayLabelAs,
    pieLabelPosition,
    pieDonutWidth,
    pieInnerLabelAggregate,
    pieInnerLabelTitle,
    pieShowInnerLabel,
    pieMinimumSlicePercentage,
    colors,
    metricColumnId,
    metricHeader,
    metricSubHeader,
    metricValueLabel,
    metricValueAggregate,
    xAxisShowAxisTitle,
    yAxisShowAxisTitle,
    y2AxisShowAxisTitle,
    scatterDotSize,
    disableTooltip,
    pieSortBy
  } = chartConfig;

  const selectedAxis: ChartEncodes | null = getSelectedAxis(
    selectedChartType,
    comboChartAxis,
    pieChartAxis,
    scatterAxis,
    barAndLineAxis
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden pt-3">
      <MetricStylingAppSegment
        className="px-4"
        segment={segment}
        setSegment={setSegment}
        selectedChartType={selectedChartType}
      />
      {
        //this crazy css selector is so that the available section has a large dropzone
      }
      <ScrollArea className="h-full [&>div>div]:h-full!">
        {segment === MetricStylingAppSegments.VISUALIZE && (
          <StylingAppVisualize
            className="px-4 pt-3"
            columnMetadata={columnMetadata}
            rowCount={rowCount}
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barGroupType={barGroupType}
            barLayout={barLayout}
            columnLabelFormats={columnLabelFormats}
            columnSettings={columnSettings}
            selectedAxis={selectedAxis}
            xAxisAxisTitle={xAxisAxisTitle}
            xAxisDataZoom={xAxisDataZoom}
            xAxisLabelRotation={xAxisLabelRotation}
            xAxisShowAxisLabel={xAxisShowAxisLabel}
            yAxisAxisTitle={yAxisAxisTitle}
            yAxisShowAxisLabel={yAxisShowAxisLabel}
            yAxisStartAxisAtZero={yAxisStartAxisAtZero}
            yAxisScaleType={yAxisScaleType}
            categoryAxisTitle={categoryAxisTitle}
            barShowTotalAtTop={barShowTotalAtTop}
            y2AxisShowAxisLabel={y2AxisShowAxisLabel}
            y2AxisAxisTitle={y2AxisAxisTitle}
            y2AxisStartAxisAtZero={y2AxisStartAxisAtZero}
            y2AxisScaleType={y2AxisScaleType}
            showLegend={showLegend}
            showLegendHeadline={showLegendHeadline}
            gridLines={gridLines}
            goalLines={goalLines}
            trendlines={trendlines}
            metricColumnId={metricColumnId}
            metricHeader={metricHeader}
            metricSubHeader={metricSubHeader}
            metricValueLabel={metricValueLabel}
            metricValueAggregate={metricValueAggregate}
            colors={colors}
            yAxisShowAxisTitle={yAxisShowAxisTitle}
            xAxisShowAxisTitle={xAxisShowAxisTitle}
            y2AxisShowAxisTitle={y2AxisShowAxisTitle}
            disableTooltip={disableTooltip}
          />
        )}

        {segment === MetricStylingAppSegments.STYLING && (
          <StylingAppStyling
            className="px-4"
            columnSettings={columnSettings}
            showLegend={showLegend}
            gridLines={gridLines}
            yAxisShowAxisLabel={yAxisShowAxisLabel}
            yAxisShowAxisTitle={yAxisShowAxisTitle}
            barSortBy={barSortBy}
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barGroupType={barGroupType}
            yAxisScaleType={yAxisScaleType}
            y2AxisScaleType={y2AxisScaleType}
            showLegendHeadline={showLegendHeadline}
            goalLines={goalLines}
            trendlines={trendlines}
            pieDisplayLabelAs={pieDisplayLabelAs}
            pieLabelPosition={pieLabelPosition}
            pieDonutWidth={pieDonutWidth}
            pieInnerLabelAggregate={pieInnerLabelAggregate}
            pieInnerLabelTitle={pieInnerLabelTitle}
            pieShowInnerLabel={pieShowInnerLabel}
            pieMinimumSlicePercentage={pieMinimumSlicePercentage}
            pieChartAxis={pieChartAxis}
            scatterDotSize={scatterDotSize}
            selectedAxis={selectedAxis}
            columnMetadata={columnMetadata}
            columnLabelFormats={columnLabelFormats}
            barShowTotalAtTop={barShowTotalAtTop}
            rowCount={rowCount}
            pieSortBy={pieSortBy}
            colors={colors}
          />
        )}

        {segment === MetricStylingAppSegments.COLORS && (
          <StylingAppColors className="px-4" colors={colors} />
        )}
      </ScrollArea>
    </div>
  );
};

const getSelectedAxis = (
  selectedChartType: ChartType,
  comboChartAxis: ChartEncodes,
  pieChartAxis: ChartEncodes,
  scatterAxis: ScatterAxis,
  barAndLineAxis: BarAndLineAxis
) => {
  if (selectedChartType === ChartType.Combo) return comboChartAxis;
  if (selectedChartType === ChartType.Pie) return pieChartAxis;
  if (selectedChartType === ChartType.Scatter) return scatterAxis;
  if (selectedChartType === ChartType.Bar) return barAndLineAxis;
  if (selectedChartType === ChartType.Line) return barAndLineAxis;
  return barAndLineAxis;
};
