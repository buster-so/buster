import { describe, expect, it } from 'vitest';
import type { ColumnMetaData, SimplifiedColumnType } from '@/api/asset_interfaces/metric';
import {
  ChartType,
  type IColumnLabelFormat,
  type ShowLegendHeadline
} from '@/api/asset_interfaces/metric/charts';
import type { DatasetOptionsWithTicks } from '../chartHooks/useDatasetOptions/interfaces';
import type { BusterChartLegendItem } from './interfaces';
import { addLegendHeadlines } from './legendHeadlineHelpers';

describe('legendHeadlineHelpers', () => {
  const mockLegendItems: BusterChartLegendItem[] = [
    {
      id: 'test-series',
      yAxisKey: 'value',
      data: [1, 2, 3, 4, 5],
      color: '#000000',
      inactive: false,
      type: 'line',
      formattedName: 'Test Series'
    }
  ];

  const mockDatasetOptions: DatasetOptionsWithTicks = {
    datasets: [],
    ticks: [[]],
    ticksKey: [{ key: 'x', value: '' }]
  };

  const mockColumnMetadata: ColumnMetaData[] = [
    {
      name: 'timestamp',
      min_value: '2024-01-01',
      max_value: '2024-01-31',
      unique_values: 1,
      simple_type: 'date',
      type: 'timestamp'
    }
  ];

  const mockColumnLabelFormats: Record<string, IColumnLabelFormat> = {
    timestamp: {
      columnType: 'timestamp' as SimplifiedColumnType,
      style: 'date'
    },
    value: {
      columnType: 'number' as SimplifiedColumnType,
      style: 'number'
    }
  };

  const mockXAxisKeys = ['timestamp'];

  describe('addLegendHeadlines', () => {
    it('should return original items when showLegendHeadline is false', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        false as ShowLegendHeadline,
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result).toEqual(mockLegendItems);
    });

    it('should return original items for scatter chart type', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'current',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'scatter',
        mockXAxisKeys
      );

      expect(result).toEqual(mockLegendItems);
    });

    it('should calculate current value for pie chart', () => {
      const pieChartLegendItems: BusterChartLegendItem[] = [
        {
          id: 'pie-slice',
          yAxisKey: 'value',
          data: [10],
          color: '#000000',
          inactive: false,
          type: 'pie',
          formattedName: 'Pie Slice'
        }
      ];

      const result = addLegendHeadlines(
        pieChartLegendItems,
        mockDatasetOptions,
        'current',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'pie',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'current',
        titleAmount: '10'
      });
    });

    it('should calculate average for line chart', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'average',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'average',
        titleAmount: '3' // average of [1,2,3,4,5]
      });
    });

    it('should calculate total for line chart', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'total',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'total',
        titleAmount: '15' // sum of [1,2,3,4,5]
      });
    });

    it('should handle invalid data gracefully', () => {
      const invalidLegendItems: BusterChartLegendItem[] = [
        {
          id: 'invalid-data',
          yAxisKey: 'value',
          data: [],
          color: '#000000',
          inactive: false,
          type: 'line',
          formattedName: 'Invalid Data'
        }
      ];

      const result = addLegendHeadlines(
        invalidLegendItems,
        mockDatasetOptions,
        'average',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'average',
        titleAmount: '0'
      });
    });

    it('should calculate min value for line chart', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'min',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'min',
        titleAmount: '1'
      });
    });

    it('should calculate max value for line chart', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'max',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'max',
        titleAmount: '5'
      });
    });

    it('should calculate median for line chart', () => {
      const result = addLegendHeadlines(
        mockLegendItems,
        mockDatasetOptions,
        'median',
        mockColumnMetadata,
        mockColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'median',
        titleAmount: '3'
      });
    });

    it('should format values as currency when style is currency', () => {
      const currencyLegendItems: BusterChartLegendItem[] = [
        {
          id: 'revenue',
          yAxisKey: 'revenue',
          data: [1000, 2000, 3000, 4000, 5000],
          color: '#000000',
          inactive: false,
          type: 'line',
          formattedName: 'Revenue'
        }
      ];

      const currencyColumnLabelFormats: Record<string, IColumnLabelFormat> = {
        ...mockColumnLabelFormats,
        revenue: {
          columnType: 'number' as SimplifiedColumnType,
          style: 'currency'
        }
      };

      const result = addLegendHeadlines(
        currencyLegendItems,
        mockDatasetOptions,
        'total',
        mockColumnMetadata,
        currencyColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'total',
        titleAmount: '$15,000.00'
      });
    });

    it('should format values with prefix when style is prefix', () => {
      const prefixLegendItems: BusterChartLegendItem[] = [
        {
          id: 'users',
          yAxisKey: 'users',
          data: [10, 20, 30, 40, 50],
          color: '#000000',
          inactive: false,
          type: 'line',
          formattedName: 'Active Users'
        }
      ];

      const prefixColumnLabelFormats: Record<string, IColumnLabelFormat> = {
        ...mockColumnLabelFormats,
        users: {
          columnType: 'number' as SimplifiedColumnType,
          style: 'number',
          prefix: '👥 '
        }
      };

      const result = addLegendHeadlines(
        prefixLegendItems,
        mockDatasetOptions,
        'average',
        mockColumnMetadata,
        prefixColumnLabelFormats,
        'line',
        mockXAxisKeys
      );

      expect(result[0].headline).toEqual({
        type: 'average',
        titleAmount: '👥 30'
      });
    });
  });
});
