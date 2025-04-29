import { AnimationOptions } from 'chart.js';

const MAX_DELAY = 1000;

export const barDelayAnimation = (props?: { maxDelay?: number }) => {
  const { maxDelay = MAX_DELAY } = props || {};
  let delayed = false;
  return {
    onComplete: () => {
      delayed = true;
    },
    delay: (context) => {
      let delay = 0;
      const dataIndex = context.dataIndex;
      const datasetIndex = context.datasetIndex;
      const numberOfDatasets = context.chart.data.datasets.length;
      const numberOfDataPoints = context.chart.data.datasets[datasetIndex]?.data.length || 1;

      if (context.type === 'data' && context.mode === 'default' && !delayed) {
        // Calculate a scaling factor to distribute delays evenly, with max total delay of 1500ms

        const totalSegments = numberOfDatasets * numberOfDataPoints - 1; // -1 because first element has 0 delay
        const scalingFactor = totalSegments > 0 ? maxDelay / totalSegments : 0;

        // Calculate position in overall sequence (dataset index * points per dataset + datapoint index)
        const sequencePosition = datasetIndex * numberOfDataPoints + dataIndex;
        delay = sequencePosition * scalingFactor;
      }
      return delay;
    }
  } satisfies AnimationOptions<'bar'>['animation'];
};
