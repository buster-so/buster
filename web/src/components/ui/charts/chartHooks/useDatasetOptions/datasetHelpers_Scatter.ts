import { type BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { randomSampling } from '@/lib/downsample';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../../config';

export const downsampleScatterData = (data: NonNullable<BusterChartProps['data']>) => {
  return randomSampling(data, DOWNSIZE_SAMPLE_THRESHOLD);
};
