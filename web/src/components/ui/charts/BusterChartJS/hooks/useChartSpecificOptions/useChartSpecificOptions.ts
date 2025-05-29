import { ChartType } from '@/api/asset_interfaces/metric/charts';
import type { ChartType as ChartJSChartType, PluginChartOptions } from 'chart.js';
import { useMemo } from 'react';
import type { DeepPartial } from 'utility-types';
import type { ChartProps } from '../../core';
import { barOptionsHandler, barPluginsHandler } from './barChartOptions';
import type { ChartSpecificOptionsProps, UseChartSpecificOptionsProps } from './interfaces';
import { pieOptionsHandler, piePluginsHandler } from './pieChartOptions';

export const useChartSpecificOptions = ({
  selectedChartType,
  ...props
}: UseChartSpecificOptionsProps): {
  chartPlugins: DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'];
  chartOptions: ChartProps<ChartJSChartType>['options'];
} => {
  const chartOptions = useMemo(() => {
    return chartTypeOptionsHandler[selectedChartType](props);
  }, [props]);

  const chartPlugins = useMemo(() => {
    return chartTypePluginsHandler[selectedChartType](props);
  }, [props]);

  return {
    chartPlugins,
    chartOptions
  };
};

const DEFAULT_OPTIONS: ChartProps<ChartJSChartType>['options'] = {};

const defaultHandler = (): ChartProps<ChartJSChartType>['options'] => DEFAULT_OPTIONS;

const chartTypeOptionsHandler: Record<
  ChartType,
  (props: ChartSpecificOptionsProps) => ChartProps<ChartJSChartType>['options']
> = {
  [ChartType.Pie]: pieOptionsHandler,
  [ChartType.Line]: defaultHandler,
  [ChartType.Scatter]: defaultHandler,
  [ChartType.Bar]: barOptionsHandler,
  [ChartType.Combo]: defaultHandler,
  [ChartType.Metric]: defaultHandler,
  [ChartType.Table]: defaultHandler
};

//********** PLUGINS ************ */

const DEFAULT_PLUGINS: DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins'] = {};

const defaultPluginsHandler = () => DEFAULT_PLUGINS;

const chartTypePluginsHandler: Record<
  ChartType,
  (props: ChartSpecificOptionsProps) => DeepPartial<PluginChartOptions<ChartJSChartType>>['plugins']
> = {
  [ChartType.Pie]: piePluginsHandler,
  [ChartType.Line]: defaultPluginsHandler,
  [ChartType.Scatter]: defaultPluginsHandler,
  [ChartType.Bar]: barPluginsHandler,
  [ChartType.Combo]: defaultPluginsHandler,
  [ChartType.Metric]: defaultPluginsHandler,
  [ChartType.Table]: defaultPluginsHandler
};
