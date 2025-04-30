import { barSeriesBuilder } from './barSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';
import type { DatasetOptionsWithTicks } from '../../../chartHooks/useDatasetOptions/interfaces';
import type { KV } from '../../../chartHooks/useDatasetOptions/interfaces';
import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';

describe('barSeriesBuilder', () => {
  it('should build bar chart datasets with correct properties', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [
        {
          id: 'sales-dataset',
          dataKey: 'sales',
          data: [100, 200, 300],
          label: [{ key: 'sales', value: 'Sales Data' }],
          tooltipData: [],
          axisType: 'y'
        }
      ],
      ticks: [['Jan'], ['Feb'], ['Mar']],
      ticksKey: [{ key: 'date', value: '' }]
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      columnSettings: {
        sales: {
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false
        }
      },
      columnLabelFormats: {
        sales: {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          multiplier: 1,
          prefix: '',
          suffix: '',
          replaceMissingDataWith: 0,
          makeLabelHumanReadable: true
        }
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['sales'],
      y2AxisKeys: [],
      xAxisKeys: ['date'],
      categoryKeys: [],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
      selectedChartType: ChartType.Bar
    };

    // Act
    const result = barSeriesBuilder(mockProps);

    // Assert
    expect(result[0]).toMatchObject({
      type: 'bar',
      label: 'Sales Data',
      yAxisID: 'y',
      data: [100, 200, 300],
      backgroundColor: '#FF0000',
      borderRadius: 2,
      yAxisKey: 'sales'
    });
  });
});
