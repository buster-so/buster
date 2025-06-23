import type { Trendline } from '@/api/asset_interfaces/metric/charts';

type TrendlineType = Trendline['type'];

export const TypeToLabel: Record<TrendlineType, string> = {
  linear_regression: 'Linear',
  logarithmic_regression: 'Logarithmic',
  exponential_regression: 'Exponential',
  polynomial_regression: 'Polynomial',
  min: 'Min',
  max: 'Max',
  median: 'Median',
  average: 'Average'
};
