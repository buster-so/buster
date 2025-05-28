import type { Trendline } from '@/api/asset_interfaces/metric/charts';
import type { LoopTrendline } from './EditTrendline';
import type { SelectItem } from '@/components/ui/select';

export const TypeToLabel: Record<Trendline['type'], string> = {
  linear_regression: 'Linear',
  logarithmic_regression: 'Logarithmic',
  exponential_regression: 'Exponential',
  polynomial_regression: 'Polynomial',
  min: 'Min',
  max: 'Max',
  median: 'Median',
  average: 'Average'
};

export const trendlineOptions: SelectItem<LoopTrendline['type']>[] = [
  { label: TypeToLabel['linear_regression'], value: 'linear_regression' },
  { label: TypeToLabel['logarithmic_regression'], value: 'logarithmic_regression' },
  { label: TypeToLabel['exponential_regression'], value: 'exponential_regression' },
  { label: TypeToLabel['polynomial_regression'], value: 'polynomial_regression' },
  { label: TypeToLabel['average'], value: 'average' },
  { label: TypeToLabel['min'], value: 'min' },
  { label: TypeToLabel['max'], value: 'max' },
  { label: TypeToLabel['median'], value: 'median' }
];
