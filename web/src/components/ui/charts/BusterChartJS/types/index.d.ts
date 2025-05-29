import {
  CartesianScaleTypeRegistry,
  type ChartType,
  ChartTypeRegistry,
  Plugin,
  ScaleOptionsByType
} from 'chart.js';
import { Options } from 'chartjs-plugin-datalabels/types';
import { OutLabelsOptions, TextCenterPluginOptions } from '../BusterPieChartJs/plugins';
import type { ChartHoverBarPluginOptions } from '../core/plugins';

declare module 'chart.js' {
  interface ChartDatasetProperties<TType extends ChartType, TData> {
    tooltipHoverBar?: ChartHoverBarPluginOptions;
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
