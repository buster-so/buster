'use client';

import { isServer } from '@tanstack/react-query';
import {
  ArcElement,
  BarController,
  BarElement,
  BubbleController,
  CategoryScale,
  Chart as ChartJS,
  Colors,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PieController,
  PointElement,
  ScatterController,
  TimeScale,
  TimeSeriesScale,
  Title,
  Tooltip
} from 'chart.js';
import ChartJsAnnotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ChartDeferred from 'chartjs-plugin-deferred';
import { DEFAULT_CHART_THEME } from '@/api/asset_interfaces/metric/charts/configColors';
import { truncateText } from '@/lib/text';
import { ChartMountedPlugin } from './core/plugins';
import ChartTrendlinePlugin from './core/plugins/chartjs-plugin-trendlines';
import './core/plugins/chartjs-plugin-dayjs';
import './core/plugins/chartjs-scale-tick-duplicate';
import './core/plugins/chartjs-plugin-trendlines';

const fontFamily = isServer
  ? 'Roobert_Pro'
  : getComputedStyle(document.documentElement).getPropertyValue('--font-sans');
const color = isServer
  ? '#575859'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary');
const backgroundColor = isServer
  ? '#ffffff'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-background');

ChartJS.register(
  LineController,
  BarController,
  BubbleController,
  PieController,
  ScatterController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Colors,
  ArcElement,
  ChartDeferred,
  ChartMountedPlugin,
  Legend,
  CategoryScale,
  LinearScale,
  ChartJsAnnotationPlugin,
  Tooltip,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
  ChartDataLabels,
  ChartTrendlinePlugin
);

ChartJS.defaults.responsive = true;
ChartJS.defaults.clip = false;
ChartJS.defaults.resizeDelay = 7;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.color = color;
ChartJS.defaults.backgroundColor = DEFAULT_CHART_THEME;
ChartJS.defaults.font = {
  ...ChartJS.defaults.font,
  family: fontFamily,
  size: 11,
  weight: 'normal'
};

[
  ChartJS.defaults.scales.category,
  ChartJS.defaults.scales.linear,
  ChartJS.defaults.scales.logarithmic,
  ChartJS.defaults.scales.time,
  ChartJS.defaults.scales.timeseries
].forEach((scale) => {
  scale.title = {
    ...scale.title,
    font: {
      ...ChartJS.defaults.font,
      size: 10
    }
  };
});

[
  ChartJS.defaults.scales.category,
  ChartJS.defaults.scales.time,
  ChartJS.defaults.scales.timeseries
].forEach((scale) => {
  scale.ticks.showLabelBackdrop = true;
  scale.ticks.z = 10;
  scale.ticks.includeBounds = true;
  scale.ticks.backdropColor = backgroundColor;
  scale.ticks.autoSkipPadding = 4;
  scale.ticks.align = 'center';
  scale.ticks.callback = function (value, index, values) {
    return truncateText(this.getLabelForValue(value as number), 18);
  };
});

for (const scale of [
  ChartJS.defaults.scales.category,
  ChartJS.defaults.scales.linear,
  ChartJS.defaults.scales.logarithmic
]) {
  scale.ticks.z = 0; //this used to be a 100, but I changed it for datalabels sake
  scale.ticks.backdropColor = backgroundColor;
  scale.ticks.showLabelBackdrop = true;
  scale.ticks.autoSkipPadding = 2;
}

export const DEFAULT_CHART_LAYOUT = {
  autoPadding: true,
  padding: {
    top: 14,
    bottom: 4,
    left: 10,
    right: 10
  }
};

ChartJS.defaults.layout = {
  ...ChartJS.defaults.layout,
  ...DEFAULT_CHART_LAYOUT
};
ChartJS.defaults.normalized = true;

ChartJS.defaults.plugins = {
  ...ChartJS.defaults.plugins,
  legend: {
    ...ChartJS.defaults.plugins.legend,
    display: false
  },
  datalabels: {
    ...ChartJS.defaults.plugins.datalabels,
    clamp: true,
    display: false,
    font: {
      weight: 'normal',
      size: 10,
      family: fontFamily
    }
  },
  tooltipHoverBar: {
    isDarkMode: false
  }
};

//PIE SPECIFIC
ChartJS.overrides.pie = {
  ...ChartJS.overrides.pie,
  hoverBorderColor: 'white',
  layout: {
    autoPadding: true,
    padding: 35
  },
  elements: {
    ...ChartJS.overrides.pie?.elements,
    arc: {
      ...ChartJS.overrides.pie?.elements?.arc,
      hoverOffset: 0,
      borderRadius: 5,
      borderWidth: 2.5,
      borderAlign: 'center',
      borderJoinStyle: 'round'
    }
  }
};

//BAR SPECIFIC
ChartJS.overrides.bar = {
  ...ChartJS.overrides.bar,
  elements: {
    ...ChartJS.overrides.bar?.elements,
    bar: {
      ...ChartJS.overrides.bar?.elements?.bar,
      borderRadius: 4
    }
  }
};

//LINE SPECIFIC
ChartJS.overrides.line = {
  ...ChartJS.overrides.line,
  elements: {
    ...ChartJS.overrides.line?.elements,
    line: {
      ...ChartJS.overrides.line?.elements?.line,
      borderWidth: 2
    }
  }
};
