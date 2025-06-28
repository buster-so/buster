import type { Chart } from 'chart.js';
import { describe, expect, it } from 'vitest';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts/columnInterfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts/columnLabelInterfaces';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric/charts/enum';
import { getLegendItems } from './getLegendItems';

describe('getLegendItems', () => {
  const mockColors = ['#FF0000', '#00FF00', '#0000FF'];
  const defaultColumnSettings: Record<string, ColumnSettings> = {
    value: { columnVisualization: 'bar' },
    value2: { columnVisualization: 'line' }
  };
  const defaultColumnLabelFormats: Record<string, IColumnLabelFormat> = {
    value: {
      columnType: 'number' as SimplifiedColumnType,
      style: 'number'
    },
    value2: {
      columnType: 'number' as SimplifiedColumnType,
      style: 'number'
    }
  };

  it('should return empty array when chart data is not available', () => {
    const mockChartRef = { current: null };
    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: {},
      selectedChartType: 'bar',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toEqual([]);
  });

  it('should handle pie chart data correctly', () => {
    const mockChartRef = {
      current: {
        config: { type: 'pie' },
        data: {
          labels: ['Category 1', 'Category 2'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [10, 20],
              yAxisKey: 'value'
            }
          ]
        }
      } as unknown as Chart
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: {},
      selectedChartType: 'pie',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      color: mockColors[0],
      inactive: undefined,
      type: 'pie',
      serieName: 'Dataset 1',
      formattedName: 'Category 1',
      id: 'Category 1',
      data: [10, 20],
      yAxisKey: 'value'
    });
  });

  it('should handle combo chart data correctly', () => {
    const mockChartRef = {
      current: {
        config: { type: 'bar' },
        data: {
          datasets: [
            {
              label: 'Bar Data',
              data: [10, 20],
              yAxisKey: 'value',
              hidden: false,
              isTrendline: false
            },
            {
              label: 'Line Data',
              data: [15, 25],
              yAxisKey: 'value2',
              hidden: false,
              isTrendline: false
            }
          ]
        }
      } as unknown as Chart
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: {},
      selectedChartType: 'combo',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      color: mockColors[0],
      inactive: undefined,
      type: 'bar',
      formattedName: 'Bar Data',
      id: 'Bar Data',
      data: [10, 20],
      yAxisKey: 'value'
    });
    expect(result[1].type).toBe('line');
  });

  it('should handle scatter plot visualization in combo charts', () => {
    const mockChartRef = {
      current: {
        config: { type: 'bar' },
        data: {
          datasets: [
            {
              label: 'Scatter Data',
              data: [10, 20],
              yAxisKey: 'value3',
              hidden: false,
              isTrendline: false
            }
          ]
        }
      } as unknown as Chart
    };

    const customColumnSettings: Record<string, ColumnSettings> = {
      ...defaultColumnSettings,
      value3: { columnVisualization: 'dot' }
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: {},
      selectedChartType: 'combo',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: customColumnSettings
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('scatter');
  });

  it('should mark datasets as inactive based on inactiveDatasets prop', () => {
    const mockChartRef = {
      current: {
        config: { type: 'bar' },
        data: {
          datasets: [
            {
              label: 'Active Dataset',
              data: [10, 20],
              yAxisKey: 'value',
              hidden: false,
              isTrendline: false
            },
            {
              label: 'Inactive Dataset',
              data: [15, 25],
              yAxisKey: 'value2',
              hidden: false,
              isTrendline: false
            }
          ]
        }
      } as unknown as Chart
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: { 'Inactive Dataset': true },
      selectedChartType: 'bar',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toHaveLength(2);
    expect(result[0].inactive).toBe(undefined);
    expect(result[0].id).toBe('Active Dataset');
    expect(result[1].inactive).toBe(true);
    expect(result[1].id).toBe('Inactive Dataset');
  });

  it('should handle multiple datasets in pie charts with proper formatting', () => {
    const mockChartRef = {
      current: {
        config: { type: 'pie' },
        data: {
          labels: ['Category A', 'Category B'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [30, 70],
              yAxisKey: 'value'
            },
            {
              label: 'Dataset 2',
              data: [40, 60],
              yAxisKey: 'value2'
            }
          ]
        }
      } as unknown as Chart
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors,
      inactiveDatasets: {},
      selectedChartType: 'pie',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toHaveLength(4);
    // First dataset categories
    expect(result[0]).toEqual({
      color: mockColors[0],
      inactive: undefined,
      type: 'pie',
      serieName: 'Dataset 1',
      formattedName: 'Category A | Dataset 1',
      id: 'Category A',
      data: [30, 70],
      yAxisKey: 'value'
    });
    expect(result[1]).toEqual({
      color: mockColors[1],
      inactive: undefined,
      type: 'pie',
      serieName: 'Dataset 1',
      formattedName: 'Category B | Dataset 1',
      id: 'Category B',
      data: [30, 70],
      yAxisKey: 'value'
    });
    // Second dataset categories should have different formatted names
    expect(result[2].formattedName).toBe('Category A | Dataset 2');
    expect(result[3].formattedName).toBe('Category B | Dataset 2');
  });

  it('should cycle through colors for datasets exceeding color array length', () => {
    const mockChartRef = {
      current: {
        config: { type: 'bar' },
        data: {
          datasets: Array.from({ length: 5 }, (_, i) => ({
            label: `Dataset ${i + 1}`,
            data: [10, 20],
            yAxisKey: 'value',
            hidden: false,
            isTrendline: false
          }))
        }
      } as unknown as Chart
    };

    const result = getLegendItems({
      chartRef: mockChartRef,
      colors: mockColors, // Only 3 colors defined
      inactiveDatasets: {},
      selectedChartType: 'bar',
      columnLabelFormats: defaultColumnLabelFormats,
      columnSettings: defaultColumnSettings
    });

    expect(result).toHaveLength(5);
    // First three datasets should use unique colors
    expect(result[0].color).toBe(mockColors[0]);
    expect(result[1].color).toBe(mockColors[1]);
    expect(result[2].color).toBe(mockColors[2]);
    // Colors should cycle back
    expect(result[3].color).toBe(mockColors[0]);
    expect(result[4].color).toBe(mockColors[1]);
  });
});
