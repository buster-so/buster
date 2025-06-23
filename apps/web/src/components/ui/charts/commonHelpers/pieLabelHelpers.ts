import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';

export const InnerLabelTitleRecord: Record<
  NonNullable<BusterChartConfigProps['pieInnerLabelAggregate']>,
  string
> = {
  sum: 'Total',
  average: 'Average',
  median: 'Median',
  max: 'Max',
  min: 'Min',
  count: 'Count'
};

export const getPieInnerLabelTitle = (
  pieInnerLabelTitle: BusterChartConfigProps['pieInnerLabelTitle'],
  pieInnerLabelAggregate: BusterChartConfigProps['pieInnerLabelAggregate'] = 'sum'
) => {
  return pieInnerLabelTitle ?? InnerLabelTitleRecord[pieInnerLabelAggregate];
};
