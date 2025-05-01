import { comboSeriesBuilder_data } from './comboSeriesBuilder';
import { DEFAULT_COLUMN_SETTINGS } from '@/api/asset_interfaces/metric';

describe('comboSeriesBuilder_data', () => {
  const mockColors = ['#000000', '#111111'];
  const mockXAxisKeys = ['2023-01-01', '2023-01-02'];
  const mockTicks = mockXAxisKeys.map((key) => [key]);
  const mockTicksKey = [{ key: 'date', value: 'Date' }];

  test('creates correct series types based on columnVisualization', () => {
    const props = {
      colors: mockColors,
      xAxisKeys: mockXAxisKeys,
      columnSettings: {
        metric1: { ...DEFAULT_COLUMN_SETTINGS, columnVisualization: 'bar' as const },
        metric2: { ...DEFAULT_COLUMN_SETTINGS, columnVisualization: 'line' as const }
      },
      columnLabelFormats: {},
      datasetOptions: {
        datasets: [
          {
            id: 'metric1',
            dataKey: 'metric1',
            axisType: 'y' as const,
            data: [10, 20],
            label: [{ key: 'metric1', value: 'Metric 1' }],
            tooltipData: [[{ key: 'value', value: 10 }], [{ key: 'value', value: 20 }]]
          },
          {
            id: 'metric2',
            dataKey: 'metric2',
            axisType: 'y2' as const,
            data: [30, 40],
            label: [{ key: 'metric2', value: 'Metric 2' }],
            tooltipData: [[{ key: 'value', value: 30 }], [{ key: 'value', value: 40 }]]
          }
        ],
        ticks: mockTicks,
        ticksKey: mockTicksKey
      },
      lineGroupType: 'stack' as const,
      barGroupType: 'group' as const,
      sizeOptions: { key: 'size', minValue: 0, maxValue: 100 },
      scatterDotSize: [5, 10] as [number, number],
      barShowTotalAtTop: false,
      yAxisKeys: ['metric1'],
      y2AxisKeys: ['metric2']
    };

    const result = comboSeriesBuilder_data(props);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('bar');
    expect(result[1].type).toBe('line');
  });

  test('maps dataset values correctly', () => {
    const testData = [10, 20];
    const props = {
      colors: mockColors,
      xAxisKeys: mockXAxisKeys,
      columnSettings: {
        metric1: { ...DEFAULT_COLUMN_SETTINGS, columnVisualization: 'bar' as const }
      },
      columnLabelFormats: {},
      datasetOptions: {
        datasets: [
          {
            id: 'metric1',
            dataKey: 'metric1',
            axisType: 'y' as const,
            data: testData,
            label: [{ key: 'metric1', value: 'Metric 1' }],
            tooltipData: [[{ key: 'value', value: 10 }], [{ key: 'value', value: 20 }]]
          }
        ],
        ticks: mockTicks,
        ticksKey: mockTicksKey
      },
      lineGroupType: 'stack' as const,
      barGroupType: 'group' as const,
      sizeOptions: { key: 'size', minValue: 0, maxValue: 100 },
      scatterDotSize: [5, 10] as [number, number],
      barShowTotalAtTop: false,
      yAxisKeys: ['metric1'],
      y2AxisKeys: []
    };

    const result = comboSeriesBuilder_data(props);

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual(testData);
    expect(result[0].backgroundColor).toBe(mockColors[0]);
  });
});
