import type {
  BusterChartProps,
  BusterChartPropsBase,
  MetricChartProps
} from '@/api/asset_interfaces/metric/charts';

export interface BusterMetricChartProps extends MetricChartProps, BusterChartPropsBase {
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}
