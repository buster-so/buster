import { create } from 'mutative';
import {
  type ColumnLabelFormat,
  type ColumnMetaData,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type IBusterMetricChartConfig,
  type IColumnLabelFormat,
  type SimplifiedColumnType
} from '@/api/asset_interfaces/metric';
import { isDateColumnType, isNumericColumnType, simplifyColumnType } from '@/lib/messages';

export const createDefaultColumnLabelFormats = (
  columnLabelFormats: Record<string, IColumnLabelFormat> | undefined,
  columnsMetaData: ColumnMetaData[] | undefined
): IBusterMetricChartConfig['columnLabelFormats'] => {
  if (!columnsMetaData) return {};

  return columnsMetaData.reduce(
    (acc, column) => {
      const existingLabelFormat = columnLabelFormats?.[column.name] || {};
      acc[column.name] = create(createDefaulColumnLabel(columnsMetaData, column.name), (draft) => {
        if (existingLabelFormat) {
          Object.assign(draft, existingLabelFormat);
        }
      });
      return acc;
    },
    {} as IBusterMetricChartConfig['columnLabelFormats']
  );
};

const createDefaultReplaceMissingDataWith = (simpleType: SimplifiedColumnType): null | 0 => {
  if (simpleType === 'number') return 0;
  if (simpleType === 'text') return null;
  if (simpleType === 'date') return null;
  return null;
};

const createDefaulColumnLabel = (
  columnsMetaData: ColumnMetaData[],
  name: string
): Required<ColumnLabelFormat> => {
  const assosciatedColumn = columnsMetaData?.find((m) => m.name === name) || {
    simple_type: 'text'
  };
  const columnType: SimplifiedColumnType = simplifyColumnType(assosciatedColumn?.simple_type);
  const style = createDefaultColumnLabelStyle(columnType);
  const replaceMissingDataWith = createDefaultReplaceMissingDataWith(columnType);

  return create(DEFAULT_COLUMN_LABEL_FORMAT, (draft) => {
    draft.style = style;
    draft.columnType = columnType;
    draft.replaceMissingDataWith = replaceMissingDataWith;
  });
};

const createDefaultColumnLabelStyle = (
  columnType: SimplifiedColumnType
): IColumnLabelFormat['style'] => {
  if (isDateColumnType(columnType)) return 'date';
  if (isNumericColumnType(columnType)) return 'number';
  return 'string';
};
