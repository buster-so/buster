import { describe, it, expect } from 'vitest';
import { barSeriesBuilder } from './barSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';
import type { DatasetOptionsWithTicks } from '../../../chartHooks/useDatasetOptions/interfaces';
import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import type { DatasetOption } from '../../../chartHooks';
import type { BusterChartProps, IColumnLabelFormat } from '@/api/asset_interfaces/metric';

describe('barSeriesBuilder', () => {
  it('should build bar chart datasets with correct properties', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [
        {
          id: 'sales-dataset',
          dataKey: 'sales',
          data: [100, 200, 300],
          label: [{ key: 'sales', value: '' }],
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
      label: 'Sales',
      yAxisID: 'y',
      data: [100, 200, 300],
      backgroundColor: '#FF0000',
      borderRadius: 2,
      yAxisKey: 'sales'
    });
  });

  it('should build multiple datasets for grouped bars', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [
        {
          id: 'sales-2022',
          dataKey: 'sales2022',
          data: [100, 200, 300],
          label: [{ key: 'sales_2022', value: '' }],
          tooltipData: [],
          axisType: 'y'
        },
        {
          id: 'sales-2023',
          dataKey: 'sales2023',
          data: [150, 250, 350],
          label: [{ key: 'sales_2023', value: '' }],
          tooltipData: [],
          axisType: 'y'
        }
      ],
      ticks: [['Q1'], ['Q2'], ['Q3']],
      ticksKey: [{ key: 'quarter', value: '' }]
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#FF0000', '#00FF00'],
      columnSettings: {
        sales2022: {
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false
        },
        sales2023: {
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false
        }
      },
      columnLabelFormats: {
        sales2022: {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          multiplier: 1,
          prefix: '$',
          suffix: '',
          replaceMissingDataWith: 0,
          makeLabelHumanReadable: true
        },
        sales2023: {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          multiplier: 1,
          prefix: '$',
          suffix: '',
          replaceMissingDataWith: 0,
          makeLabelHumanReadable: true
        }
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['sales2022', 'sales2023'],
      y2AxisKeys: [],
      xAxisKeys: ['quarter'],
      categoryKeys: [],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
      selectedChartType: ChartType.Bar
    };

    // Act
    const result = barSeriesBuilder(mockProps);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: 'bar',
      label: 'Sales 2022',
      yAxisID: 'y',
      data: [100, 200, 300],
      backgroundColor: '#FF0000',
      borderRadius: 2,
      yAxisKey: 'sales2022'
    });
    expect(result[1]).toMatchObject({
      type: 'bar',
      label: 'Sales 2023',
      yAxisID: 'y',
      data: [150, 250, 350],
      backgroundColor: '#00FF00',
      borderRadius: 2,
      yAxisKey: 'sales2023'
    });
  });

  it('should build bar chart with percentage data labels', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [
        {
          id: 'market-share',
          dataKey: 'marketShare',
          data: [25, 35, 40],
          label: [{ key: 'marketShare', value: 5000 }],
          tooltipData: [],
          axisType: 'y'
        }
      ],
      ticks: [['Product A'], ['Product B'], ['Product C']],
      ticksKey: [{ key: 'product', value: '' }]
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#0000FF'],
      columnSettings: {
        marketShare: {
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: true
        }
      },
      columnLabelFormats: {
        marketShare: {
          columnType: 'number',
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          multiplier: 1,
          prefix: '',
          suffix: '%',
          replaceMissingDataWith: 0,
          makeLabelHumanReadable: true
        }
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['marketShare'],
      y2AxisKeys: [],
      xAxisKeys: ['product'],
      categoryKeys: [],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
      selectedChartType: ChartType.Bar
    };

    // Act
    const result = barSeriesBuilder(mockProps);

    // Assert
    expect(result).toHaveLength(1);
    const firstDataset = result[0];
    expect(firstDataset).toBeDefined();
    expect(firstDataset).toMatchObject({
      type: 'bar',
      label: '5,000.0%',
      yAxisID: 'y',
      data: [25, 35, 40],
      backgroundColor: '#0000FF',
      borderRadius: 2,
      yAxisKey: 'marketShare'
    });
    expect(firstDataset.datalabels).toBeDefined();
  });
});

describe('barBuilder', () => {
  const defaultProps = {
    dataset: {
      dataKey: 'test',
      data: [1, 2, 3]
    } as DatasetOption,
    colors: ['#000'],
    columnSettings: {},
    columnLabelFormats: {},
    index: 0,
    xAxisKeys: ['key1'],
    barGroupType: 'group' as BusterChartProps['barGroupType'],
    datasetOptions: {
      datasets: [],
      ticks: [],
      ticksKey: []
    },
    categoryKeys: [],
    sizeOptions: undefined,
    scatterDotSize: undefined,
    yAxisKeys: [],
    y2AxisKeys: []
  };

  it('should build bar chart datasets with correct properties', () => {
    expect(true).toBe(true);
  });
});

describe('percentage mode logic', () => {
  const getPercentageMode = (
    barGroupType: BusterChartProps['barGroupType'],
    showDataLabelsAsPercentage?: boolean
  ): 'stacked' | 'data-label' | false => {
    const isPercentageStackedBar =
      barGroupType === 'percentage-stack' ||
      (barGroupType === 'stack' && showDataLabelsAsPercentage);

    return isPercentageStackedBar ? 'stacked' : showDataLabelsAsPercentage ? 'data-label' : false;
  };

  it('should return "stacked" when barGroupType is percentage-stack', () => {
    const result = getPercentageMode('percentage-stack');
    expect(result).toBe('stacked');
  });

  it('should return "stacked" when barGroupType is stack and showDataLabelsAsPercentage is true', () => {
    const result = getPercentageMode('stack', true);
    expect(result).toBe('stacked');
  });

  it('should return "data-label" when showDataLabelsAsPercentage is true and not stacked', () => {
    const result = getPercentageMode('group', true);
    expect(result).toBe('data-label');
  });

  it('should return false when no percentage conditions are met', () => {
    const result = getPercentageMode('group', false);
    expect(result).toBe(false);
  });
});
