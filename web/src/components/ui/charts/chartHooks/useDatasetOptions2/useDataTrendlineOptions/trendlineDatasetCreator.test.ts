import { trendlineDatasetCreator } from './trendlineDatasetCreator';
import { DATASET_IDS } from '../config';
import type { DatasetOption } from '../interfaces';
import type { IColumnLabelFormat, Trendline } from '@/api/asset_interfaces/metric/charts';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.max(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.max(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.min(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(trendline, datasets, columnLabelFormats);

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

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.median(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('linear_regression', () => {
    it('should calculate linear regression for numeric data correctly', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'linear_regression' as const,
        columnId: 'testColumn',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Linear Regression'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'testColumn',
          data: [10, 20, 30, 40, 50],
          dataKey: 'xAxis',
          axisType: 'y' as const,
          tooltipData: [],
          label: []
        }
      ];

      const columnLabelFormats: Record<string, IColumnLabelFormat> = {
        xAxis: {
          ...DEFAULT_COLUMN_LABEL_FORMAT,
          columnType: 'number'
        }
      };

      // Act
      const result = trendlineDatasetCreator.linear_regression(
        trendline,
        datasets,
        columnLabelFormats
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(DATASET_IDS.linearRegression('testColumn'));
      expect(result[0].dataKey).toBe('testColumn');
      expect(result[0].axisType).toBe('y');
      expect(result[0].data).toHaveLength(5);
      expect(result[0].label[0][0].value).toBe('Linear Regression (Numeric)');
    });
  });
});
