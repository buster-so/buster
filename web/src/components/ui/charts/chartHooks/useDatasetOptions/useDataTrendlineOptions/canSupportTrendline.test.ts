import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric/charts';
import { isNumericColumnType } from '@/lib/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canSupportTrendlineRecord } from './canSupportTrendline';

// Mock the isNumericColumnType function
vi.mock('@/lib/messages', () => ({
  isNumericColumnType: vi.fn()
}));

const mockedIsNumericColumnType = isNumericColumnType as any;

describe('canSupportTrendlineRecord', () => {
  const trendlineTypes: Trendline['type'][] = [
    'linear_regression',
    'logarithmic_regression',
    'exponential_regression',
    'polynomial_regression',
    'min',
    'max',
    'median',
    'average'
  ];

  const columnId = 'test-column';
  const mockColumnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']> = {
    [columnId]: {
      columnType: 'number',
      style: 'number'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.each(trendlineTypes)(
    'returns true when %s trendline has a numeric column type',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(true);
      const trendline: Trendline = {
        type: trendlineType,
        columnId,
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      };

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(true);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith('number');
    }
  );

  test.each(trendlineTypes)(
    'returns false when %s trendline has a non-numeric column type',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(false);
      const trendline: Trendline = {
        type: trendlineType,
        columnId,
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      };

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(false);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith('number');
    }
  );

  test.each(trendlineTypes)(
    'uses DEFAULT_COLUMN_LABEL_FORMAT when column format not provided for %s',
    (trendlineType) => {
      // Arrange
      mockedIsNumericColumnType.mockReturnValue(true);
      const trendline: Trendline = {
        type: trendlineType,
        columnId: 'non-existent',
        show: true,
        showTrendlineLabel: true,
        trendlineLabel: 'Test Label'
      };

      // Act
      const result = canSupportTrendlineRecord[trendlineType](mockColumnLabelFormats, trendline);

      // Assert
      expect(result).toBe(true);
      expect(mockedIsNumericColumnType).toHaveBeenCalledWith(
        DEFAULT_COLUMN_LABEL_FORMAT.columnType
      );
    }
  );
  it('confirms all trendline types are tested', () => {
    // This test ensures we've covered all trendline types in our tests
    const allTrendlineTypes = Object.keys(canSupportTrendlineRecord) as Trendline['type'][];
    expect(allTrendlineTypes.sort()).toEqual(trendlineTypes.sort());
  });
});
