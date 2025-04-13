import type { Trendline } from '@/api/asset_interfaces/metric/charts';
import type { DatasetOption } from '../interfaces';

export type TrendlineDataset = DatasetOption & {
  equation?: string;
} & Trendline;
