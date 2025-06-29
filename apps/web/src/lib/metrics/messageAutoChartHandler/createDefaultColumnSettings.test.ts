import { describe, expect, it } from 'vitest';
import { type ColumnMetaData, DEFAULT_COLUMN_SETTINGS } from '@/api/asset_interfaces/metric';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { createDefaultColumnSettings } from './createDefaultColumnSettings';

describe('createDefaultColumnSettings', () => {
  it('should return empty object when columnsMetaData is undefined', () => {
    const result = createDefaultColumnSettings(undefined, undefined);
    expect(result).toEqual({});
  });

  it('should create default column settings for all columns', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'sales',
        simple_type: 'number',
        min_value: '0',
        max_value: '1000',
        unique_values: 100,
        type: 'float'
      },
      {
        name: 'category',
        simple_type: 'text',
        min_value: '',
        max_value: '',
        unique_values: 5,
        type: 'text'
      }
    ];

    const result = createDefaultColumnSettings(undefined, columnsMetaData);

    expect(Object.keys(result).length).toBe(2);
    expect(result).toHaveProperty('sales');
    expect(result).toHaveProperty('category');

    // Check that default settings are applied
    expect(result.sales).toEqual(DEFAULT_COLUMN_SETTINGS);
    expect(result.category).toEqual(DEFAULT_COLUMN_SETTINGS);
  });

  it('should merge existing column settings with defaults', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'revenue',
        simple_type: 'number',
        min_value: '0',
        max_value: '10000',
        unique_values: 200,
        type: 'float'
      }
    ];

    const existingColumnSettings: Record<string, ColumnSettings> = {
      revenue: {
        showDataLabels: true,
        columnVisualization: 'line',
        lineType: 'smooth'
      } as ColumnSettings
    };

    const result = createDefaultColumnSettings(existingColumnSettings, columnsMetaData);

    expect(Object.keys(result).length).toBe(1);
    expect(result).toHaveProperty('revenue');

    // Check that existing settings are preserved and defaults are applied for missing properties
    expect(result.revenue.showDataLabels).toBe(true);
    expect(result.revenue.columnVisualization).toBe('line');
    expect(result.revenue.lineType).toBe('smooth');
    expect(result.revenue.lineWidth).toBe(DEFAULT_COLUMN_SETTINGS.lineWidth);
    expect(result.revenue.barRoundness).toBe(DEFAULT_COLUMN_SETTINGS.barRoundness);
    expect(result.revenue.lineStyle).toBe(DEFAULT_COLUMN_SETTINGS.lineStyle);
    expect(result.revenue.lineSymbolSize).toBe(DEFAULT_COLUMN_SETTINGS.lineSymbolSize);
    expect(result.revenue.showDataLabelsAsPercentage).toBe(
      DEFAULT_COLUMN_SETTINGS.showDataLabelsAsPercentage
    );
  });
});
