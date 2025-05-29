import { describe, it, expect } from 'vitest';
import { didColumnDataChange, simplifyChatConfigForSQLChange } from './helpers';
import type {
  IBusterMetric,
  ColumnMetaData,
  IBusterMetricChartConfig
} from '../../../../api/asset_interfaces';
import {
  DEFAULT_CHART_CONFIG,
  DEFAULT_COLUMN_LABEL_FORMAT
} from '../../../../api/asset_interfaces';
import type { IColumnLabelFormat } from '../../../../api/asset_interfaces/metric/charts';

const createColumnMetaData = (
  name: string,
  simple_type: 'text' | 'number' | 'date'
): ColumnMetaData => ({
  name,
  simple_type,
  min_value: 0,
  max_value: 100,
  unique_values: 1,
  type: simple_type === 'text' ? 'text' : simple_type === 'number' ? 'float' : 'date'
});

describe('didColumnDataChange', () => {
  it('should return true when either input is undefined', () => {
    const columnData: ColumnMetaData[] = [createColumnMetaData('col1', 'text')];
    expect(didColumnDataChange(undefined, columnData)).toBe(true);
    expect(didColumnDataChange(columnData, undefined)).toBe(true);
    expect(didColumnDataChange(undefined, undefined)).toBe(true);
  });

  it('should return true when column counts are different', () => {
    const oldData: ColumnMetaData[] = [createColumnMetaData('col1', 'text')];
    const newData: ColumnMetaData[] = [
      createColumnMetaData('col1', 'text'),
      createColumnMetaData('col2', 'number')
    ];
    expect(didColumnDataChange(oldData, newData)).toBe(true);
  });

  it('should return true when column names are different', () => {
    const oldData: ColumnMetaData[] = [createColumnMetaData('col1', 'text')];
    const newData: ColumnMetaData[] = [createColumnMetaData('col2', 'text')];
    expect(didColumnDataChange(oldData, newData)).toBe(true);
  });

  it('should return true when column types are different', () => {
    const oldData: ColumnMetaData[] = [createColumnMetaData('col1', 'text')];
    const newData: ColumnMetaData[] = [createColumnMetaData('col1', 'number')];
    expect(didColumnDataChange(oldData, newData)).toBe(true);
  });

  it('should return false when columns are identical', () => {
    const oldData: ColumnMetaData[] = [
      createColumnMetaData('col1', 'text'),
      createColumnMetaData('col2', 'number')
    ];
    const newData: ColumnMetaData[] = [
      createColumnMetaData('col1', 'text'),
      createColumnMetaData('col2', 'number')
    ];
    expect(didColumnDataChange(oldData, newData)).toBe(false);
  });
});

describe('simplifyChatConfigForSQLChange', () => {
  it('should handle empty metadata', () => {
    const chartConfig: Partial<IBusterMetricChartConfig> = {
      ...DEFAULT_CHART_CONFIG,
      columnLabelFormats: {}
    };
    const data_metadata: IBusterMetric['data_metadata'] = {
      column_count: 0,
      column_metadata: [],
      row_count: 0
    };

    const result = simplifyChatConfigForSQLChange(
      chartConfig as IBusterMetricChartConfig,
      data_metadata
    );
    expect(result.columnLabelFormats).toEqual({});
  });

  it('should preserve column formats when types have not changed', () => {
    const columnLabelFormats: Record<string, Required<IColumnLabelFormat>> = {
      col1: {
        columnType: 'text',
        style: 'string',
        displayName: '',
        numberSeparatorStyle: null,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        useRelativeTime: false,
        isUTC: false,
        makeLabelHumanReadable: false,
        currency: 'USD',
        compactNumbers: false,
        dateFormat: 'MM/DD/YYYY',
        convertNumberTo: null
      }
    };

    const chartConfig = {
      ...DEFAULT_CHART_CONFIG,
      columnLabelFormats
    };

    const data_metadata: IBusterMetric['data_metadata'] = {
      column_count: 1,
      column_metadata: [createColumnMetaData('col1', 'text')],
      row_count: 1
    };

    const result = simplifyChatConfigForSQLChange(chartConfig, data_metadata);
    expect(result.columnLabelFormats.col1.columnType).toEqual('text');
    expect(result.columnLabelFormats?.col1).toEqual(columnLabelFormats.col1);
  });

  it('should reset column format when type has changed', () => {
    const columnLabelFormats: Record<string, Required<IColumnLabelFormat>> = {
      col1: {
        columnType: 'text',
        style: 'string',
        displayName: '',
        numberSeparatorStyle: null,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        useRelativeTime: false,
        isUTC: false,
        makeLabelHumanReadable: false,
        currency: 'USD',
        compactNumbers: false,
        dateFormat: 'MM/DD/YYYY',
        convertNumberTo: null
      }
    };

    const chartConfig: Partial<IBusterMetricChartConfig> = {
      ...DEFAULT_CHART_CONFIG,
      columnLabelFormats
    };

    const data_metadata: IBusterMetric['data_metadata'] = {
      column_count: 1,
      column_metadata: [createColumnMetaData('col1', 'number')],
      row_count: 1
    };

    const result = simplifyChatConfigForSQLChange(
      chartConfig as IBusterMetricChartConfig,
      data_metadata
    );
    expect(result.columnLabelFormats?.col1).toEqual({
      ...DEFAULT_COLUMN_LABEL_FORMAT,
      columnType: 'number',
      style: 'number'
    });
  });
});
