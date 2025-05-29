import type { ColumnMetaData } from '@/api/asset_interfaces/metric';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { sortLineBarData } from './datasetHelpers_BarLinePie';

describe('sortLineBarData', () => {
  test('returns original data when xFieldSorts is empty', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const columnMetadata: ColumnMetaData[] = [];
    const xFieldSorts: string[] = [];
    const xFields: string[] = [];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual(data);
    // When xFieldSorts is empty, the function returns the original array reference
    expect(result).toBe(data);
  });

  test('sorts numeric fields correctly', () => {
    const data = [
      { id: 3, value: 30 },
      { id: 1, value: 10 },
      { id: 2, value: 20 }
    ];
    const columnMetadata: ColumnMetaData[] = [
      {
        name: 'value',
        simple_type: 'number',
        type: 'integer',
        min_value: 10,
        max_value: 30,
        unique_values: 3
      }
    ];
    const xFieldSorts = ['value'];
    const xFields = ['value'];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual([
      { id: 1, value: 10 },
      { id: 2, value: 20 },
      { id: 3, value: 30 }
    ]);
  });

  test('sorts date fields correctly', () => {
    const data = [
      { id: 3, created: '2023-03-01' },
      { id: 1, created: '2023-01-01' },
      { id: 2, created: '2023-02-01' }
    ];
    const columnMetadata: ColumnMetaData[] = [
      {
        name: 'created',
        simple_type: 'date',
        type: 'date',
        min_value: '2023-01-01',
        max_value: '2023-03-01',
        unique_values: 3
      }
    ];
    const xFieldSorts = ['created'];
    const xFields = ['created'];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual([
      { id: 1, created: '2023-01-01' },
      { id: 2, created: '2023-02-01' },
      { id: 3, created: '2023-03-01' }
    ]);
  });

  test('sorts text fields correctly', () => {
    const data = [
      { id: 3, name: 'Charlie' },
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];
    const columnMetadata: ColumnMetaData[] = [
      {
        name: 'name',
        simple_type: 'text',
        type: 'text',
        min_value: 'Alice',
        max_value: 'Charlie',
        unique_values: 3
      }
    ];
    const xFieldSorts = ['name'];
    const xFields = ['name'];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ]);
  });

  test('handles multiple sort fields correctly', () => {
    const data = [
      { id: 1, category: 'A', value: 30 },
      { id: 2, category: 'B', value: 10 },
      { id: 3, category: 'A', value: 10 },
      { id: 4, category: 'B', value: 20 }
    ];
    const columnMetadata: ColumnMetaData[] = [
      {
        name: 'category',
        simple_type: 'text',
        type: 'text',
        min_value: 'A',
        max_value: 'B',
        unique_values: 2
      },
      {
        name: 'value',
        simple_type: 'number',
        type: 'integer',
        min_value: 10,
        max_value: 30,
        unique_values: 3
      }
    ];
    const xFieldSorts = ['category', 'value'];
    const xFields = ['category', 'value'];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual([
      { id: 3, category: 'A', value: 10 },
      { id: 1, category: 'A', value: 30 },
      { id: 2, category: 'B', value: 10 },
      { id: 4, category: 'B', value: 20 }
    ]);
  });

  test('falls back to type inference when metadata is missing', () => {
    const data = [
      { id: 3, value: 30 },
      { id: 1, value: 10 },
      { id: 2, value: 20 }
    ];
    const columnMetadata: ColumnMetaData[] = [];
    const xFieldSorts = ['value'];
    const xFields = ['value'];

    const result = sortLineBarData(data, columnMetadata, xFieldSorts, xFields);
    expect(result).toEqual([
      { id: 1, value: 10 },
      { id: 2, value: 20 },
      { id: 3, value: 30 }
    ]);
  });
});
