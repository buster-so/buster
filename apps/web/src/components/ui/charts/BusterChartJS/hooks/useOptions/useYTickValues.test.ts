import type { ColumnMetaData } from '@buster/server-shared/metrics';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useYTickValues } from './useYTickValues';

describe('useYTickValues', () => {
  const mockColumnMetadata: ColumnMetaData[] = [
    {
      name: 'revenue',
      min_value: 1000,
      max_value: 10000,
      unique_values: 100,
      simple_type: 'number',
      type: 'float',
    },
    {
      name: 'conversion_rate',
      min_value: 0.1,
      max_value: 0.9,
      unique_values: 50,
      simple_type: 'number',
      type: 'float',
    },
    {
      name: 'profit_margin',
      min_value: -0.05,
      max_value: 0.25,
      unique_values: 25,
      simple_type: 'number',
      type: 'float',
    },
  ];

  const defaultProps = {
    hasY2Axis: true,
    columnMetadata: mockColumnMetadata,
    selectedChartType: 'combo' as const,
    yAxisKeys: ['revenue'],
    y2AxisKeys: ['conversion_rate'],
    columnLabelFormats: {
      revenue: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const, suffix: '$' },
      conversion_rate: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
      profit_margin: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
    },
  };

  describe('Basic conditions - should return undefined values', () => {
    it('should return undefined values when hasY2Axis is false', () => {
      const props = {
        ...defaultProps,
        hasY2Axis: false,
      };

      const { result } = renderHook(() => useYTickValues(props));

      expect(result.current.minTickValue).toBeUndefined();
      expect(result.current.maxTickValue).toBeUndefined();
    });

    it('should return undefined values when selectedChartType is not combo', () => {
      const props = {
        ...defaultProps,
        selectedChartType: 'line' as const,
      };

      const { result } = renderHook(() => useYTickValues(props));

      expect(result.current.minTickValue).toBeUndefined();
      expect(result.current.maxTickValue).toBeUndefined();
    });

    it('should return undefined values when columnMetadata is undefined', () => {
      const props = {
        ...defaultProps,
        columnMetadata: undefined,
      };

      const { result } = renderHook(() => useYTickValues(props));

      expect(result.current.minTickValue).toBeUndefined();
      expect(result.current.maxTickValue).toBeUndefined();
    });
  });

  describe('Percentage value scenarios', () => {
    it('should handle all Y values being percentages', () => {
      const props = {
        ...defaultProps,
        yAxisKeys: ['conversion_rate'],
        y2AxisKeys: ['profit_margin'],
        columnLabelFormats: {
          conversion_rate: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
          profit_margin: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // When all values are percentages, it should return the lowest min value
      expect(result.current.minTickValue).toBe(-0.05); // profit_margin min_value
      // And the highest max value, but at least 1
      expect(result.current.maxTickValue).toBe(1); // Should be at least 1 for percentages
    });

    it('should handle scenario with one percentage value', () => {
      const similarRangeMetadata: ColumnMetaData[] = [
        {
          name: 'revenue',
          min_value: 100,
          max_value: 180, // Closer range to percentage values
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'conversion_rate',
          min_value: 60, // Similar range to revenue (60-120 vs 100-180)
          max_value: 120,
          unique_values: 60,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: similarRangeMetadata,
        yAxisKeys: ['revenue'],
        y2AxisKeys: ['conversion_rate'],
        columnLabelFormats: {
          revenue: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const, suffix: '$' },
          conversion_rate: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // With one percentage value and similar ranges, should apply percentage rounding
      // Min ratio: 100/60 = 1.67 < 2 ✓
      // Max ratio: 180/120 = 1.5 < 2 ✓
      expect(result.current.minTickValue).toBeDefined();
      expect(result.current.maxTickValue).toBeDefined();
    });

    it('should handle percentage values with positive minimum', () => {
      const positivePercentageMetadata: ColumnMetaData[] = [
        {
          name: 'conversion_rate',
          min_value: 0.15,
          max_value: 0.85,
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: positivePercentageMetadata,
        yAxisKeys: ['conversion_rate'],
        y2AxisKeys: ['conversion_rate'],
        columnLabelFormats: {
          conversion_rate: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should return 0 for positive percentage minimums
      expect(result.current.minTickValue).toBe(0);
    });
  });

  describe('Range calculations', () => {
    it('should calculate Y-axis and Y2-axis ranges correctly', () => {
      const multipleColumnsMetadata: ColumnMetaData[] = [
        {
          name: 'revenue',
          min_value: 1000,
          max_value: 2000,
          unique_values: 100,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'profit',
          min_value: 500,
          max_value: 1500,
          unique_values: 80,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'conversion_rate',
          min_value: 600, // Similar range to Y-axis columns
          max_value: 1800,
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: multipleColumnsMetadata,
        yAxisKeys: ['revenue', 'profit'], // Y-axis range: min=500, max=2000
        y2AxisKeys: ['conversion_rate'], // Y2-axis range: min=600, max=1800
        columnLabelFormats: {
          revenue: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          profit: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          conversion_rate: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should calculate ranges based on multiple columns
      // Min ratio: 600/500 = 1.2 < 2 ✓
      // Max ratio: 2000/1800 = 1.11 < 2 ✓
      expect(result.current.minTickValue).toBeDefined();
      expect(result.current.maxTickValue).toBeDefined();
    });

    it('should handle missing column metadata gracefully', () => {
      const props = {
        ...defaultProps,
        yAxisKeys: ['nonexistent_column'],
        y2AxisKeys: ['another_nonexistent'],
      };

      const { result } = renderHook(() => useYTickValues(props));

      // When columns don't exist, ranges become infinity initially, then get reset to 0
      // Since both axes have same values (0,0), they're considered similar and return aligned values
      expect(result.current.minTickValue).toBe(0);
      expect(result.current.maxTickValue).toBe(0);
    });
  });

  describe('Similarity calculations and axis alignment', () => {
    it('should align axes when values are similar', () => {
      const similarRangeMetadata: ColumnMetaData[] = [
        {
          name: 'metric1',
          min_value: 100,
          max_value: 1000,
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'metric2',
          min_value: 110, // Within 2x range
          max_value: 1100, // Within 2x range
          unique_values: 60,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: similarRangeMetadata,
        yAxisKeys: ['metric1'],
        y2AxisKeys: ['metric2'],
        columnLabelFormats: {
          metric1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          metric2: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should align axes when ranges are similar
      expect(result.current.minTickValue).toBeDefined();
      expect(result.current.maxTickValue).toBeDefined();

      // Values should be adjusted with MIN_OFFSET and MAX_OFFSET
      expect(result.current.minTickValue).toBe(Math.round(100 * 1.1));
      expect(result.current.maxTickValue).toBe(Math.round(1100 * 1.1));
    });

    it('should not align axes when values are dissimilar', () => {
      const dissimilarRangeMetadata: ColumnMetaData[] = [
        {
          name: 'metric1',
          min_value: 1,
          max_value: 10,
          unique_values: 10,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'metric2',
          min_value: 1000, // Much larger, beyond 2x range
          max_value: 10000, // Much larger, beyond 2x range
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: dissimilarRangeMetadata,
        yAxisKeys: ['metric1'],
        y2AxisKeys: ['metric2'],
        columnLabelFormats: {
          metric1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          metric2: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should not align axes when ranges are too different
      expect(result.current.minTickValue).toBeUndefined();
      expect(result.current.maxTickValue).toBeUndefined();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle zero values correctly', () => {
      const zeroValueMetadata: ColumnMetaData[] = [
        {
          name: 'metric1',
          min_value: 0,
          max_value: 0,
          unique_values: 1,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'metric2',
          min_value: 0,
          max_value: 0,
          unique_values: 1,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: zeroValueMetadata,
        yAxisKeys: ['metric1'],
        y2AxisKeys: ['metric2'],
        columnLabelFormats: {
          metric1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          metric2: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should handle zero values appropriately
      expect(result.current.minTickValue).toBe(0);
      expect(result.current.maxTickValue).toBe(0);
    });

    it('should handle negative values correctly', () => {
      const negativeValueMetadata: ColumnMetaData[] = [
        {
          name: 'metric1',
          min_value: -1000,
          max_value: -100,
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'metric2',
          min_value: -1100,
          max_value: -110,
          unique_values: 60,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: negativeValueMetadata,
        yAxisKeys: ['metric1'],
        y2AxisKeys: ['metric2'],
        columnLabelFormats: {
          metric1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
          metric2: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should handle negative values and apply offsets
      expect(result.current.minTickValue).toBeDefined();
      expect(result.current.maxTickValue).toBeDefined();
      expect(result.current.minTickValue).toBeLessThan(0);
      expect(result.current.maxTickValue).toBeLessThan(0);
    });

    it('should handle empty axis keys', () => {
      const props = {
        ...defaultProps,
        yAxisKeys: [],
        y2AxisKeys: [],
      };

      const { result } = renderHook(() => useYTickValues(props));

      expect(result.current.minTickValue).toBeUndefined();
      expect(result.current.maxTickValue).toBeUndefined();
    });
  });

  describe('Percentage rounding logic', () => {
    it('should round percentage values to nearest 5', () => {
      const percentageMetadata: ColumnMetaData[] = [
        {
          name: 'conversion1',
          min_value: 120, // Scale up so ranges are similar
          max_value: 870,
          unique_values: 50,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'revenue1',
          min_value: 130, // Similar range to trigger alignment
          max_value: 850,
          unique_values: 60,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: percentageMetadata,
        yAxisKeys: ['conversion1'],
        y2AxisKeys: ['revenue1'],
        columnLabelFormats: {
          conversion1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'percent' as const },
          revenue1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should round to nearest 5 when there's one percentage value and ranges are similar
      // Min: Math.floor(120 * 1.1 / 5) * 5 = Math.floor(26.4) * 5 = 130
      // Max: Math.ceil(870 * 1.1 / 5) * 5 = Math.ceil(191.4) * 5 = 960
      expect(result.current.minTickValue).toBe(130);
      expect(result.current.maxTickValue).toBe(960);
    });

    it('should apply regular rounding for non-percentage values', () => {
      const nonPercentageMetadata: ColumnMetaData[] = [
        {
          name: 'revenue1',
          min_value: 1234,
          max_value: 5678,
          unique_values: 100,
          simple_type: 'number',
          type: 'float',
        },
        {
          name: 'revenue2',
          min_value: 1345,
          max_value: 6789,
          unique_values: 120,
          simple_type: 'number',
          type: 'float',
        },
      ];

      const props = {
        ...defaultProps,
        columnMetadata: nonPercentageMetadata,
        yAxisKeys: ['revenue1'],
        y2AxisKeys: ['revenue2'],
        columnLabelFormats: {
          revenue1: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const, suffix: '$' },
          revenue2: { ...DEFAULT_COLUMN_LABEL_FORMAT, style: 'number' as const, suffix: '$' },
        },
      };

      const { result } = renderHook(() => useYTickValues(props));

      // Should apply regular rounding (round to nearest integer)
      expect(result.current.minTickValue).toBe(Math.round(1234 * 1.1));
      expect(result.current.maxTickValue).toBe(Math.round(6789 * 1.1));
    });
  });
});
