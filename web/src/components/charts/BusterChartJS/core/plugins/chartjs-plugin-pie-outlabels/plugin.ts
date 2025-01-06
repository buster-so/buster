import { ArcElement, Chart, ChartDataset, ChartMeta, ChartType, Plugin } from 'chart.js';
import OutLabel from './OutLabel';
import OutLabelsContext from './OutLabelsContext';
import OutLabelsManager from './OutLabelsManager';
import { OutLabelStyle } from './OutLabelsStyle';
import { OutLabelsOptions } from './OutLabelsOptions';
import { CustomAnimationSpec } from '../common';

const globalAnimationDuration = (Chart.defaults.animation as CustomAnimationSpec).duration;

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    outlabels?: OutLabelsOptions | false;
  }

  interface Chart {
    $outLabelsManager: OutLabelsManager;
  }
}

declare type OutLabelsPlugin = Plugin<'doughnut' | 'pie', OutLabelsOptions> & {
  _isEnabled(chart: Chart<'doughnut' | 'pie', number[], unknown>): boolean;
};

export const OutLabelsPlugin: OutLabelsPlugin = {
  id: 'outlabels',
  install: function (chart) {
    const outLabelsManager = new OutLabelsManager();
    outLabelsManager.set(chart.id);
    chart.$outLabelsManager = outLabelsManager;
  },

  // Helper function to check if plugin is enabled
  _isEnabled: function (chart: Chart<'doughnut' | 'pie', number[], unknown>) {
    const options = chart.options.plugins?.outlabels as OutLabelsOptions;
    return options && options.display === true;
  },

  start: function (chart) {
    if (!this._isEnabled(chart)) return;
    const options = chart.options.plugins?.outlabels as OutLabelsOptions;

    if (!options || !options.display) {
      return;
    }

    const outLabelsManager = chart.$outLabelsManager;
    outLabelsManager.setCancelled(false);
    if (!outLabelsManager.animateStarted) {
      const animationDurationObject =
        ((chart.options.animation as CustomAnimationSpec)?.duration as number) ??
        globalAnimationDuration;
      const animationDuration =
        typeof animationDurationObject === 'number'
          ? animationDurationObject
          : (globalAnimationDuration as number);

      setTimeout(() => {
        outLabelsManager.setAnimateStarted();
        outLabelsManager.setRenderedAt();
        requestAnimationFrame(() => {
          if (!outLabelsManager.isCancelled) {
            chart.draw();
          }
        });
      }, animationDuration * 0.7);
    }
  },
  stop: function (chart) {
    const outLabelsManager = chart.$outLabelsManager;

    // Restore original radius
    const dataset = chart.data.datasets[0];
    if (dataset && this._isEnabled(chart) && chart.ctx) {
      //@ts-ignore
      (dataset as ChartDataset<'pie'>).radius = '100%';
      outLabelsManager.setUsedShrink(false);
      chart.update(); // Trigger chart update to apply the radius change
    }

    outLabelsManager.setCancelled(true);
  },
  beforeLayout: function (chart, args, options) {
    if (!this._isEnabled(chart)) return;
    const shrinkPercentage = options.shrinkPercentage ?? 1;
    const outLabelsManager = chart.$outLabelsManager;
    if (!outLabelsManager.usedShrink && shrinkPercentage < 1) {
      const dataset = chart.data.datasets[0];
      //@ts-ignore
      const chartRadius = (dataset as ChartDataset<'pie'>).radius;
      const containerRadius = Math.min(chart.width, chart.height) / 2;
      const radius =
        typeof chartRadius === 'string' || !chartRadius ? containerRadius : chartRadius;

      if (dataset) {
        //@ts-ignore
        (dataset as ChartDataset<'pie'>).radius = radius * shrinkPercentage;
        outLabelsManager.setUsedShrink(true);
      }
    }
  },
  afterDatasetUpdate: function (chart, args, options) {
    const meta = chart.getDatasetMeta(args.index);
    const dataset = chart.data.datasets[args.index];
    if (!this._isEnabled(chart) || dataset.hidden || args.meta.hidden || meta.hidden) return;

    const outLabelsManager = chart.$outLabelsManager;
    const labels = chart.config.data.labels;
    const elements = args.meta.data;
    const ctx = chart.ctx;
    const legendItems = chart.legend?.legendItems || [];

    const sumOfRemaining = legendItems.reduce((sum, current) => {
      if (current.hidden) return sum;
      const labelValue = dataset?.data?.[current.index!] || 0;
      return sum + labelValue;
    }, 0);

    ctx.save();
    for (let i = 0; i < elements.length; ++i) {
      const el = elements[i];
      let newLabel = null;

      const percent = dataset.data[i] / sumOfRemaining;
      const isHidden = !chart.getDataVisibility(i);

      const context: OutLabelsContext = {
        chart: chart as Chart<'doughnut'>,
        dataIndex: i,
        dataset: dataset as ChartDataset<'doughnut', number[]>,
        labels: labels as string[],
        datasetIndex: args.index,
        value: dataset.data[i],
        percent: percent,
        display: !isHidden,
        formatter: options.formatter,
        usePercent: options.usePercent
      };

      const style = new OutLabelStyle(options, context, i);
      if (el && !isHidden) {
        try {
          newLabel = new OutLabel(ctx, context, i, style);
        } catch (e) {
          newLabel = null;
        }
      } else if (el && isHidden) {
        outLabelsManager.removeLabel(chart.id, i);
      }

      if (newLabel) outLabelsManager.setLabel(chart.id, i, newLabel);
    }

    ctx.restore();
  },

  afterDatasetDraw: function (chart, args, options) {
    if (!this._isEnabled(chart)) return;
    const outLabelsManager = chart.$outLabelsManager;
    if (!outLabelsManager.animateStarted) return;
    const ctx = chart.ctx;
    const meta = args.meta as ChartMeta<'doughnut' | 'pie', ArcElement>;
    const elements = meta.data;
    ctx.save();

    const chartOutlabels = outLabelsManager.get(chart.id);
    if (!chartOutlabels) return;

    // Animate in the labels
    if (!outLabelsManager.animateCompleted) {
      const duration = options?.animateInDuration!;
      const currentTime = performance.now();
      const elapsed = Math.min(currentTime - (outLabelsManager.renderedAt || 0), duration);
      const progress = Math.min(elapsed / duration, 1);
      ctx.globalAlpha = progress;
      if (progress < 1) {
        requestAnimationFrame(() => {
          if (!outLabelsManager.isCancelled) {
            chart.draw();
          }
        }); // Continue animation until complete
      } else if (progress >= 1) {
        outLabelsManager.setAnimateCompleted();
      }
    }

    chartOutlabels.forEach((label) => {
      if (elements[label.index]) {
        label.positionCenter(elements[label.index]);
        label.updateRects();
      }
    });

    outLabelsManager.avoidOverlap(chart);

    chartOutlabels.forEach((label) => {
      if (label.style.display) {
        label.updateRects();
        label.drawLine();
        label.draw();
      }
    });

    ctx.restore();
  },

  defaults: {
    shrinkPercentage: 0.68,
    animateInDuration: 350,
    display: false,
    length: 18,
    font: {
      size: 10,
      resizable: true,
      minSize: 10,
      maxSize: 10
    },
    usePercent: false
  }
};

export default OutLabelsPlugin;
