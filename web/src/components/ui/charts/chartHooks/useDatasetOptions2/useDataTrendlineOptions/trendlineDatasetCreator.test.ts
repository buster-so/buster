import { trendlineDatasetCreator } from './trendlineDatasetCreator';
import { DATASET_IDS } from '../config';
import type { DatasetOption } from '../interfaces';
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

  describe('average operation', () => {
    it('should correctly calculate the average value from dataset', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
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
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.average('test-column-id'),
        data: [15],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 15 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 15 }]]);
    });

    it('should correctly handle decimal averages', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [10, 20, 15, 25],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.average('test-column-id'),
        data: [17.5],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
      expect(result[0].label).toEqual([[{ key: 'value', value: 17.5 }]]);
      expect(result[0].tooltipData).toEqual([[{ key: 'value', value: 17.5 }]]);
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [10, null, 20, undefined as unknown as null, 30],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.average('test-column-id'),
        data: [20],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
    });

    it('should handle negative values correctly', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
      };

      const datasets: DatasetOption[] = [
        {
          id: 'test-column-id',
          data: [-10, -20, 30, 20, -30],
          label: [[{ key: 'test-label', value: 'Test Label' }]],
          dataKey: 'test-column-id',
          axisType: 'y',
          tooltipData: [[{ key: 'test-tooltip', value: 'Test Tooltip' }]]
        }
      ];

      const columnLabelFormats = {};

      // Act
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: DATASET_IDS.average('test-column-id'),
        data: [-2],
        dataKey: 'test-column-id',
        axisType: 'y'
      });
    });

    it('should return empty array when no matching dataset is found', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'non-existent-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
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
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return empty array when dataset is empty', () => {
      // Arrange
      const trendline: Trendline = {
        type: 'average',
        columnId: 'test-column-id',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Average'
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
      const result = trendlineDatasetCreator.average(trendline, datasets, columnLabelFormats);

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
});
