import { formatLabel } from '@/lib';
import isEmpty from 'lodash/isEmpty';
import type { BusterChartProps, ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { DatasetOption, extractFieldsFromChain } from '../chartHooks';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

export const JOIN_CHARACTER = ' | ';

export const formatChartLabelDelimiter = (
  text: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  const fields = extractFieldsFromChain(text);

  if (!fields || fields.length === 0) {
    return ''; //I used to return text? Maybe I should?
  }

  const formattedFields = fields.map((field) => formatLabelField(field, columnLabelFormats));

  return formattedFields.join(JOIN_CHARACTER);
};

//used in the legend and axis labels. exported only for tooltip
const formatLabelField = (
  field: { value: string; key: string },
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
) => {
  const { value, key = '' } = field;
  const hasValue = !isEmpty(value) && typeof value !== 'number';
  const columnLabelFormat = columnLabelFormats[key];
  return formatLabel(hasValue ? value : key, columnLabelFormat, !hasValue);
};

export const formatChartValueDelimiter = (
  rawValue: string | number,
  columnNameDelimiter: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
) => {
  const fields = extractFieldsFromChain(columnNameDelimiter);
  const lastField = fields[fields.length - 1]; //if there are categories, the last field is the value
  const { key: columnName } = lastField;
  return formatValueField(rawValue, columnName, columnLabelFormats);
};

const formatValueField = (
  rawValue: string | number,
  columnName: string = '', //must be columnName, not delimiter
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
) => {
  return formatLabel(
    rawValue,
    columnLabelFormats[columnName] || DEFAULT_COLUMN_LABEL_FORMAT,
    false
  );
};

//NEW LABEL HELPERS

export const formatLabelForDataset = (
  dataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  return dataset.label
    .map<string>((item) => {
      const { key, value } = item;
      const columnLabelFormat = columnLabelFormats[key];
      return formatLabel(value || key, columnLabelFormat, !value);
    })
    .join(JOIN_CHARACTER);
};
