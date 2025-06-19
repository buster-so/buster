import type { AnimationOptions, ChartDataset } from 'chart.js';
import memoize from 'lodash/memoize';
import type { BusterChartProps } from '@/api/asset_interfaces/metric';

const DEFAULT_MAX_DELAY_DATA_POINT = 95;
const DEFAULT_MAX_DELAY_DATASET = 250;

// Create a memoized function that uses the chart ID as part of the cache key
const createHasDataLabelsChecker = () => {
  const memoizedFn = memoize(
    (chartId: string, datasets: ChartDataset[]): boolean => {
      return datasets.some((d) => d.datalabels);
    },
    (chartId: string) => chartId // Use chart ID as the cache key
  );

  // Add type-safe cache property
  const typedMemoizedFn = memoizedFn as typeof memoizedFn & {
    cache: {
      clear: () => void;
    };
  };

  return typedMemoizedFn;
};

export const barDelayAnimation = (props?: {
  maxDelayBetweenDataPoints?: number;
  maxDelayBetweenDatasets?: number;
  barGroupType: BusterChartProps['barGroupType'];
}) => {
  const {
    maxDelayBetweenDataPoints = DEFAULT_MAX_DELAY_DATA_POINT,
    maxDelayBetweenDatasets = DEFAULT_MAX_DELAY_DATASET,
    barGroupType
  } = props || {};
  let delayed = false;

  // Create a new memoized function for this animation instance
  const hasDataLabels = createHasDataLabelsChecker();

  // Clean up interval when animation completes
  const cleanup = () => {
    hasDataLabels.cache.clear();
  };

  return {
    onComplete: () => {
      delayed = true;
      cleanup();
    },
    delay: (context) => {
      if (
        barGroupType === 'percentage-stack' ||
        barGroupType === 'stack' ||
        hasDataLabels(context.chart.id, context.chart.data.datasets)
      ) {
        return 0;
      }

      let delay = 0;
      const dataIndex = context.dataIndex;
      const datasetIndex = context.datasetIndex;

      const numberOfDataPoints = context.chart.data.datasets[datasetIndex]?.data.length || 1;
      const numberOfDatasets = context.chart.data.datasets.length || 1;

      if (numberOfDataPoints > 12 || numberOfDatasets > 3) {
        return delay;
      }

      if (context.type === 'data' && context.mode === 'default' && !delayed) {
        delay = datasetIndex * maxDelayBetweenDatasets + dataIndex * maxDelayBetweenDataPoints;
      }

      return delay;
    }
  } satisfies AnimationOptions<'bar'>['animation'];
};
