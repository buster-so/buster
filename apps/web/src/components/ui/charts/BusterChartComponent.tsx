import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { BusterChartJS } from './BusterChartJS';
import { useDatasetOptions } from './chartHooks';
import type {
  BusterChartComponentProps,
  BusterChartRenderComponentProps,
} from './interfaces/chartComponentInterfaces';

export const BusterChartComponent: React.FC<BusterChartRenderComponentProps> = ({
  data: dataProp,
  barSortBy,
  pieSortBy,
  pieMinimumSlicePercentage,
  trendlines,
  ...props
}) => {
  const {
    barGroupType,
    columnMetadata,
    lineGroupType,
    columnLabelFormats,
    selectedChartType,
    selectedAxis,
    colors,
  } = props;

  const {
    numberOfDataPoints,
    datasetOptions,
    y2AxisKeys,
    yAxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures,
    isDownsampled,
  } = useDatasetOptions({
    data: dataProp,
    selectedAxis,
    barSortBy,
    selectedChartType,
    pieMinimumSlicePercentage,
    columnLabelFormats,
    barGroupType,
    lineGroupType,
    trendlines,
    pieSortBy,
    columnMetadata,
    colors,
  });

  const chartProps: BusterChartComponentProps = {
    ...props,
    datasetOptions,
    pieMinimumSlicePercentage,
    y2AxisKeys,
    yAxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures,
    isDownsampled,
    numberOfDataPoints,
    trendlines,
  };

  return (
    <ClientOnly>
      <BusterChartJS {...chartProps} />
    </ClientOnly>
  );
};
