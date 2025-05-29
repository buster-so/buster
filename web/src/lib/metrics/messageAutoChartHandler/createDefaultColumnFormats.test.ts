import { describe, expect, it } from 'vitest';
import type { ColumnMetaData, IColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { createDefaultColumnLabelFormats } from './createDefaultColumnFormats';

describe('createDefaultColumnFormats', () => {
  // Tests for the exported function
  it('should return empty object when columnsMetaData is undefined', () => {
    const result = createDefaultColumnLabelFormats(undefined, undefined);
    expect(result).toEqual({});
  });

  it('should create default column label formats for all columns', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'number_column',
        simple_type: 'number',
        min_value: '0',
        max_value: '100',
        unique_values: 10,
        type: 'float'
      },
      {
        name: 'text_column',
        simple_type: 'text',
        min_value: '',
        max_value: '',
        unique_values: 5,
        type: 'text'
      },
      {
        name: 'date_column',
        simple_type: 'date',
        min_value: '',
        max_value: '',
        unique_values: 3,
        type: 'date'
      }
    ];

    const result = createDefaultColumnLabelFormats(undefined, columnsMetaData);

    expect(Object.keys(result).length).toBe(3);
    expect(result).toHaveProperty('number_column');
    expect(result).toHaveProperty('text_column');
    expect(result).toHaveProperty('date_column');

    // Check number column format
    expect(result.number_column.columnType).toBe('number');
    expect(result.number_column.style).toBe('number');
    expect(result.number_column.replaceMissingDataWith).toBe(0);

    // Check text column format
    expect(result.text_column.columnType).toBe('text');
    expect(result.text_column.style).toBe('string');
    expect(result.text_column.replaceMissingDataWith).toBe(null);

    // Check date column format
    expect(result.date_column.columnType).toBe('date');
    expect(result.date_column.style).toBe('date');
    expect(result.date_column.replaceMissingDataWith).toBe(null);
  });

  it('should merge existing column label formats with defaults', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'number_column',
        simple_type: 'number',
        min_value: '0',
        max_value: '100',
        unique_values: 10,
        type: 'float'
      }
    ];

    const existingLabelFormats: Record<string, IColumnLabelFormat> = {
      number_column: {
        style: 'currency',
        suffix: '%',
        maximumFractionDigits: 1,
        columnType: 'number'
      }
    };

    const result = createDefaultColumnLabelFormats(existingLabelFormats, columnsMetaData);

    expect(result.number_column.style).toBe('currency');
    expect(result.number_column.suffix).toBe('%');
    expect(result.number_column.maximumFractionDigits).toBe(1);
    expect(result.number_column.columnType).toBe('number');
    expect(result.number_column.replaceMissingDataWith).toBe(0);
  });

  it('should handle columns with complex PostgreSQL types correctly', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'timestamp_column',
        simple_type: 'date',
        min_value: '',
        max_value: '',
        unique_values: 8,
        type: 'timestamptz'
      },
      {
        name: 'decimal_column',
        simple_type: 'number',
        min_value: '0.1',
        max_value: '999.99',
        unique_values: 50,
        type: 'decimal'
      }
    ];

    const result = createDefaultColumnLabelFormats(undefined, columnsMetaData);

    expect(Object.keys(result).length).toBe(2);

    // Check timestamp column format
    expect(result.timestamp_column.columnType).toBe('date');
    expect(result.timestamp_column.style).toBe('date');
    expect(result.timestamp_column.replaceMissingDataWith).toBe(null);

    // Check decimal column format
    expect(result.decimal_column.columnType).toBe('number');
    expect(result.decimal_column.style).toBe('number');
    expect(result.decimal_column.replaceMissingDataWith).toBe(0);
  });

  it('should handle empty columnsMetaData array', () => {
    const columnsMetaData: ColumnMetaData[] = [];

    const result = createDefaultColumnLabelFormats(undefined, columnsMetaData);

    expect(result).toEqual({});
  });

  it('should preserve existing column formats for columns not in columnsMetaData', () => {
    const columnsMetaData: ColumnMetaData[] = [
      {
        name: 'new_column',
        simple_type: 'number',
        min_value: '0',
        max_value: '100',
        unique_values: 10,
        type: 'float'
      }
    ];

    const existingLabelFormats: Record<string, IColumnLabelFormat> = {
      existing_column: {
        style: 'percent',
        columnType: 'number',
        suffix: '%'
      }
    };

    const result = createDefaultColumnLabelFormats(existingLabelFormats, columnsMetaData);

    // Should only have the new column (function only processes columns in columnsMetaData)
    expect(Object.keys(result).length).toBe(1);
    expect(result).toHaveProperty('new_column');
    expect(result).not.toHaveProperty('existing_column');

    // Check that new column has expected properties
    expect(result.new_column.columnType).toBe('number');
    expect(result.new_column.style).toBe('number');
    expect(result.new_column.replaceMissingDataWith).toBe(0);
  });
});
