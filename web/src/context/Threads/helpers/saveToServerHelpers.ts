import { ThreadUpdateMessage } from '@/api/buster_socket/threads';
import {
  DEFAULT_CHART_CONFIG_ENTRIES,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  IBusterThreadMessageChartConfig
} from '@/api/buster_rest';
import { getChangedValues } from '@/utils/objects';
import { IBusterThreadMessage } from '../interfaces';
import isEqual from 'lodash/isEqual';
import {
  BarAndLineAxis,
  BusterChartConfigProps,
  ColumnLabelFormat,
  ColumnSettings,
  ComboChartAxis,
  PieChartAxis,
  ScatterAxis
} from '@/components/charts';

const DEFAULT_COLUMN_SETTINGS_ENTRIES = Object.entries(DEFAULT_COLUMN_SETTINGS);
const DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES = Object.entries(DEFAULT_COLUMN_LABEL_FORMAT);

const getChangedTopLevelMessageValues = (
  newMessage: IBusterThreadMessage,
  oldMessage: IBusterThreadMessage
) => {
  return getChangedValues(oldMessage, newMessage, ['title', 'feedback', 'status', 'code']);
};

const keySpecificHandlers: Partial<
  Record<keyof IBusterThreadMessageChartConfig, (value: any) => any>
> = {
  barAndLineAxis: (value: BarAndLineAxis) => value,
  scatterAxis: (value: ScatterAxis) => value,
  pieChartAxis: (value: PieChartAxis) => value,
  comboChartAxis: (value: ComboChartAxis) => value,
  columnSettings: (columnSettings: BusterChartConfigProps['columnSettings']) => {
    // Early return if no column settings
    if (!columnSettings) return {};

    const diff: Record<string, ColumnSettings> = {};

    // Single loop through column settings
    for (const [key, value] of Object.entries(columnSettings)) {
      const changedSettings: ColumnSettings = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_SETTINGS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnSettings];
        if (!isEqual(defaultValue, columnSettingValue)) {
          changedSettings[settingKey as keyof ColumnSettings] = columnSettingValue as any;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings;
      }
    }

    return diff;
  },
  columnLabelFormats: (columnLabelFormats: Record<string, ColumnLabelFormat>) => {
    // Early return if no column settings
    if (!columnLabelFormats) return {};

    const diff: Record<string, ColumnLabelFormat> = {};

    // Single loop through column label formats
    for (const [key, value] of Object.entries(columnLabelFormats)) {
      const changedSettings: ColumnLabelFormat = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnLabelFormat];
        if (!isEqual(defaultValue, columnSettingValue)) {
          changedSettings[settingKey as keyof ColumnLabelFormat] = columnSettingValue as any;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings;
      }
    }

    return diff;
  }
};

const getChangesFromDefaultChartConfig = (newMessage: IBusterThreadMessage) => {
  const chartConfig = newMessage.chart_config;
  if (!chartConfig) return {} as BusterChartConfigProps;

  const diff: Partial<IBusterThreadMessageChartConfig> = {};

  for (const [_key, defaultValue] of DEFAULT_CHART_CONFIG_ENTRIES) {
    const key = _key as keyof IBusterThreadMessageChartConfig;
    const chartConfigValue = chartConfig[key];
    const handler = keySpecificHandlers[key];

    if (handler) {
      const valueToUse = handler(chartConfigValue);
      if (valueToUse && Object.keys(valueToUse).length > 0) {
        diff[key] = valueToUse;
      }
      continue;
    }

    if (!isEqual(chartConfigValue, defaultValue)) {
      diff[key] = chartConfigValue as any;
    }
  }

  return diff as BusterChartConfigProps;
};

export const prepareThreadUpdateMessage = (
  newMessage: IBusterThreadMessage,
  oldMessage: IBusterThreadMessage
): ThreadUpdateMessage['payload'] | null => {
  const changedTopLevelValues = getChangedTopLevelMessageValues(newMessage, oldMessage) as Partial<
    ThreadUpdateMessage['payload']
  >;

  const changedChartConfig = getChangesFromDefaultChartConfig(newMessage);

  return {
    ...changedTopLevelValues,
    chart_config: changedChartConfig,
    id: newMessage.id
  };
};
