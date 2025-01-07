import { ColumnDataType } from '@/api/busterv2';
import { ColumnLabelFormat } from '@/components/charts';

export const NUMBER_TYPES: (ColumnDataType | string)[] = [
  'float',
  'integer',
  'float8',
  'int2',
  'int4',
  'int8',
  'decimal',
  'number',
  'numeric',
  'tiny',
  'float4'
];
//"CHAR", "VARCHAR", "TEXT", "TINYTEXT", "TEXT", "MEDIUMTEXT", "LONGTEXT", "NCHAR", "NVARCHAR", "NTEXT", "STRING", "TEXT"

export const TEXT_TYPES: (ColumnDataType | string)[] = [
  'text',
  'varchar',
  'char',
  'character',
  'character varying'
];
export const DATE_TYPES: (ColumnDataType | string)[] = ['date', 'timestamp', 'timestamptz', 'time'];

export const simplifyColumnType = (type: string): SimplifiedColumnType => {
  if (type === 'number' || NUMBER_TYPES.includes(type as ColumnDataType)) {
    return 'number';
  } else if (type === 'text' || TEXT_TYPES.includes(type as ColumnDataType)) {
    return 'string';
  } else if (type === 'date' || DATE_TYPES.includes(type as ColumnDataType)) {
    return 'date';
  }

  return 'string';
};

export type SimplifiedColumnType = 'number' | 'string' | 'date';

export const isNumericColumnType = (type: SimplifiedColumnType) => {
  return type === 'number';
};

export const isNumericColumnStyle = (style: ColumnLabelFormat['style']) => {
  return style === 'number' || style === 'percent' || style === 'currency';
};

export const isDateColumnType = (columnType: SimplifiedColumnType) => {
  return columnType === 'date';
};
