import type {
  BusterChartConfigProps,
  ColumnSettings,
  IColumnLabelFormat
} from '@/components/charts';

export type BusterThreadMessageConfig = BusterChartConfigProps;

export type IBusterThreadMessageChartConfig = Required<
  Omit<BusterChartConfigProps, 'columnLabelFormats'>
> & {
  columnLabelFormats: Record<string, Required<IColumnLabelFormat>>;
  columnSettings: Required<Record<string, Required<ColumnSettings>>>;
};
