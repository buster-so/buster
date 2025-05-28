import {
  DEFAULT_CHART_CONFIG_ENTRIES,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_COLUMN_SETTINGS,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import type { DataMetadata, IBusterMetric } from '@/api/asset_interfaces/metric';
import type {
  BarAndLineAxis,
  BusterChartConfigProps,
  ColumnLabelFormat,
  ColumnSettings,
  ComboChartAxis,
  PieChartAxis,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import type { updateMetric } from '@/api/buster_rest/metrics';
import { getChangedValues } from '@/lib/objects';
import isEqual from 'lodash/isEqual';
import { createDefaultChartConfig } from './messageAutoChartHandler';

const DEFAULT_COLUMN_SETTINGS_ENTRIES = Object.entries(DEFAULT_COLUMN_SETTINGS);
const DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES = Object.entries(DEFAULT_COLUMN_LABEL_FORMAT);

export const getChangedTopLevelMessageValues = (
  newMetric: IBusterMetric,
  oldMetric: IBusterMetric
) => {
  const changes = getChangedValues(oldMetric, newMetric, ['name', 'status', 'sql', 'file']);
  return changes;
};

const keySpecificHandlers: Partial<
  Record<keyof IBusterMetricChartConfig, (value: unknown) => unknown>
> = {
  barAndLineAxis: (value: unknown) => value as BarAndLineAxis,
  scatterAxis: (value: unknown) => value as ScatterAxis,
  pieChartAxis: (value: unknown) => value as PieChartAxis,
  comboChartAxis: (value: unknown) => value as ComboChartAxis,
  colors: (value: unknown) => value as string[],
  columnSettings: (columnSettings: unknown) => {
    const typedColumnSettings = columnSettings as BusterChartConfigProps['columnSettings'];
    // Early return if no column settings
    if (!typedColumnSettings) return {};

    const diff: Record<string, ColumnSettings> = {};

    // Single loop through column settings
    for (const [key, value] of Object.entries(typedColumnSettings)) {
      const changedSettings: ColumnSettings = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_SETTINGS_ENTRIES) {
        const columnSettingValue = value?.[settingKey as keyof ColumnSettings];
        if (!isEqual(defaultValue, columnSettingValue)) {
          //@ts-ignore
          changedSettings[settingKey as keyof ColumnSettings] = columnSettingValue as unknown;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        diff[key] = changedSettings;
      }
    }

    return diff;
  },
  columnLabelFormats: (columnLabelFormats: unknown) => {
    const typedColumnLabelFormats = columnLabelFormats as Record<string, ColumnLabelFormat>;
    // Early return if no column settings
    if (!typedColumnLabelFormats) return {};

    const diff: Record<string, ColumnLabelFormat> = {};

    // Single loop through column label formats
    for (const [key, value] of Object.entries(typedColumnLabelFormats)) {
      const changedSettings: ColumnLabelFormat = {};
      let hasChanges = false;

      // Check each default setting
      for (const [settingKey, defaultValue] of DEFAULT_COLUMN_LABEL_FORMATS_ENTRIES) {
        const columnSettingValue = value[settingKey as keyof ColumnLabelFormat];
        if (!isEqual(defaultValue, columnSettingValue)) {
          //@ts-ignore
          changedSettings[settingKey as keyof ColumnLabelFormat] = columnSettingValue;
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

export const getChangesFromDefaultChartConfig = (newMetric: IBusterMetric) => {
  const chartConfig = newMetric.chart_config;
  if (!chartConfig) return {} as BusterChartConfigProps;

  const diff: Partial<IBusterMetricChartConfig> = {};

  for (const [_key, defaultValue] of DEFAULT_CHART_CONFIG_ENTRIES) {
    const key = _key as keyof IBusterMetricChartConfig;
    const chartConfigValue = chartConfig[key];
    const handler = keySpecificHandlers[key];

    if (handler) {
      const valueToUse = handler(chartConfigValue);
      if (valueToUse && Object.keys(valueToUse).length > 0) {
        //@ts-ignore
        diff[key] = valueToUse;
      }
      continue;
    }

    if (!isEqual(chartConfigValue, defaultValue)) {
      //@ts-ignore
      diff[key] = chartConfigValue as unknown;
    }
  }

  return diff as BusterChartConfigProps;
};

export const combineChangeFromDefaultChartConfig = (
  newMetric: IBusterMetric,
  dataMetadata: DataMetadata
) => {
  const chartConfig = createDefaultChartConfig({
    chart_config: newMetric.chart_config,
    data_metadata: dataMetadata
  });
  return chartConfig;
};

export const prepareMetricUpdateMetric = (
  newMetric: IBusterMetric,
  prevMetric: IBusterMetric
): Parameters<typeof updateMetric>[0] | null => {
  const changedTopLevelValues = getChangedTopLevelMessageValues(
    newMetric,
    prevMetric
  ) as unknown as Parameters<typeof updateMetric>[0];
  const dataMetadata = prevMetric.data_metadata;

  const changedChartConfig = combineChangeFromDefaultChartConfig(newMetric, dataMetadata);

  return {
    ...changedTopLevelValues,
    chart_config: changedChartConfig,
    id: newMetric.id
  };
};
