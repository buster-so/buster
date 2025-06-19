/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ChartType } from 'chart.js';
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

    // just for pie charts
    radius?: TType extends 'pie' ? number | string : never;
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
}
