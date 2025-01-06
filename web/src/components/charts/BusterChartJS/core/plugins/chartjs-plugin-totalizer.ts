import { ChartType, Chart, Plugin } from 'chart.js';

export interface ChartTotalizerPluginOptions {
  enabled?: boolean;
}

export interface TotalizerChart extends Chart {
  $totalizer: { stackTotals: Record<number, number>; seriesTotals: number[] };
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    totalizer?: ChartTotalizerPluginOptions | false;
  }

  interface Chart {
    $totalizer: { stackTotals: Record<number, number>; seriesTotals: number[] };
  }
}

export const ChartTotalizerPlugin: Plugin<ChartType, ChartTotalizerPluginOptions> = {
  id: 'totalizer',
  start: function (chart) {
    chart.$totalizer = { stackTotals: {}, seriesTotals: [] };
  },
  stop: function (chart) {
    chart.$totalizer = { stackTotals: {}, seriesTotals: [] };
  },
  beforeUpdate: (_chart, args, options) => {
    if (options?.enabled === false) return;

    const chart = _chart as TotalizerChart;
    const stackTotals: Record<string, number> = {};
    const seriesTotals: number[] = [];

    chart.data.datasets
      //  .filter((dataset) => !dataset.hidden && !dataset.isTrendline)
      .forEach((dataset, datasetIndex) => {
        (chart.data.labels as string[])?.forEach((label, labelIndex) => {
          const value = dataset.data[labelIndex];
          if (typeof value === 'number') {
            stackTotals[labelIndex] = (stackTotals[labelIndex] || 0) + value;
          }
        });

        const seriesTotal: number = dataset.data.reduce<number>(
          (sum, value) => sum + (typeof value === 'number' ? value : 0),
          0
        );

        seriesTotals.push(seriesTotal);
      });

    chart.$totalizer = { stackTotals, seriesTotals };
  },
  defaults: {
    enabled: true
  }
};
