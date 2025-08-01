import type { ChartEncodes } from '@buster/server-shared/metrics';
import React from 'react';
import type { BusterChartProps } from '../BusterChart.types';
import { BusterChartLegendWrapper } from '../BusterChartLegend/BusterChartLegendWrapper';
import type { DatasetOptionsWithTicks } from '../chartHooks';
import type { ChartJSOrUndefined } from './core/types';
import { useBusterChartJSLegend } from './hooks';

interface BusterChartJSLegendWrapperProps {
  children: React.ReactNode;
  animateLegend?: boolean;
  loading: boolean;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes | undefined;
  chartMounted: boolean;
  showLegend: BusterChartProps['showLegend'];
  showLegendHeadline: BusterChartProps['showLegendHeadline'];
  className: string | undefined;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  colors: NonNullable<BusterChartProps['colors']>;
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  datasetOptions: DatasetOptionsWithTicks;
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']>;
  isDownsampled: boolean;
  numberOfDataPoints: number;
}

export const BusterChartJSLegendWrapper = React.memo<BusterChartJSLegendWrapperProps>(
  ({
    children,
    className = '',
    loading,
    showLegend: showLegendProp,
    chartMounted,
    columnLabelFormats,
    selectedAxis,
    chartRef,
    selectedChartType,
    animateLegend: animateLegendProp = false,
    columnSettings,
    columnMetadata,
    showLegendHeadline,
    lineGroupType,
    barGroupType,
    colors,
    datasetOptions,
    pieMinimumSlicePercentage,
    isDownsampled,
    numberOfDataPoints
  }) => {
    const {
      renderLegend,
      legendItems,
      inactiveDatasets,
      onHoverItem,
      onLegendItemClick,
      onLegendItemFocus,
      showLegend,
      isUpdatingChart,
      animateLegend
    } = useBusterChartJSLegend({
      selectedAxis,
      columnLabelFormats,
      chartMounted,
      chartRef,
      selectedChartType,
      showLegend: showLegendProp,
      showLegendHeadline,
      columnSettings,
      columnMetadata,
      lineGroupType,
      barGroupType,
      colors,
      loading,
      datasetOptions,
      pieMinimumSlicePercentage,
      numberOfDataPoints,
      animateLegend: animateLegendProp
    });

    return (
      <BusterChartLegendWrapper
        className={className}
        animateLegend={animateLegend}
        renderLegend={renderLegend}
        legendItems={legendItems}
        showLegend={showLegend}
        isDownsampled={isDownsampled}
        showLegendHeadline={showLegendHeadline}
        inactiveDatasets={inactiveDatasets}
        onHoverItem={onHoverItem}
        onLegendItemClick={onLegendItemClick}
        onLegendItemFocus={onLegendItemFocus}
        isUpdatingChart={isUpdatingChart}>
        {children}
      </BusterChartLegendWrapper>
    );
  }
);

BusterChartJSLegendWrapper.displayName = 'BusterChartJSLegendWrapper';
