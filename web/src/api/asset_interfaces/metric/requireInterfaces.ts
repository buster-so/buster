import type { BusterChartConfigProps, ColumnSettings, IColumnLabelFormat } from './charts';
import type { BusterMetric } from './interfaces';

export type IBusterMetricChartConfig = Required<
  Omit<BusterChartConfigProps, 'columnLabelFormats'>
> & {
  columnLabelFormats: Record<string, Required<IColumnLabelFormat>>;
  columnSettings: Required<Record<string, Required<ColumnSettings>>>;
};

export interface IBusterMetric extends Required<BusterMetric> {
  chart_config: IBusterMetricChartConfig;
}
