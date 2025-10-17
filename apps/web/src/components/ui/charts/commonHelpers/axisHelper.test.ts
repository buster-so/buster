import type { ColumnLabelFormat, SimplifiedColumnType } from '@buster/server-shared/metrics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatLabel } from '@/lib/columnFormatter';
import { formatYAxisLabel, yAxisSimilar } from './axisHelper';

// Mock dependencies
vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn(),
}));

describe('formatYAxisLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use percentage formatting when usePercentageModeAxis is true', () => {
    // Setup
    const value = 0.75;
    const axisColumnNames = ['growth', 'revenue'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const,
      } as ColumnLabelFormat,
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;
    const usePercentageModeAxis = '100';

    // Execute
    const result = formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      { columnType: 'number', style: 'percent' },
      false
    );
  });

  it('should use the first column format when canUseSameFormatter is true', () => {
    // Setup
    const value = 1000;
    const axisColumnNames = ['revenue', 'cost'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
      cost: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR',
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;
    const usePercentageModeAxis = false;
    const compactNumbers = true;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'currency',
        currency: 'USD',
        compactNumbers: true,
      },
      false
    );
  });

  it('should use generic number format when canUseSameFormatter is false', () => {
    // Setup
    const value = 1000;
    const axisColumnNames = ['revenue', 'growth'];
    const canUseSameFormatter = false;
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const,
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;
    const usePercentageModeAxis = false;
    const compactNumbers = true;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: true,
      },
      false
    );
  });

  it('should respect the compactNumbers parameter when false', () => {
    // Setup
    const value = 10000;
    const axisColumnNames = ['count'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const,
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;
    const usePercentageModeAxis = false;
    const compactNumbers = false;

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis,
      compactNumbers
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: false,
      },
      false
    );
  });

  it('should default compactNumbers to true if not provided', () => {
    // Setup
    const value = 10000;
    const axisColumnNames = ['count'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const,
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;
    const usePercentageModeAxis = false;
    // No compactNumbers parameter provided

    // Execute
    formatYAxisLabel(
      value,
      axisColumnNames,
      canUseSameFormatter,
      columnLabelFormats,
      usePercentageModeAxis
    );

    // Verify
    expect(formatLabel).toHaveBeenCalledWith(
      value,
      {
        columnType: 'number',
        style: 'number',
        compactNumbers: true,
      },
      false
    );
  });
});

describe('yAxisSimilar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when all y-axis variables have the same style and currency', () => {
    // Setup
    const yAxis = ['revenue', 'sales'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
      sales: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });

  it('should return false when y-axis variables have different styles', () => {
    // Setup
    const yAxis = ['revenue', 'percentage'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
      percentage: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const,
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(false);
  });

  it('should return false when y-axis variables have different currencies', () => {
    // Setup
    const yAxis = ['usd_revenue', 'eur_revenue'];
    const columnLabelFormats = {
      usd_revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
      eur_revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR',
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(false);
  });

  it('should return true for a single y-axis variable', () => {
    // Setup
    const yAxis = ['revenue'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD',
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });

  it('should handle y-axis variables with missing format properties', () => {
    // Setup
    const yAxis = ['value1', 'value2'];
    const columnLabelFormats = {
      value1: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const,
      } as ColumnLabelFormat,
      value2: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const,
      } as ColumnLabelFormat,
    } as Record<string, ColumnLabelFormat>;

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });
});
