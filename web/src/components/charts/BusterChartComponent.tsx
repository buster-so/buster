import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BusterChartComponentProps,
  BusterChartRenderComponentProps
} from './interfaces/chartComponentInterfaces';
import { BusterChartJS } from './BusterChartJS';
import { useDatasetOptions } from './chartHooks';
import { useMount } from 'ahooks';

// Dynamic import for BusterEChart with SSR disabled
const BusterEChart = dynamic(() => import('./BusterChartE').then((mod) => mod.BusterEChart), {
  ssr: false,
  loading: () => <></>
});

export const BusterChartComponent: React.FC<BusterChartRenderComponentProps> = ({
  renderType,
  data: dataProp,
  barSortBy,
  pieMinimumSlicePercentage,
  trendlines,
  ...props
}) => {
  const { barGroupType, lineGroupType, columnLabelFormats, selectedChartType, selectedAxis } =
    props;

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
    trendlines
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

  if (renderType === 'chartjs') {
    return <BusterChartJS {...chartProps} />;
  }

  return <BusterEChart {...chartProps} />;
};
