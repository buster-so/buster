import type { Chart, ChartType, DefaultDataPoint } from 'chart.js';
import type { ColumnMetaData } from '../interfaces';
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

type ChartJSOrUndefined<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
> = Chart<TType, TData, TLabel> | undefined;
