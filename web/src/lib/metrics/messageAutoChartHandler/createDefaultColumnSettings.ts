import { create } from 'mutative';
import {
  type ColumnMetaData,
  DEFAULT_COLUMN_SETTINGS,
  type IBusterMetricChartConfig
} from '@/api/asset_interfaces/metric';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';

export const createDefaultColumnSettings = (
  existingColumnSettings: Record<string, ColumnSettings> | undefined,
  columnsMetaData: ColumnMetaData[] | undefined
): IBusterMetricChartConfig['columnSettings'] => {
  if (!columnsMetaData) return {};

  return create({} as IBusterMetricChartConfig['columnSettings'], (draft) => {
    for (const column of columnsMetaData) {
      draft[column.name] = create(DEFAULT_COLUMN_SETTINGS, (settingsDraft) => {
        if (existingColumnSettings?.[column.name]) {
          Object.assign(settingsDraft, existingColumnSettings[column.name]);
        }
      });
    }
  });
};
