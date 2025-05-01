import type { BusterChartProps } from '@/api/asset_interfaces/metric';
import type { AnimationOptions } from 'chart.js';
import memoize from 'lodash/memoize';

const MAX_DELAY = 1000;

// Create a memoized function that uses the chart ID as part of the cache key
const createHasDataLabelsChecker = () => {
  const memoizedFn = memoize(
    (chartId: string, datasets: any[]): boolean => {
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
  maxDelay?: number;
  barGroupType: BusterChartProps['barGroupType'];
}) => {
  const { maxDelay = MAX_DELAY, barGroupType } = props || {};
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
      const numberOfDatasets = context.chart.data.datasets.length;
      const numberOfDataPoints = context.chart.data.datasets[datasetIndex]?.data.length || 1;

      if (context.type === 'data' && context.mode === 'default' && !delayed) {
        const totalSegments = numberOfDatasets * numberOfDataPoints - 1;
        const scalingFactor = totalSegments > 0 ? maxDelay / totalSegments : 0;
        const sequencePosition = datasetIndex * numberOfDataPoints + dataIndex;
        delay = sequencePosition * scalingFactor;
      }
      return delay;
    }
  } satisfies AnimationOptions<'bar'>['animation'];
};
