import type { BusterChartProps } from '../../BusterChart.types';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../../config';
import { randomSampling } from './downsample';

const downsampleScatterData = (data: NonNullable<BusterChartProps['data']>) => {
  return randomSampling(data, DOWNSIZE_SAMPLE_THRESHOLD);
};

const sortScatterData = (data: NonNullable<BusterChartProps['data']>, xField: string) => {
  return data.sort((a, b) => {
    if (a[xField] === null || b[xField] === null) return 0;
    return (a[xField] as number) - (b[xField] as number);
  });
};

//We sort the data first because chart.js is faster with sorted data (parsing: false)
export const downsampleAndSortScatterData = (
  data: NonNullable<BusterChartProps['data']>,
  xField: string
) => {
  return sortScatterData(downsampleScatterData(data), xField);
};
