import {
  ChartType,
  Plugin,
  CartesianScaleTypeRegistry,
  ScaleOptionsByType,
  ChartTypeRegistry
} from 'chart.js';
import { OutLabelsOptions, TextCenterPluginOptions } from '../BusterPieChartJs/plugins';
import { ChartHoverBarPluginOptions } from '../core/plugins';
import { TrendlineLinearOptions } from '../core/plugins/chartjs-plugin-trendline';
import { Options } from 'chartjs-plugin-datalabels/types';

declare module 'chart.js' {
  interface ChartDatasetProperties<TType extends ChartType, TData> {
    tooltipHoverBar?: ChartHoverBarPluginOptions;
    isTrendline?: boolean;
    tooltipData: {
      key: string;
      value: string | number | boolean | null;
      categoryValue?: string;
    }[][];
    xAxisKeys: string[];
    yAxisKey: string; //this is the key of the y axis
  }

  interface PluginOptionsByType<TType extends ChartType> {
    tooltipHoverBar?: ChartHoverBarPluginOptions;
  }

  interface ChartConfiguration<TType extends ChartType = ChartType> {
    type: TType;
  }

  interface ChartConfigurationCustomTypesPerDataset<TType extends ChartType = ChartType> {
    type: TType;
  }

  interface CoreChartOptions<TType extends ChartType> {
    //
  }
}
