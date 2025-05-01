import { describe, it, expect } from '@jest/globals';
import { dataMapper } from './dataMapper';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type { DatasetOption } from '../interfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';

describe('dataMapper', () => {
  it('should handle numeric x-axis values correctly', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [10, 20, 30],
      dataKey: 'xAxis',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const ticks = {
      ticks: [['1'], ['2'], ['3']],
      ticksKey: [{ key: 'xAxis', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      xAxis: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);
    expect(result).toEqual([
      [0, 10],
      [1, 20],
      [2, 30]
    ]);
  });

  it('should handle date x-axis values correctly', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [100, 200, 300],
      dataKey: 'date',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const dates = ['2023-01-01', '2023-01-02', '2023-01-03'];
    const ticks = {
      ticks: dates.map((d) => [d]),
      ticksKey: [{ key: 'date', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      date: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'date',
        style: 'date'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);

    // Test that we have the right number of data points
    expect(result.length).toBe(3);

    // Test that data values map correctly
    expect(result[0][1]).toBe(100);
    expect(result[1][1]).toBe(200);
    expect(result[2][1]).toBe(300);

    // Test that dates are in sequential order with expected increments
    const dayInMs = 24 * 60 * 60 * 1000;
    expect(result[1][0] - result[0][0]).toBeCloseTo(dayInMs);
    expect(result[2][0] - result[1][0]).toBeCloseTo(dayInMs);
  });

  it('should handle categorical x-axis values by using indices', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [15, 25, 35],
      dataKey: 'category',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const ticks = {
      ticks: [['A'], ['B'], ['C']],
      ticksKey: [{ key: 'category', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      category: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'text',
        style: 'string'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);
    expect(result).toEqual([
      [0, 15],
      [1, 25],
      [2, 35]
    ]);
  });

  it('should handle null/undefined values correctly', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [10, null, 30, null, 50] as (number | null)[],
      dataKey: 'xAxis',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const ticks = {
      ticks: [['1'], ['2'], ['3'], ['4'], ['5']],
      ticksKey: [{ key: 'xAxis', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      xAxis: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);
    expect(result).toEqual([
      [0, 10],
      [1, 0],
      [2, 30],
      [3, 0],
      [4, 50]
    ]);
  });

  it('should return empty array for empty dataset', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [],
      dataKey: 'xAxis',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const ticks = {
      ticks: [],
      ticksKey: [{ key: 'xAxis', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      xAxis: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);
    expect(result).toEqual([]);
  });

  it('should handle missing ticks correctly', () => {
    const dataset: DatasetOption = {
      id: 'test',
      data: [10, 20, 30],
      dataKey: 'xAxis',
      axisType: 'y',
      tooltipData: [],
      label: []
    };

    const ticks = {
      ticks: [['1'], [], ['3']], // Missing tick in the middle
      ticksKey: [{ key: 'xAxis', value: '' }]
    };

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      xAxis: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        columnType: 'number',
        style: 'number'
      }
    };

    const result = dataMapper(dataset, ticks, columnLabelFormats);
    expect(result).toEqual([
      [0, 10],
      [1, 30]
    ]);
  });
});
