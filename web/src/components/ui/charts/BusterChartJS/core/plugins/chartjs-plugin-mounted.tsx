import type { Chart, ChartType, Plugin } from 'chart.js';

export interface ChartMountedPluginOptions {
  onMounted?: (chart: Chart) => void;
  onInitialAnimationEnd?: (chart: Chart) => void;
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    chartMounted?: ChartMountedPluginOptions;
  }

  interface Chart {
    $mountedPlugin: boolean;
    $initialAnimationCompleted: boolean;
  }
}

export const ChartMountedPlugin: Plugin<ChartType, ChartMountedPluginOptions> = {
  id: 'chartMounted',
  afterInit: (chart, args, options) => {
    if (!chart || !options) return;
    options?.onMounted?.(chart);
    chart.$mountedPlugin = true;
  },
  afterRender: (chart, args, options) => {
    if (chart.$initialAnimationCompleted === undefined) {
      chart.$initialAnimationCompleted = true;
      // chart.update();
    }

    if (chart.$mountedPlugin || !chart || !options) return;
    const hasLabels = !!chart.data?.labels?.length;
    if (hasLabels && options?.onInitialAnimationEnd) {
      options?.onInitialAnimationEnd?.(chart);
      chart.$mountedPlugin = true;
    }
  },
  defaults: {
    onMounted: () => {},
    onInitialAnimationEnd: () => {}
  }
};
