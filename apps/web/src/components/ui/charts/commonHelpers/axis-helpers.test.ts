import type { ChartEncodes } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { doesChartHaveValidAxis } from './axis-helpers';

describe('doesChartHaveValidAxis', () => {
  it('should return true when isTable is true regardless of other parameters', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'line',
        selectedAxis: undefined,
        isTable: true,
      })
    ).toBe(true);
  });

  it('should return true for Metric chart type regardless of axes', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'metric',
        selectedAxis: {} as ChartEncodes,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return true for Table chart type regardless of axes', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'table',
        selectedAxis: {} as ChartEncodes,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return false for Line chart when x and y axes are empty', () => {
    const emptyAxis: ChartEncodes = { x: [] as string[], y: [] as string[] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'line',
        selectedAxis: emptyAxis,
        isTable: false,
      })
    ).toBe(false);
  });

  it('should return false for Line chart when x axis is empty', () => {
    const axisWithEmptyX: ChartEncodes = { x: [] as string[], y: ['value'] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'line',
        selectedAxis: axisWithEmptyX,
        isTable: false,
      })
    ).toBe(false);
  });

  it('should return false for Line chart when y axis is empty', () => {
    const axisWithEmptyY: ChartEncodes = { x: ['time'], y: [] as string[] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'line',
        selectedAxis: axisWithEmptyY,
        isTable: false,
      })
    ).toBe(false);
  });

  it('should return true for Line chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['time'], y: ['value'] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'line',
        selectedAxis: validAxis,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return true for Bar chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['category'], y: ['count'] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'bar',
        selectedAxis: validAxis,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return true for Scatter chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['width'], y: ['height'] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'scatter',
        selectedAxis: validAxis,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return true for Pie chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['label'], y: ['value'] } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'pie',
        selectedAxis: validAxis,
        isTable: false,
      })
    ).toBe(true);
  });

  it('should return true for Combo chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = {
      x: ['date'],
      y: ['value1', 'value2'],
      category: [],
      tooltip: null,
      colorBy: null,
    } as ChartEncodes;
    expect(
      doesChartHaveValidAxis({
        selectedChartType: 'combo',
        selectedAxis: validAxis,
        isTable: false,
      })
    ).toBe(true);
  });
});
