import { ChartType, Plugin } from 'chart.js';

export interface ChartHoverScatterPluginOptions {
  color?: string;
  lineWidth?: number;
  lineDash?: number[];
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    hoverScatter?: ChartHoverScatterPluginOptions | false;
  }

  interface Chart {
    $pluginHoverScatterManager: {
      enabled: boolean;
    };
  }
}

export const ChartHoverScatterPlugin: Plugin<ChartType, ChartHoverScatterPluginOptions> = {
  id: 'tooltipHoverScatter',
  afterInit: (chart) => {
    const chartType = chart.config.type as ChartType;
    chart.$pluginHoverScatterManager = {
      enabled: chartType === 'scatter' || chartType === 'bubble'
    };
  },
  defaults: {
    color: 'rgba(0,0,0,0.6)',
    lineWidth: 0.65,
    lineDash: [3, 3]
  },

  beforeDraw: (chart, args, options) => {
    if (!chart.$pluginHoverScatterManager.enabled) return;

    const { ctx, chartArea } = chart;

    // Get mouse position from chart
    const activeElements = chart.getActiveElements();
    if (activeElements.length === 0) return;

    const activePoint = activeElements[0];
    const { x, y } = activePoint.element;

    // Draw crosshair
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = options.lineWidth || 1;
    ctx.strokeStyle = options.color || '#666';
    ctx.setLineDash(options.lineDash || [5, 5]);

    // Vertical line
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);

    // Horizontal line
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);

    ctx.stroke();
    ctx.restore();
  }
};
