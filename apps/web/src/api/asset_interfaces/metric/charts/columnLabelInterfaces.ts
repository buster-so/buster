import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';

type ColumnLabelFormatBase = {
  style?: 'currency' | 'percent' | 'number' | 'date' | 'string';
  columnType?: SimplifiedColumnType;
  displayName?: string; //OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  numberSeparatorStyle?: ',' | null; //OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  minimumFractionDigits?: number; //OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits?: number; //OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  multiplier?: number; //OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  prefix?: string; //OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix?: string; //OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  replaceMissingDataWith?: 0 | null | string; //OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  useRelativeTime?: boolean;
  isUTC?: boolean;
  makeLabelHumanReadable?: boolean;

  //DO NOT SHARE WITH LLM
  compactNumbers?: boolean;
};

type BusterChartLabelFormatCurrency = {
  currency?: string; //OPTIONAL: default is 'USD'. This will only apply if the format is set to 'currency'. It should be the ISO 4217 currency code.
} & ColumnLabelFormatBase;

type BusterChartLabelFormatDate = {
  dateFormat?: 'auto' | string; //OPTIONAL: default is 'LL'. This will only apply if the format is set to 'date'. This will convert the date to the specified format. This MUST BE IN dayjs format. If you determine that a column type is a date column, you should specify it's date format here.
  useRelativeTime?: boolean;
  isUTC?: boolean;
  convertNumberTo?: 'day_of_week' | 'month_of_year' | 'quarter' | 'number' | null; //OPTIONAL: default is null. This will only apply if the format is set to 'number'. This will convert the number to a specified date unit. For example, if month_of_year is selected, then the number 0 will be converted to January.
} & ColumnLabelFormatBase;

type BusterChartLabelFormatNumber = {} & ColumnLabelFormatBase;

type BusterChartLabelFormatString = {} & ColumnLabelFormatBase;

type BusterChartLabelFormatPercent = {} & ColumnLabelFormatBase;

export type ColumnLabelFormat = BusterChartLabelFormatCurrency &
  BusterChartLabelFormatDate &
  BusterChartLabelFormatNumber &
  BusterChartLabelFormatString &
  BusterChartLabelFormatPercent;

export type IColumnLabelFormat = {
  columnType: SimplifiedColumnType;
  style: NonNullable<ColumnLabelFormat['style']>;
} & ColumnLabelFormat;
