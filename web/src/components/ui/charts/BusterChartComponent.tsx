import React, { useMemo } from 'react';
import {
  BusterChartComponentProps,
  BusterChartRenderComponentProps
} from './interfaces/chartComponentInterfaces';
import { BusterChartJS } from './BusterChartJS';
import { useDatasetOptions } from './chartHooks';

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
    selectedAxis
  } = props;
  const {
    datasetOptions,
    dataTrendlineOptions,
    y2AxisKeys,
    yAxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures
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
    columnMetadata
  });

  const chartProps: BusterChartComponentProps = useMemo(
    () => ({
      ...props,
      datasetOptions,
      pieMinimumSlicePercentage,
      dataTrendlineOptions,
      y2AxisKeys,
      yAxisKeys,
      tooltipKeys,
      hasMismatchedTooltipsAndMeasures
    }),
    [
      props,
      pieMinimumSlicePercentage,
      datasetOptions,
      dataTrendlineOptions,
      y2AxisKeys,
      yAxisKeys,
      hasMismatchedTooltipsAndMeasures,
      tooltipKeys
    ]
  );

  return <BusterChartJS {...chartProps} />;
};
