import React, { useMemo, useState } from 'react';
import { SidebarStylingAppSegments } from './config';
import { SidebarStylingAppSegment } from './SidebarStylingAppSegment';
import { StylingAppColors } from './StylingAppColors';
import { StylingAppStyling } from './StylingAppStyling';
import { StylingAppVisualize } from './StylingAppVisualize';
import { useBusterThreadMessage } from '@/context/Threads';
import { BarAndLineAxis, ChartEncodes, ChartType, ScatterAxis } from '@/components/charts';

export const SidebarStylingApp: React.FC<{
  showSkeletonLoader?: boolean;
  isReadOnly: boolean;
  threadId: string;
}> = ({ threadId }) => {
  const [segment, setSegment] = useState<SidebarStylingAppSegments>(
    SidebarStylingAppSegments.VISUALIZE
  );
  const { message: currentThreadMessage } = useBusterThreadMessage({ threadId });

  if (!currentThreadMessage) return null;

  const columnMetadata = currentThreadMessage?.data_metadata?.column_metadata || [];
  const chartConfig = currentThreadMessage.chart_config;
  const {
    selectedChartType,
    lineGroupType,
    barGroupType,
    barLayout,
    selectedView,
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
    disableTooltip
  } = chartConfig;

  const selectedAxis: ChartEncodes | null = getSelectedAxis(
    selectedChartType,
    comboChartAxis,
    pieChartAxis,
    scatterAxis,
    barAndLineAxis
  );

  return (
    <div className="flex h-full w-full flex-col pt-3">
      <SidebarStylingAppSegment
        className="px-4"
        segment={segment}
        setSegment={setSegment}
        selectedChartType={selectedChartType}
      />

      <div className="h-full overflow-y-auto pb-12">
        {segment === SidebarStylingAppSegments.VISUALIZE && (
          <StylingAppVisualize
            className="px-4 pt-3"
            key={selectedChartType}
            columnMetadata={columnMetadata}
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barGroupType={barGroupType}
            barLayout={barLayout}
            selectedView={selectedView}
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

        {segment === SidebarStylingAppSegments.STYLING && (
          <StylingAppStyling
            key={selectedChartType}
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
          />
        )}

        {segment === SidebarStylingAppSegments.COLORS && (
          <StylingAppColors key={selectedChartType} className="px-4" colors={colors} />
        )}
      </div>
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
