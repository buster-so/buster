import React, { useMemo } from 'react';
import { BusterChartProps, ChartEncodes } from '../interfaces';
import { ChartJSOrUndefined } from './core/types';
import { useBusterChartJSLegend } from './hooks';
import { BusterChartLegendWrapper } from '../BusterChartLegend/BusterChartLegendWrapper';
import { DatasetOption } from '../chartHooks';

interface BusterChartJSLegendWrapperProps {
  children: React.ReactNode;
  animate: boolean;
  loading: boolean;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes | undefined;
  chartMounted: boolean;
  showLegend: BusterChartProps['showLegend'] | undefined;
  showLegendHeadline: BusterChartProps['showLegendHeadline'];
  className: string | undefined;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  colors: NonNullable<BusterChartProps['colors']>;
  chartRef: React.RefObject<ChartJSOrUndefined>;
  datasetOptions: DatasetOption[];
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']>;
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
    animate,
    columnSettings,
    columnMetadata,
    showLegendHeadline,
    lineGroupType,
    barGroupType,
    colors,
    datasetOptions,
    pieMinimumSlicePercentage
  }) => {
    const {
      renderLegend,
      legendItems,
      inactiveDatasets,
      onHoverItem,
      onLegendItemClick,
      onLegendItemFocus,
      showLegend
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
      pieMinimumSlicePercentage
    });

    return (
      <BusterChartLegendWrapper
        className={className}
        animate={animate}
        renderLegend={renderLegend}
        legendItems={legendItems}
        showLegend={showLegend}
        showLegendHeadline={showLegendHeadline}
        inactiveDatasets={inactiveDatasets}
        onHoverItem={onHoverItem}
        onLegendItemClick={onLegendItemClick}
        onLegendItemFocus={onLegendItemFocus}>
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          {children}
        </div>
      </BusterChartLegendWrapper>
    );
  }
);

BusterChartJSLegendWrapper.displayName = 'BusterChartJSLegendWrapper';
