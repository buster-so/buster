import { renderHook } from '@testing-library/react';
import { useYAxisTitle } from './useYAxisTitle';
import { AXIS_TITLE_SEPARATOR } from '../../../../commonHelpers/axisHelper';
import { formatLabel } from '@/lib/columnFormatter';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';
import type { ChartEncodes, IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';

// Mock the dependencies
jest.mock('@/lib/columnFormatter', () => ({
  formatLabel: jest.fn()
}));

jest.mock('../../../../commonHelpers/titleHelpers', () => ({
  truncateWithEllipsis: jest.fn()
}));

describe('useYAxisTitle', () => {
  const defaultProps = {
    yAxis: ['value', 'count'],
    columnLabelFormats: {
      date: {
        columnType: 'date' as SimplifiedColumnType,
        style: 'date' as const
      },
      category: {
        columnType: 'string' as SimplifiedColumnType,
        style: 'string' as const
      },
      value: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      },
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    } as Record<string, IColumnLabelFormat>,
    isSupportedChartForAxisTitles: true,
    yAxisShowAxisTitle: true,
    yAxisAxisTitle: '',
    selectedAxis: {
      x: ['date', 'category'],
      y: ['value', 'count']
    } as ChartEncodes
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    (formatLabel as jest.Mock).mockImplementation((value) => `formatted_${value}`);
    (truncateWithEllipsis as jest.Mock).mockImplementation((text) => text);
  });

  it('should return empty string when chart type is not supported', () => {
    const props = {
      ...defaultProps,
      isSupportedChartForAxisTitles: false
    };

    const { result } = renderHook(() => useYAxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should return empty string when yAxisShowAxisTitle is false', () => {
    const props = {
      ...defaultProps,
      yAxisShowAxisTitle: false
    };

    const { result } = renderHook(() => useYAxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should use the provided yAxisAxisTitle when available', () => {
    const customTitle = 'Custom Y-Axis Title';
    const props = {
      ...defaultProps,
      yAxisAxisTitle: customTitle
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Truncated Custom Title');

    const { result } = renderHook(() => useYAxisTitle(props));

    expect(truncateWithEllipsis).toHaveBeenCalledWith(customTitle);
    expect(result.current).toBe('Truncated Custom Title');
    expect(formatLabel).not.toHaveBeenCalled(); // Should not format labels when custom title is provided
  });

  it('should generate title from y-axis columns when no custom title is provided', () => {
    (formatLabel as jest.Mock)
      .mockReturnValueOnce('Formatted Value')
      .mockReturnValueOnce('Formatted Count');

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Formatted Value | Formatted Count');

    // Modified props to ensure formatLabel is called
    const modifiedProps = {
      ...defaultProps,
      yAxisAxisTitle: null // Set to null instead of empty string to ensure formatLabel is called
    };

    const { result } = renderHook(() => useYAxisTitle(modifiedProps));

    // Should format each y-axis column
    expect(formatLabel).toHaveBeenCalledWith(
      'value',
      defaultProps.columnLabelFormats['value'],
      true
    );
    expect(formatLabel).toHaveBeenCalledWith(
      'count',
      defaultProps.columnLabelFormats['count'],
      true
    );

    // Should generate title with separator
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Value | Formatted Count');
    expect(result.current).toBe('Formatted Value | Formatted Count');
  });

  it('should handle single y-axis column correctly', () => {
    const singleAxisProps = {
      ...defaultProps,
      yAxis: ['value'],
      selectedAxis: {
        x: ['date', 'category'],
        y: ['value']
      } as ChartEncodes,
      yAxisAxisTitle: null // Set to null instead of empty string to ensure formatLabel is called
    };

    (formatLabel as jest.Mock).mockReturnValue('Formatted Value');
    (truncateWithEllipsis as jest.Mock).mockReturnValue('Formatted Value');

    const { result } = renderHook(() => useYAxisTitle(singleAxisProps));

    expect(formatLabel).toHaveBeenCalledWith(
      'value',
      defaultProps.columnLabelFormats['value'],
      true
    );
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Value');
    expect(result.current).toBe('Formatted Value');
  });

  it('should correctly memoize the result', () => {
    // Modified props to ensure formatLabel is called
    const modifiedProps = {
      ...defaultProps,
      yAxisAxisTitle: null // Set to null instead of empty string to ensure formatLabel is called
    };

    const { result, rerender } = renderHook(() => useYAxisTitle(modifiedProps));
    const initialResult = result.current;

    // Rerender with the same props
    rerender();

    // Result should be the same instance (memoized)
    expect(result.current).toBe(initialResult);

    // formatLabel and truncateWithEllipsis should only be called once for each y-axis item
    expect(formatLabel).toHaveBeenCalledTimes(2);
  });

  it('should update when dependencies change', () => {
    const { result, rerender } = renderHook((props) => useYAxisTitle(props), {
      initialProps: defaultProps
    });

    // Change a dependency
    const newProps = {
      ...defaultProps,
      yAxisAxisTitle: 'New Title'
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Truncated New Title');

    rerender(newProps);

    // Result should update
    expect(result.current).toBe('Truncated New Title');
    expect(truncateWithEllipsis).toHaveBeenCalledWith('New Title');
  });

  it('should handle empty yAxis array', () => {
    const emptyAxisProps = {
      ...defaultProps,
      yAxis: [],
      selectedAxis: {
        x: ['date', 'category'],
        y: []
      } as ChartEncodes,
      yAxisAxisTitle: null
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('');

    const { result } = renderHook(() => useYAxisTitle(emptyAxisProps));

    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).toHaveBeenCalledWith('');
    expect(result.current).toBe('');
  });

  it('should correctly use selectedAxis.y property for formatting', () => {
    // Test case where yAxis array and selectedAxis.y are different
    const differentAxisProps = {
      ...defaultProps,
      yAxis: ['count'], // This is different from selectedAxis.y
      selectedAxis: {
        x: ['date'],
        y: ['value', 'count'] // This should be used for formatting
      } as ChartEncodes,
      yAxisAxisTitle: null
    };

    (formatLabel as jest.Mock)
      .mockReturnValueOnce('Formatted Value')
      .mockReturnValueOnce('Formatted Count');

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Formatted Value | Formatted Count');

    const { result } = renderHook(() => useYAxisTitle(differentAxisProps));

    // Should use selectedAxis.y for formatting, not yAxis
    expect(formatLabel).toHaveBeenCalledWith(
      'value',
      defaultProps.columnLabelFormats['value'],
      true
    );
    expect(formatLabel).toHaveBeenCalledWith(
      'count',
      defaultProps.columnLabelFormats['count'],
      true
    );
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Value | Formatted Count');
    expect(result.current).toBe('Formatted Value | Formatted Count');
  });
});
