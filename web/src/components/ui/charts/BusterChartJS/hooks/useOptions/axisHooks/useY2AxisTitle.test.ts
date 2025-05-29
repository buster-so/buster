import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import { renderHook } from '@testing-library/react';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';
import { useY2AxisTitle } from './useY2AxisTitle';

// Mock the dependencies
jest.mock('@/lib/columnFormatter', () => ({
  formatLabel: jest.fn()
}));

jest.mock('../../../../commonHelpers/titleHelpers', () => ({
  truncateWithEllipsis: jest.fn()
}));

describe('useY2AxisTitle', () => {
  const defaultProps = {
    y2Axis: ['revenue', 'profit'],
    columnLabelFormats: {
      revenue: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      profit: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'currency' as const,
        currency: 'USD'
      },
      count: {
        columnType: 'number' as SimplifiedColumnType,
        style: 'number' as const
      }
    } as Record<string, IColumnLabelFormat>,
    isSupportedChartForAxisTitles: true,
    y2AxisShowAxisTitle: true,
    y2AxisAxisTitle: ''
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

    const { result } = renderHook(() => useY2AxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should return empty string when y2AxisShowAxisTitle is false', () => {
    const props = {
      ...defaultProps,
      y2AxisShowAxisTitle: false
    };

    const { result } = renderHook(() => useY2AxisTitle(props));
    expect(result.current).toBe('');
    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).not.toHaveBeenCalled();
  });

  it('should use the provided y2AxisAxisTitle when available', () => {
    const customTitle = 'Custom Y2-Axis Title';
    const props = {
      ...defaultProps,
      y2AxisAxisTitle: customTitle
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Truncated Custom Title');

    const { result } = renderHook(() => useY2AxisTitle(props));

    expect(truncateWithEllipsis).toHaveBeenCalledWith(customTitle);
    expect(result.current).toBe('Truncated Custom Title');
    expect(formatLabel).not.toHaveBeenCalled(); // Should not format labels when custom title is provided
  });

  it('should generate title from y2-axis columns when no custom title is provided', () => {
    (formatLabel as jest.Mock)
      .mockReturnValueOnce('Formatted Revenue')
      .mockReturnValueOnce('Formatted Profit');

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Formatted Revenue | Formatted Profit');

    // Set y2AxisAxisTitle to null to test the fallback behavior
    const props = {
      ...defaultProps,
      y2AxisAxisTitle: null
    };

    const { result } = renderHook(() => useY2AxisTitle(props));

    // Should format each y2-axis column
    expect(formatLabel).toHaveBeenCalledWith(
      'revenue',
      defaultProps.columnLabelFormats['revenue'],
      true
    );
    expect(formatLabel).toHaveBeenCalledWith(
      'profit',
      defaultProps.columnLabelFormats['profit'],
      true
    );

    // Should generate title with separator
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Revenue | Formatted Profit');
    expect(result.current).toBe('Formatted Revenue | Formatted Profit');
  });

  it('should handle single y2-axis column correctly', () => {
    const singleAxisProps = {
      ...defaultProps,
      y2Axis: ['revenue'],
      y2AxisAxisTitle: null
    };

    (formatLabel as jest.Mock).mockReturnValue('Formatted Revenue');
    (truncateWithEllipsis as jest.Mock).mockReturnValue('Formatted Revenue');

    const { result } = renderHook(() => useY2AxisTitle(singleAxisProps));

    expect(formatLabel).toHaveBeenCalledWith(
      'revenue',
      defaultProps.columnLabelFormats['revenue'],
      true
    );
    expect(truncateWithEllipsis).toHaveBeenCalledWith('Formatted Revenue');
    expect(result.current).toBe('Formatted Revenue');
  });

  it('should correctly memoize the result', () => {
    // Set y2AxisAxisTitle to null to test the fallback behavior
    const props = {
      ...defaultProps,
      y2AxisAxisTitle: null
    };

    const { result, rerender } = renderHook(() => useY2AxisTitle(props));
    const initialResult = result.current;

    // Rerender with the same props
    rerender();

    // Result should be the same instance (memoized)
    expect(result.current).toBe(initialResult);

    // formatLabel and truncateWithEllipsis should only be called once per render
    expect(formatLabel).toHaveBeenCalledTimes(2); // Once for each y2-axis column
  });

  it('should update when dependencies change', () => {
    const { result, rerender } = renderHook((props) => useY2AxisTitle(props), {
      initialProps: defaultProps
    });

    // Change a dependency
    const newProps = {
      ...defaultProps,
      y2AxisAxisTitle: 'New Title'
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('Truncated New Title');

    rerender(newProps);

    // Result should update
    expect(result.current).toBe('Truncated New Title');
    expect(truncateWithEllipsis).toHaveBeenCalledWith('New Title');
  });

  it('should handle empty y2Axis array', () => {
    const emptyAxisProps = {
      ...defaultProps,
      y2Axis: [],
      y2AxisAxisTitle: null
    };

    (truncateWithEllipsis as jest.Mock).mockReturnValue('');

    const { result } = renderHook(() => useY2AxisTitle(emptyAxisProps));

    expect(formatLabel).not.toHaveBeenCalled();
    expect(truncateWithEllipsis).toHaveBeenCalledWith('');
    expect(result.current).toBe('');
  });
});
