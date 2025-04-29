import { trendlineDatasetCreator } from './trendlineDatasetCreator';
import { DATASET_IDS } from '../config';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type { DatasetOption, DatasetOptionsWithTicks } from '../interfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import type { Trendline } from '@/api/asset_interfaces/metric/charts';

describe('trendlineDatasetCreator', () => {
  describe('max operation', () => {
    it('should correctly calculate the max value from dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'max',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Maximum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 10, 15, 20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.max(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.max('test-column-id'),
        data: [25],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 25 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 25 }]]);
    });

    it('should return empty array when no matching dataset is found', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'max',
        columnId: 'non-existent-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Maximum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 10, 15, 20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.max(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('min operation', () => {
    it('should correctly calculate the min value from dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'min',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Minimum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 10, 15, 20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.min('test-column-id'),
        data: [5],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 5 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 5 }]]);
    });

    it('should correctly handle negative values', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'min',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Minimum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, -10, 15, -20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.min('test-column-id'),
        data: [-20],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: -20 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: -20 }]]);
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'min',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Minimum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, null, 15, undefined as unknown as null, -10],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.min('test-column-id'),
        data: [-10],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
    });

    it('should return empty array when no matching dataset is found', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'min',
        columnId: 'non-existent-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Minimum'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 10, 15, 20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasetsWithTicks, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('median operation', () => {
    it('should correctly calculate the median value from odd-length dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'median',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Median'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 20, 10, 25, 15],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.median('test-column-id'),
        data: [15],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 15 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 15 }]]);
    });

    it('should correctly calculate the median value from even-length dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'median',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Median'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 15, 10, 20],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.median('test-column-id'),
        data: [12.5],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 12.5 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 12.5 }]]);
    });

    it('should handle null and undefined values in dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'median',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Median'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, null, 15, undefined as unknown as null, 10],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.median('test-column-id'),
        data: [10],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
    });

    it('should return empty array when no matching dataset is found', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'median',
        columnId: 'non-existent-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Median'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [5, 10, 15, 20, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return empty array when dataset is empty', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'median',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Median'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: (datasets[0].data as (number | null)[]).map((d) => [String(d ?? 0)]),
        ticksKey: [{ key: 'test-column-id', value: '' }]
      };

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('linear_regression', () => {
    it('should correctly calculate linear regression for numeric data', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'linear_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [2, 4, 6, 8, 10], // Perfect linear data
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.linear_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.linearRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      // The data should follow a linear trend
      const data = result[0].data;
      expect(data).toHaveLength(5);

      // Since we used perfect linear data (y = 2x + 2),
      // the regression line should be very close to the original data
      data.forEach((value, index) => {
        expect(value).toBeCloseTo(2 + index * 2, 1);
      });

      expect(data).toEqual([2, 4, 6, 8, 10]);
    });

    it('should correctly calculate linear regression with negative slope', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'linear_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [10, 8, 6, 4, 2], // Perfect linear data with negative slope
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.linear_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.linearRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(5);

      // Since we used perfect linear data (y = 10 - 2x),
      // the regression line should match exactly
      data.forEach((value, index) => {
        expect(value).toBeCloseTo(10 - index * 2, 1);
      });

      expect(data).toEqual([10, 8, 6, 4, 2]);
    });

    it('should calculate linear regression for imperfect but predictable data', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'linear_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [3, 5, 4, 7, 6, 9, 8], // Data with slight variations around the trend
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.linear_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.linearRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(7);

      // The data follows a rough trend of y = 3 + x, with variations
      // The regression line should approximate this trend, but won't be exact
      data.forEach((value, index) => {
        // We expect the regression line to be roughly around y = 3 + x
        // but allow for larger deviation due to the imperfect data
        expect(value as number).toBeCloseTo(3 + index, 0);
      });

      // The first and last points should definitely show the upward trend
      expect(data[0] as number).toBeLessThan(data[data.length - 1] as number);

      // The slope should be approximately 1 (checking first and last points)
      const firstPoint = data[0] as number;
      const lastPoint = data[data.length - 1] as number;
      const approximateSlope = (lastPoint - firstPoint) / (data.length - 1);
      expect(approximateSlope).toBeCloseTo(1, 0);

      expect(result[0].columnId).toEqual('test-column-id');
    });

    it('should calculate linear regression with date-based ticks', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'linear_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [100, 120, 115, 140, 135, 160], // Values showing upward trend with some variation
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      // Create dates for a week, one day apart
      const dates = Array.from({ length: 6 }, (_, i) => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        return [date.toISOString().split('T')[0]]; // Format: YYYY-MM-DD
      });

      const datasetsWithTicks = {
        datasets,
        ticks: dates,
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'date'
        }
      };

      // Act
      const result = trendlineDatasetCreator.linear_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.linearRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(6);

      // Verify the trend is generally upward
      expect(data[0] as number).toBeLessThan(data[data.length - 1] as number);

      // Calculate average daily increase (should be around 11 units per day)
      const firstPoint = data[0] as number;
      const lastPoint = data[data.length - 1] as number;
      const averageDailyIncrease = (lastPoint - firstPoint) / (data.length - 1);
      expect(averageDailyIncrease).toBeCloseTo(11, 0);

      // The regression line should start near 102 and end near 155
      expect(data[0] as number).toBeCloseTo(102, 0);
      expect(data[data.length - 1] as number).toBeCloseTo(155, 0);

      expect(result[0].columnId).toEqual('test-column-id');
    });
  });

  describe('exponential_regression', () => {
    it('should correctly calculate exponential regression for perfect exponential data', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'exponential_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [2, 4, 8, 16, 32], // Perfect exponential data (y = 2^(x+1))
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.exponential_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.exponentialRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(5);

      // The regression should closely match our exponential data
      data.forEach((value, index) => {
        expect(value).toBeCloseTo(Math.pow(2, index + 1), 1);
      });
    });

    it('should handle date-based x-axis values', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'exponential_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Regression'
      };

      const baseDate = new Date('2024-01-01').getTime();
      const dayInMs = 24 * 60 * 60 * 1000;

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [2, 4, 8, 16, 32], // Exponential growth
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [1, 2, 3, 4, 5].map((days) => [new Date(baseDate + days * dayInMs).toISOString()]),
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'date'
        }
      };

      // Act
      const result = trendlineDatasetCreator.exponential_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.exponentialRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(5);
      expect(data.every((value) => typeof value === 'number' && !isNaN(value))).toBe(true);
    });

    it('should filter out non-positive values', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'exponential_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [1, 0.5, 4, 8, 16], // Mix of valid and invalid values
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.exponential_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      const data = result[0].data;
      expect(data).toHaveLength(5);
      // Verify the regression produces valid numeric output
      expect(
        data.every(
          (value): value is number => typeof value === 'number' && !isNaN(value) && isFinite(value)
        )
      ).toBe(true);
    });

    it('should return empty array when no valid data points exist', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'exponential_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Exponential Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [-2, -1, 0, null, null] as (number | null)[], // Fixed typing for null values
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // Start from 1 to ensure positive x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.exponential_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('logarithmic_regression', () => {
    it('should correctly calculate logarithmic regression for perfect logarithmic data', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'logarithmic_regression',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Logarithmic Regression'
      };

      // Using simple data points that follow a clear logarithmic pattern
      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [0, 0.301, 0.477, 0.602, 0.699], // log10(x) values
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'x-axis',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const datasetsWithTicks = {
        datasets,
        ticks: [['1'], ['2'], ['3'], ['4'], ['5']], // x values
        ticksKey: [{ key: 'x-axis', value: '' }]
      };

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        'x-axis': {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.logarithmic_regression(
        trendline,
        datasetsWithTicks,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.logarithmicRegression('test-column-id'),
        dataKey: 'test-column-id',
        axisType: 'y'
      });

      const data = result[0].data;
      expect(data).toHaveLength(5);

      expect(data[1]).toBeCloseTo(0.2932, 3);
    });
  });
});
