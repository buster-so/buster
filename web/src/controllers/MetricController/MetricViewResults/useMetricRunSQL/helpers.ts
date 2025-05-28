import type {
  ColumnMetaData,
  IBusterMetric,
  IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import type {
  BusterChartConfigProps,
  ColumnLabelFormat,
  IColumnLabelFormat
} from '@/api/asset_interfaces/metric/charts';
import { createDefaultChartConfig } from '@/lib/metrics/messageAutoChartHandler';

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

/**
 * Simplifies the chart configuration when SQL query changes by preserving column formatting
 * that's still valid for the new data structure and resetting formatting for changed columns.
 *
 * @param chartConfig - The current chart configuration to simplify
 * @param data_metadata - Metadata about the new data structure from the metric
 * @returns A new chart configuration suitable for the changed SQL data
 */
export const simplifyChatConfigForSQLChange = (
  chartConfig: IBusterMetricChartConfig,
  data_metadata: IBusterMetric['data_metadata']
): IBusterMetricChartConfig => {
  // Create a new mapping of column name to format settings
  // This preserves existing format settings only when the column type hasn't changed
  const columnLabelFormats = data_metadata?.column_metadata?.reduce<
    NonNullable<BusterChartConfigProps['columnLabelFormats']>
  >((acc, x) => {
    // Get the existing format for this column (if any)
    const oldFormat: undefined | Required<IColumnLabelFormat> =
      chartConfig.columnLabelFormats?.[x.name];

    // Check if the column type has changed
    const didTypeChange = oldFormat?.columnType !== x.simple_type;

    // If type changed, reset format (undefined), otherwise keep existing format
    const value = didTypeChange ? undefined : oldFormat;

    // Add this column's format to our accumulated result
    acc[x.name] = value;
    return acc;
  }, {});

  // Generate a new default chart configuration using the preserved formats
  // and the new data structure's metadata
  const result = createDefaultChartConfig({
    chart_config: {
      columnLabelFormats
    } as BusterChartConfigProps,
    data_metadata
  });

  return result;
};
