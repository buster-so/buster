import type {
  ChartEncodes,
  ColumnLabelFormat,
  SimplifiedColumnType
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatLabel } from '@/lib/columnFormatter';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';
import { useXAxisTitle } from './useXAxisTitle';

// Mock the dependencies
vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn()
}));

vi.mock('../../../../commonHelpers/titleHelpers', () => ({
  truncateWithEllipsis: vi.fn()
}));

describe('useXAxisTitle', () => {
  const defaultProps = {
    xAxis: ['date', 'category'],
    columnLabelFormats: {
      date: {
        columnType: 'date' as SimplifiedColumnType,
        style: 'date' as const
      } as ColumnLabelFormat,
      category: {
        columnType: 'string' as SimplifiedColumnType,
        style: 'string' as const
      } as ColumnLabelFormat,
      value: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      } as ColumnLabelFormat
    } as Record<string, ColumnLabelFormat>,
    isSupportedChartForAxisTitles: true,
    xAxisShowAxisTitle: true,
    xAxisAxisTitle: '',
    selectedAxis: {
      x: ['date', 'category'],
      y: ['value']
    } as ChartEncodes
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    (formatLabel as any).mockImplementation((value: string) => `formatted_${value}`);
    (truncateWithEllipsis as any).mockImplementation((text: string) => text);
  });

  it('should return empty string when chart type is not supported', () => {
    const props = {
      ...defaultProps,
      isSupportedChartForAxisTitles: false
    };

    const { result } = renderHook(() => useXAxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should return empty string when xAxisShowAxisTitle is false', () => {
    const props = {
      ...defaultProps,
      xAxisShowAxisTitle: false
    };

    const { result } = renderHook(() => useXAxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should return empty string when xAxisAxisTitle is empty string', () => {
    // This is actually testing the default behavior since xAxisAxisTitle is
    // already an empty string in defaultProps, but keeping for clarity
    const { result } = renderHook(() => useXAxisTitle(defaultProps));

    // When xAxisAxisTitle is empty, the hook should return empty string without calling formatLabel
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should use the provided xAxisAxisTitle when available', () => {
    const customTitle = 'Custom X-Axis Title';
    const props = {
      ...defaultProps,
      xAxisAxisTitle: customTitle
    };

    (truncateWithEllipsis as any).mockReturnValue('Truncated Custom Title');

    const { result } = renderHook(() => useXAxisTitle(props));

    expect(truncateWithEllipsis).toHaveBeenCalledWith(customTitle);
    expect(result.current).toBe('Truncated Custom Title');
    expect(formatLabel).not.toHaveBeenCalled(); // Should not format labels when custom title is provided
  });

  it('should generate title from x-axis columns when no custom title is provided', () => {
    (formatLabel as any)
      .mockReturnValueOnce('Formatted Date')
      .mockReturnValueOnce('Formatted Category');

    (truncateWithEllipsis as any).mockReturnValue('Formatted Date | Formatted Category');

    // Modified props to ensure formatLabel is called
    const modifiedProps = {
      ...defaultProps,
      xAxisAxisTitle: null, // Set to null instead of empty string to ensure formatLabel is called
      isSupportedChartForAxisTitles: true,
      xAxisShowAxisTitle: true
    };

    const { result } = renderHook(() => useXAxisTitle(modifiedProps));

    // Should format each x-axis column
    expect(formatLabel).toHaveBeenCalledWith('date', defaultProps.columnLabelFormats.date, true);
    expect(formatLabel).toHaveBeenCalledWith(
      'category',
      defaultProps.columnLabelFormats.category,
      true
    );

    // Should generate title with separator
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Date | Formatted Category');
    expect(result.current).toBe('Formatted Date | Formatted Category');
  });

  it('should handle single x-axis column correctly', () => {
    const singleAxisProps = {
      ...defaultProps,
      xAxis: ['date'],
      selectedAxis: {
        x: ['date'],
        y: ['value']
      } as ChartEncodes,
      xAxisAxisTitle: null // Set to null instead of empty string to ensure formatLabel is called
    };

    (formatLabel as any).mockReturnValue('Formatted Date');
    (truncateWithEllipsis as any).mockReturnValue('Formatted Date');

    const { result } = renderHook(() => useXAxisTitle(singleAxisProps));

    expect(formatLabel).toHaveBeenCalledWith('date', defaultProps.columnLabelFormats.date, true);
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Date');
    expect(result.current).toBe('Formatted Date');
  });

  it('should correctly memoize the result', () => {
    // Modified props to ensure formatLabel is called
    const modifiedProps = {
      ...defaultProps,
      xAxisAxisTitle: null // Set to null instead of empty string to ensure formatLabel is called
    };

    const { result, rerender } = renderHook(() => useXAxisTitle(modifiedProps));
    const initialResult = result.current;

    // Rerender with the same props
    rerender();

    // Result should be the same instance (memoized)
    expect(result.current).toBe(initialResult);

    // formatLabel and truncateWithEllipsis should only be called once
    expect(formatLabel).toHaveBeenCalledTimes(2); // Once for each x-axis column
  });

  it('should update when dependencies change', () => {
    const { result, rerender } = renderHook((props) => useXAxisTitle(props), {
      initialProps: defaultProps
    });

    // Change a dependency
    const newProps = {
      ...defaultProps,
      xAxisAxisTitle: 'New Title'
    };

    (truncateWithEllipsis as any).mockReturnValue('Truncated New Title');

    rerender(newProps);

    // Result should update
    expect(result.current).toBe('Truncated New Title');
    expect(truncateWithEllipsis).toHaveBeenCalledWith('New Title');
  });
});
