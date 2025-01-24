import type { ColumnMetaData } from '@/api/buster_rest';
import type { BusterChartConfigProps } from './chartConfigProps';

export type BusterChartProps = {
  data: Record<string, string | number | null | Date>[] | null;
  groupByMethod?: 'sum' | 'average' | 'count';
  loading?: boolean;
  className?: string;
  bordered?: boolean;
  animate?: boolean;
  id?: string;
  error?: string;
  columnMetadata: ColumnMetaData[] | undefined;
  useRapidResizeObserver?: boolean;
  editable?: boolean;
  onInitialAnimationEnd?: () => void;
  onChartMounted?: (chart?: any) => void;
  renderType?: 'echart' | 'chartjs';
} & BusterChartConfigProps;
