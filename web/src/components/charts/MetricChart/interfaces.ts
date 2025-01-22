import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { BusterChartPropsBase, BusterChartProps, MetricChartProps } from '../interfaces';

export interface BusterMetricChartProps extends MetricChartProps, BusterChartPropsBase {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}
