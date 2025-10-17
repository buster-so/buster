import type { Chart, ChartType, Plugin } from 'chart.js';

export interface ChartHoverBarPluginOptions {
  //for bar chart
  hoverColor?: string;
  isDarkMode?: boolean;
}

declare module 'chart.js' {
  interface Chart {
    $pluginHoverBarManager: {
      enabled: boolean;
    };
  }
}

export const ChartHoverBarPlugin: Plugin<ChartType, ChartHoverBarPluginOptions> = {
  id: 'tooltipHoverBar',
  afterInit: (chart) => {
    const chartType = chart.config.type as ChartType;
    // Store whether this is a bar chart to avoid checking on every draw
    chart.$pluginHoverBarManager = {
      enabled:
        chartType === 'bar' ||
        (chartType === 'line' && chart.data.datasets.some((dataset) => dataset.type === 'bar')), //this line is for combo chart
    };
  },
  beforeDraw: (chart, _args, options) => {
    // Early return if not a bar chart (check only once during initialization)
    if (!chart.$pluginHoverBarManager?.enabled) return;

    const {
      ctx,
      tooltip,
      chartArea: { top, bottom },
      scales: { x },
    } = chart;

    const tooltipActive = tooltip?.getActiveElements();

    if (tooltipActive?.length) {
      const isHorizontal = isHorizontalChart(chart);
      const hoverColor =
        options.hoverColor || options.isDarkMode
          ? 'rgba(255, 255, 255, 0.095)'
          : 'rgba(0, 0, 0, 0.0275)';

      if (isHorizontal) {
        const activePoint = tooltipActive[0];
        const dataIndex = activePoint?.index ?? 0;
        ctx.save();
        ctx.fillStyle = hoverColor;
        const yPos = chart.scales.y?.getPixelForValue(dataIndex) ?? 0;
        const barHeight =
          (chart.scales.y?.getPixelForValue(1) ?? 0) - (chart.scales.y?.getPixelForValue(0) ?? 0);
        ctx.fillRect(
          chart.chartArea.left,
          yPos - barHeight / 2,
          chart.chartArea.right - chart.chartArea.left,
          barHeight
        );
        ctx.restore();
      } else {
        const activePoint = tooltipActive[0];
        const dataIndex = activePoint?.index ?? 0;
        ctx.save();
        ctx.fillStyle = hoverColor;
        const xPos = x?.getPixelForValue(dataIndex) ?? 0;
        const barWidth = (x?.getPixelForValue(1) ?? 0) - (x?.getPixelForValue(0) ?? 0);
        ctx.fillRect(xPos - barWidth / 2, top, barWidth, bottom - top);
        ctx.restore();
      }
    }
  },
  defaults: {
    isDarkMode: false,
  },
};

const isHorizontalChart = (chartInstance: Chart) => {
  return chartInstance.options.indexAxis === 'y';
};
