import type { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/buster-rest';
import type { IBusterThreadMessage } from '../Threads';
import { createDefaultChartConfig } from '../Threads/helpers/messageAutoChartHandler';
import type {
  BusterChartConfigProps,
  ColumnLabelFormat,
  IColumnLabelFormat
} from '@/components/charts';

export const didColumnDataChange = (
  oldColumnData: ColumnMetaData[] | undefined,
  newColumnData: ColumnMetaData[] | undefined
) => {
  if (!oldColumnData || !newColumnData) return true;

  const createRecordOfColumnMetaData = (columnData: ColumnMetaData[]) => {
    return columnData.reduce<
      Record<
        string,
        {
          name: string;
          simple_type: string;
        }
      >
    >((acc, x) => {
      acc[x.name] = {
        name: x.name,
        simple_type: x.simple_type
      };
      return acc;
    }, {});
  };

  const oldColumnDataRecord = createRecordOfColumnMetaData(oldColumnData);
  const newColumnDataRecord = createRecordOfColumnMetaData(newColumnData);

  const oldKeys = Object.keys(oldColumnDataRecord);
  const newKeys = Object.keys(newColumnDataRecord);

  if (oldKeys.length !== newKeys.length) return true;

  return oldKeys.some((key) => {
    const oldCol = oldColumnDataRecord[key];
    const newCol = newColumnDataRecord[key];
    return !newCol || oldCol.name !== newCol.name || oldCol.simple_type !== newCol.simple_type;
  });
};

export const simplifyChratConfigForSQLChange = (
  chartConfig: IBusterThreadMessageChartConfig,
  data_metadata: IBusterThreadMessage['data_metadata']
): IBusterThreadMessageChartConfig => {
  const columnLabelFormats = data_metadata?.column_metadata?.reduce<
    Record<string, ColumnLabelFormat>
  >((acc, x) => {
    const oldFormat: undefined | Required<IColumnLabelFormat> =
      chartConfig.columnLabelFormats?.[x.name];
    const didTypeChange = oldFormat?.columnType !== x.simple_type;
    const value = didTypeChange ? undefined : oldFormat;
    acc[x.name] = {
      ...value
    };
    return acc;
  }, {});

  const result = createDefaultChartConfig({
    chart_config: {
      columnLabelFormats
    } as BusterChartConfigProps,
    data_metadata
  });

  return result;
};
