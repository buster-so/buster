import type { Chart, ChartEvent, Plugin } from 'chart.js';

declare module 'chart.js' {
  interface Chart {
    $crosshair?: {
      x: number | null;
      y: number | null;
    };
  }
}

export interface CrosshairPluginOptions {
  lineColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  labelBackgroundColor?: string;
  labelFont?: string;
  labelFontColor?: string;
  labelHeight?: number;
}

const crosshairPlugin: Plugin<'line'> = {
  id: 'crosshairPlugin',

  defaults: {
    lineColor: 'rgba(102, 102, 102, 1)',
    lineWidth: 2,
    lineDash: [6, 6],
    labelBackgroundColor: 'rgba(102, 102, 102, 1)',
    labelFont: 'bold 12px sans-serif',
    labelFontColor: 'white',
    labelHeight: 24
  },

  // Initialize the crosshair state
  beforeInit(chart: Chart) {
    if (!chart) return;
    chart.$crosshair = { x: null, y: null };
  },

  // Capture mouse events to update the crosshair coordinates
  afterEvent(chart: Chart, args: { event: ChartEvent }) {
    if (!chart) return;
    const event = args.event;
    if (event.type === 'mousemove') {
      chart.$crosshair = chart.$crosshair || { x: null, y: null };
      chart.$crosshair.x = event.x;
      chart.$crosshair.y = event.y;
    } else if (event.type === 'mouseout') {
      if (chart.$crosshair) {
        chart.$crosshair.x = null;
        chart.$crosshair.y = null;
      }
    }
  },

  // Draw the crosshair lines and labels after the chart is rendered
  afterDraw(chart: Chart, args, options: CrosshairPluginOptions) {
    if (!chart) return;
    const {
      ctx,
      chartArea: { top, bottom, left, right }
    } = chart;
    const crosshair = chart.$crosshair;
    if (!crosshair || !ctx) return;
    const { x, y } = crosshair;

    // Only draw if the pointer is within the chart area
    if (x !== null && y !== null && x >= left && x <= right && y >= top && y <= bottom) {
      ctx.save();

      // Set common line styles
      ctx.strokeStyle = options.lineColor || 'rgba(102, 102, 102, 1)';
      ctx.lineWidth = options.lineWidth || 2;
      ctx.setLineDash(options.lineDash || [6, 6]);

      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
      ctx.closePath();

      // Draw horizontal line
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
      ctx.closePath();

      // Reset dash settings
      ctx.setLineDash([]);

      const LABEL_HEIGHT = options.labelHeight || 24;

      // Get the scales for label values
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;

      // --- Draw Y-Axis Label ---
      const yValue = yScale.getValueForPixel(y);
      const yLabel = yValue?.toFixed(2) || '';

      ctx.beginPath();
      ctx.fillStyle = options.labelBackgroundColor || 'rgba(102, 102, 102, 1)';
      // Draw label rectangle on left margin
      ctx.fillRect(0, y - LABEL_HEIGHT / 2, left, LABEL_HEIGHT);
      ctx.closePath();

      ctx.font = options.labelFont || 'bold 12px sans-serif';
      ctx.fillStyle = options.labelFontColor || 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(yLabel, left / 2, y);

      // --- Draw X-Axis Label ---
      const xValue = xScale.getValueForPixel(x) || 0;
      const xDate = new Date(xValue);
      const xLabel = xDate.toLocaleString('en-US', { day: 'numeric', month: 'long' });
      const textWidth = ctx.measureText(xLabel).width;
      const padding = 12;
      const labelWidth = textWidth + padding;

      ctx.beginPath();
      ctx.fillStyle = options.labelBackgroundColor || 'rgba(102, 102, 102, 1)';
      ctx.fillRect(x - labelWidth / 2, bottom, labelWidth, LABEL_HEIGHT);
      ctx.closePath();

      ctx.fillStyle = options.labelFontColor || 'white';
      ctx.fillText(xLabel, x, bottom + LABEL_HEIGHT / 2);

      ctx.restore();
    }
  }
};

export default crosshairPlugin;
