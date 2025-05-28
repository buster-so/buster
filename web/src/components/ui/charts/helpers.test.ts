import { doesChartHaveValidAxis } from './helpers';
import { ChartType, type ChartEncodes } from '@/api/asset_interfaces/metric/charts';

describe('doesChartHaveValidAxis', () => {
  it('should return true when isTable is true regardless of other parameters', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Line,
        selectedAxis: undefined,
        isTable: true
      })
    ).toBe(true);
  });

  it('should return true for Metric chart type regardless of axes', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Metric,
        selectedAxis: {} as ChartEncodes,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return true for Table chart type regardless of axes', () => {
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Table,
        selectedAxis: {} as ChartEncodes,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return false for Line chart when x and y axes are empty', () => {
    const emptyAxis: ChartEncodes = { x: [], y: [] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Line,
        selectedAxis: emptyAxis,
        isTable: false
      })
    ).toBe(false);
  });

  it('should return false for Line chart when x axis is empty', () => {
    const axisWithEmptyX: ChartEncodes = { x: [], y: ['value'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Line,
        selectedAxis: axisWithEmptyX,
        isTable: false
      })
    ).toBe(false);
  });

  it('should return false for Line chart when y axis is empty', () => {
    const axisWithEmptyY: ChartEncodes = { x: ['time'], y: [] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Line,
        selectedAxis: axisWithEmptyY,
        isTable: false
      })
    ).toBe(false);
  });

  it('should return true for Line chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['time'], y: ['value'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Line,
        selectedAxis: validAxis,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return true for Bar chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['category'], y: ['count'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Bar,
        selectedAxis: validAxis,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return true for Scatter chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['width'], y: ['height'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Scatter,
        selectedAxis: validAxis,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return true for Pie chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['label'], y: ['value'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Pie,
        selectedAxis: validAxis,
        isTable: false
      })
    ).toBe(true);
  });

  it('should return true for Combo chart when both x and y axes have values', () => {
    const validAxis: ChartEncodes = { x: ['date'], y: ['value1', 'value2'] };
    expect(
      doesChartHaveValidAxis({
        selectedChartType: ChartType.Combo,
        selectedAxis: validAxis,
        isTable: false
      })
    ).toBe(true);
  });
});
