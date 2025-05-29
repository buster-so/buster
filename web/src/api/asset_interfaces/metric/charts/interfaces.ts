import type { ColumnMetaData } from '@/api/asset_interfaces/metric';
import type { ChartJSOrUndefined } from '@/components/ui/charts/BusterChartJS/core/types';
import type { BusterChartConfigProps } from './chartConfigProps';

export type BusterChartProps = {
  data: Record<string, string | number | null | Date>[] | null;
  groupByMethod?: 'sum' | 'average' | 'count';
  loading?: boolean;
  className?: string;
  animate?: boolean;
  animateLegend?: boolean;
  id?: string;
  error?: string;
  columnMetadata?: ColumnMetaData[];
  readOnly?: boolean;
  onInitialAnimationEnd?: () => void;
  onChartMounted?: (chart?: ChartJSOrUndefined) => void;
} & BusterChartConfigProps;
