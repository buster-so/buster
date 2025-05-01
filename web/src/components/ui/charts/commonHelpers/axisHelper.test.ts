import { formatYAxisLabel, yAxisSimilar } from './axisHelper';
import { formatLabel } from '@/lib/columnFormatter';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';

// Mock dependencies
jest.mock('@/lib/columnFormatter', () => ({
  formatLabel: jest.fn()
}));

describe('formatYAxisLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use percentage formatting when usePercentageModeAxis is true', () => {
    // Setup
    const value = 0.75;
    const axisColumnNames = ['growth', 'revenue'];
    const canUseSameFormatter = true;
    const columnLabelFormats = {
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };
    const usePercentageModeAxis = true;

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
        currency: 'USD'
      },
      cost: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR'
      }
    };
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
        compactNumbers: true
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
        currency: 'USD'
      },
      growth: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const
      }
    };
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
        compactNumbers: true
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
        style: 'number' as const
      }
    };
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
        compactNumbers: false
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
        style: 'number' as const
      }
    };
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
        compactNumbers: true
      },
      false
    );
  });
});

describe('yAxisSimilar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when all y-axis variables have the same style and currency', () => {
    // Setup
    const yAxis = ['revenue', 'sales'];
    const columnLabelFormats = {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      sales: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      }
    };

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
        currency: 'USD'
      },
      percentage: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'percent' as const
      }
    };

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
        currency: 'USD'
      },
      eur_revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'EUR'
      }
    };

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
        currency: 'USD'
      }
    };

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
        style: 'number' as const
      },
      value2: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    };

    // Execute
    const result = yAxisSimilar(yAxis, columnLabelFormats);

    // Verify
    expect(result).toBe(true);
  });
});
