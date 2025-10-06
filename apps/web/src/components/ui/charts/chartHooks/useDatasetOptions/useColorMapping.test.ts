import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useColorMapping } from './useColorMapping';

describe('useColorMapping', () => {
  const mockData = [
    { month: 'Jan', sales: 100, level: 'Level 1' },
    { month: 'Feb', sales: 200, level: 'Level 2' },
    { month: 'Mar', sales: 300, level: 'Level 1' },
  ];

  it('should create color mapping when colorBy is present', () => {
    const { result } = renderHook(() =>
      useColorMapping(mockData, ['level'], ['#FF0000', '#00FF00', '#0000FF'])
    );

    expect(result.current.hasColorMapping).toBe(true);
    expect(result.current.colorMapping.size).toBe(2); // 'Level 1' and 'Level 2'
    expect(result.current.getColorForValue('Level 1')).toBe('#FF0000');
    expect(result.current.getColorForValue('Level 2')).toBe('#00FF00');
    expect(result.current.colorConfig).toEqual({
      field: 'level',
      mapping: result.current.colorMapping,
    });
  });

  it('should not create color mapping when colorBy is null', () => {
    const { result } = renderHook(() =>
      useColorMapping(mockData, null, ['#FF0000', '#00FF00', '#0000FF'])
    );

    expect(result.current.hasColorMapping).toBe(false);
    expect(result.current.colorMapping.size).toBe(0);
    expect(result.current.getColorForValue('Level 1')).toBeUndefined();
    expect(result.current.colorConfig).toBeUndefined();
  });

  it('should not create color mapping when colors array is empty', () => {
    const { result } = renderHook(() => useColorMapping(mockData, ['level'], []));

    expect(result.current.hasColorMapping).toBe(false);
    expect(result.current.colorMapping.size).toBe(0);
  });

  it('should handle undefined colors gracefully', () => {
    const { result } = renderHook(() => useColorMapping(mockData, ['level'], undefined as any));

    expect(result.current.hasColorMapping).toBe(false);
    expect(result.current.colorMapping.size).toBe(0);
  });

  it('should return undefined for values not found', () => {
    const { result } = renderHook(() =>
      useColorMapping(mockData, ['level'], ['#FF0000', '#00FF00'])
    );

    expect(result.current.getColorForValue('NonExistent')).toBeUndefined();
    expect(result.current.getColorForValue('Level 1')).toBe('#FF0000');
  });

  it('should cycle through colors when more unique values than colors', () => {
    const dataWithManyLevels = [
      { level: 'Level 1' },
      { level: 'Level 2' },
      { level: 'Level 3' },
      { level: 'Level 4' },
    ];

    const { result } = renderHook(() =>
      useColorMapping(
        dataWithManyLevels,
        ['level'],
        ['#FF0000', '#00FF00'] // Only 2 colors for 4 levels
      )
    );

    expect(result.current.colorMapping.size).toBe(4);
    expect(result.current.getColorForValue('Level 1')).toBe('#FF0000');
    expect(result.current.getColorForValue('Level 2')).toBe('#00FF00');
    expect(result.current.getColorForValue('Level 3')).toBe('#FF0000'); // Cycles back
    expect(result.current.getColorForValue('Level 4')).toBe('#00FF00'); // Cycles back
  });

  it('should handle empty data array gracefully', () => {
    const { result } = renderHook(() =>
      useColorMapping([], ['level'], ['#FF0000', '#00FF00', '#0000FF'])
    );

    expect(result.current.hasColorMapping).toBe(false);
    expect(result.current.colorMapping.size).toBe(0);
    expect(result.current.getColorForValue('Level 1')).toBeUndefined();
    expect(result.current.colorConfig).toBeUndefined();
  });

  it('should handle data with null and undefined values in colorBy field', () => {
    const dataWithNullValues = [
      { month: 'Jan', sales: 100, level: 'Level 1' },
      { month: 'Feb', sales: 200, level: null },
      { month: 'Mar', sales: 300, level: null },
      { month: 'Apr', sales: 400, level: 'Level 2' },
      { month: 'May', sales: 500, level: null }, // missing level field (set as null)
    ];

    const { result } = renderHook(() =>
      useColorMapping(dataWithNullValues, ['level'], ['#FF0000', '#00FF00', '#0000FF'])
    );

    // Should only create mappings for non-null/undefined values
    expect(result.current.hasColorMapping).toBe(true);
    expect(result.current.colorMapping.size).toBe(2); // Only 'Level 1' and 'Level 2'
    expect(result.current.getColorForValue('Level 1')).toBe('#FF0000');
    expect(result.current.getColorForValue('Level 2')).toBe('#00FF00');
    expect(result.current.getColorForValue(null)).toBeUndefined();
    expect(result.current.getColorForValue(undefined)).toBeUndefined();
  });
});
