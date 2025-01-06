import { ChartType, Chart, Plugin } from 'chart.js';

export interface ChartHoverLinePluginOptions {
  lineWidth: number;
  lineColor: string;
  lineDash?: number[];
}

export const ChartHoverLinePlugin: Plugin<ChartType, ChartHoverLinePluginOptions> = {
  id: 'tooltipHoverLine',
  beforeDraw: (chart, args, options) => {
    const {
      ctx,
      tooltip,
      chartArea: { top, bottom }
    } = chart;
    const chartType = (chart.config as any).type as ChartType;
    if (chartType === 'line') {
      const tooltipActive = tooltip?.getActiveElements();

      if (tooltipActive && tooltipActive.length) {
        const activePoint = tooltipActive[0];
        const x = activePoint.element.x;
        const topY = top;
        const bottomY = bottom;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = options.lineWidth || 1;
        ctx.strokeStyle = options.lineColor;
        if (options.lineDash) {
          ctx.setLineDash(options.lineDash);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  defaults: {
    lineWidth: 1,
    lineColor: 'rgba(0,0,0,0.22)',
    lineDash: [5, 3]
  }
};
