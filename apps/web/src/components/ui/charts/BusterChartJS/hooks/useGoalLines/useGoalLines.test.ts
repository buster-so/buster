import {
  type ChartConfigProps,
  type ChartType,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type GoalLine
} from '@buster/server-shared/metrics';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGoalLines } from './useGoalLines';

describe('useGoalLines', () => {
  const defaultParams = {
    goalLines: [],
    selectedChartType: 'bar' as ChartType,
    columnLabelFormats: {},
    yAxisKeys: ['metric1'],
    y2AxisKeys: undefined,
    lineGroupType: null as ChartConfigProps['lineGroupType'],
    barLayout: 'vertical' as ChartConfigProps['barLayout'],
    barGroupType: 'group' as ChartConfigProps['barGroupType']
  };

  const mockGoalLine: GoalLine = {
    value: 100,
    goalLineLabel: 'Target',
    goalLineColor: 'red',
    showGoalLineLabel: true,
    show: true
  };

  it('should return empty annotations when no goal lines are provided', () => {
    const { result } = renderHook(() => useGoalLines(defaultParams));
    expect(result.current).toEqual({});
  });

  it('should return empty annotations when chart type does not support goal lines', () => {
    const params = {
      ...defaultParams,
      goalLines: [mockGoalLine],
      barGroupType: 'percentage-stack' as ChartConfigProps['barGroupType']
    };
    const { result } = renderHook(() => useGoalLines(params));
    expect(result.current).toEqual([]);
  });

  it('should generate correct annotation for a vertical bar chart', () => {
    const params = {
      ...defaultParams,
      goalLines: [mockGoalLine],
      columnLabelFormats: {
        metric1: DEFAULT_COLUMN_LABEL_FORMAT
      }
    };

    const { result } = renderHook(() => useGoalLines(params));
    const annotations = result.current;
    const firstAnnotation = Object.values(annotations)[0];

    expect(firstAnnotation).toMatchObject({
      type: 'line',
      borderColor: 'red',
      borderWidth: 1.5,
      borderDash: [5, 5],
      yMin: 100,
      yMax: 100,
      label: {
        content: 'Target 100',
        display: true
      }
    });
  });

  it('should generate correct annotation for a horizontal bar chart', () => {
    const params = {
      ...defaultParams,
      barLayout: 'horizontal' as ChartConfigProps['barLayout'],
      goalLines: [mockGoalLine],
      columnLabelFormats: {
        metric1: DEFAULT_COLUMN_LABEL_FORMAT
      }
    };

    const { result } = renderHook(() => useGoalLines(params));
    const annotations = result.current;
    const firstAnnotation = Object.values(annotations)[0];

    expect(firstAnnotation).toMatchObject({
      type: 'line',
      borderColor: 'red',
      borderWidth: 1.5,
      borderDash: [5, 5],
      xMin: 100,
      xMax: 100,
      label: {
        content: 'Target 100',
        display: true
      }
    });
  });

  it('should handle multiple goal lines correctly', () => {
    const multipleGoalLines = [
      mockGoalLine,
      {
        ...mockGoalLine,
        value: 200,
        goalLineLabel: 'Maximum',
        goalLineColor: 'blue'
      }
    ];

    const params = {
      ...defaultParams,
      goalLines: multipleGoalLines,
      columnLabelFormats: {
        metric1: DEFAULT_COLUMN_LABEL_FORMAT
      }
    };

    const { result } = renderHook(() => useGoalLines(params));
    const annotations = result.current;

    expect(Object.keys(annotations)).toHaveLength(2);
    const annotationValues = Object.values(annotations);

    expect(annotationValues[0]).toMatchObject({
      yMin: 100,
      yMax: 100,
      borderColor: 'red',
      label: {
        content: 'Target 100'
      }
    });

    expect(annotationValues[1]).toMatchObject({
      yMin: 200,
      yMax: 200,
      borderColor: 'blue',
      label: {
        content: 'Maximum 200'
      }
    });
  });
});
