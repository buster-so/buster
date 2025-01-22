import React, { useMemo } from 'react';
import { ChartType } from '../../../interfaces/enum';
import type { PieSeriesOption, ScatterSeriesOption, SeriesOption } from 'echarts';
import { BarChartSeriesBuilder } from './BarChartSeriesBuilder';
import { ComboChartBuilder } from './ComboChartBuilder';
import { LineChartSeriesBuilder } from './LineChartSeriesBuilder';
import { PieChartBuilder } from './PieChartSeriesBuilder';
import { ScatterChartSeriesBuilder } from './ScatterChartSeriesBuilder';
import { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { useGoalLines } from './useGoalLines';
import { useTrendlines } from './useTrendlines';
import { TrendlineDataset } from '../../../chartHooks';

type _UseSeriesOptionsProps = Parameters<typeof PieChartBuilder>[0] &
  Parameters<typeof BarChartSeriesBuilder>[0] &
  Parameters<typeof LineChartSeriesBuilder>[0] &
  Parameters<typeof ComboChartBuilder>[0] &
  Parameters<typeof ScatterChartSeriesBuilder>[0] & {
    goalLines: IBusterThreadMessageChartConfig['goalLines'] | undefined;
    dataTrendlineOptions: TrendlineDataset[];
    selectedChartType: ChartType;
    y2AxisKeys: string[];
  };

type UseSeriesOptionsProps = Omit<_UseSeriesOptionsProps, 'y' | 'isY2Axis' | 'index'>;

type ChartBuilderProps = Omit<
  _UseSeriesOptionsProps,
  'goalLines' | 'trendlines' | 'dataTrendlineOptions'
>;

const ChartBuilderRecord: Record<
  ChartType,
  (
    args: ChartBuilderProps
  ) => SeriesOption | SeriesOption[] | PieSeriesOption[] | ScatterSeriesOption[]
> = {
  [ChartType.Pie]: PieChartBuilder,
  [ChartType.Bar]: BarChartSeriesBuilder,
  [ChartType.Line]: LineChartSeriesBuilder,
  [ChartType.Scatter]: ScatterChartSeriesBuilder,
  [ChartType.Combo]: ComboChartBuilder,
  [ChartType.Metric]: () => [], // This will not actually be used
  [ChartType.Table]: () => [] // This will not actually be used
};

export const useSeriesOptions = ({
  goalLines,
  dataTrendlineOptions,
  ...props
}: UseSeriesOptionsProps): SeriesOption[] => {
  const { yAxisKeys, y2AxisKeys, selectedChartType, selectedAxis, columnLabelFormats } = props;

  const seriesOptions = useMemo(() => {
    const yAxisSeries = yAxisKeys.flatMap((y, index) =>
      ChartBuilderRecord[selectedChartType]({ ...props, y, index })
    );

    const y2AxisSeries = y2AxisKeys.flatMap((y, index) =>
      ChartBuilderRecord[selectedChartType]({ ...props, y, index, isY2Axis: true })
    );

    return [...yAxisSeries, ...y2AxisSeries];
  }, [props]);

  const goalLineSeries = useGoalLines({
    yAxisKeys,
    columnLabelFormats,
    goalLines,
    selectedChartType
  });

  const seriesOptionsWithTrendlines = useTrendlines({
    selectedChartType,
    seriesOptions,
    columnLabelFormats,
    selectedAxis,
    dataTrendlineOptions
  });

  const allSeriesOptions = useMemo(() => {
    return [...seriesOptionsWithTrendlines, ...goalLineSeries];
  }, [seriesOptionsWithTrendlines, goalLineSeries]);

  return allSeriesOptions;
};
