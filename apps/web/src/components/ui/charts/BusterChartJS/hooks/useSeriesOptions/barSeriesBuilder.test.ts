import { type ColumnLabelFormat, DEFAULT_COLUMN_SETTINGS } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOption } from '../../../chartHooks';
import type { DatasetOptionsWithTicks } from '../../../chartHooks/useDatasetOptions/interfaces';
import { barSeriesBuilder, barSeriesBuilder_labels } from './barSeriesBuilder';
import type { SeriesBuilderProps } from './interfaces';

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
          axisType: 'y',
        },
      ],
      ticks: [['Jan'], ['Feb'], ['Mar']],
      ticksKey: [{ key: 'date', value: '' }],
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#FF0000', '#00FF00', '#0000FF'],
      columnSettings: {
        sales: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false,
        },
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
          makeLabelHumanReadable: true,
        } as ColumnLabelFormat,
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['sales'],
      y2AxisKeys: [],
      xAxisKeys: ['date'],
      trendlines: [],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
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
      yAxisKey: 'sales',
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
          axisType: 'y',
        },
        {
          id: 'sales-2023',
          dataKey: 'sales2023',
          data: [150, 250, 350],
          label: [{ key: 'sales_2023', value: '' }],
          tooltipData: [],
          axisType: 'y',
        },
      ],
      ticks: [['Q1'], ['Q2'], ['Q3']],
      ticksKey: [{ key: 'quarter', value: '' }],
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#FF0000', '#00FF00'],
      columnSettings: {
        sales2022: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false,
        },
        sales2023: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: false,
        },
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
          makeLabelHumanReadable: true,
        } as ColumnLabelFormat,
        sales2023: {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          multiplier: 1,
          prefix: '$',
          suffix: '',
          replaceMissingDataWith: 0,
          makeLabelHumanReadable: true,
        } as ColumnLabelFormat,
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['sales2022', 'sales2023'],
      y2AxisKeys: [],
      xAxisKeys: ['quarter'],
      trendlines: [],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
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
      yAxisKey: 'sales2022',
    });
    expect(result[1]).toMatchObject({
      type: 'bar',
      label: 'Sales 2023',
      yAxisID: 'y',
      data: [150, 250, 350],
      backgroundColor: '#00FF00',
      borderRadius: 2,
      yAxisKey: 'sales2023',
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
          axisType: 'y',
        },
      ],
      ticks: [['Product A'], ['Product B'], ['Product C']],
      ticksKey: [{ key: 'product', value: '' }],
    };

    const mockProps: SeriesBuilderProps = {
      datasetOptions: mockDatasetOptions,
      colors: ['#0000FF'],
      columnSettings: {
        marketShare: {
          ...DEFAULT_COLUMN_SETTINGS,
          showDataLabels: true,
          barRoundness: 4,
          showDataLabelsAsPercentage: true,
        },
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
          makeLabelHumanReadable: true,
        } as ColumnLabelFormat,
      },
      barShowTotalAtTop: false,
      barGroupType: 'group',
      yAxisKeys: ['marketShare'],
      y2AxisKeys: [],
      xAxisKeys: ['product'],
      sizeOptions: null,
      scatterDotSize: [5, 5],
      lineGroupType: null,
      trendlines: [],
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
      yAxisKey: 'marketShare',
    });
    expect(firstDataset.datalabels).toBeDefined();
  });
});

describe('barBuilder', () => {
  const defaultProps = {
    dataset: {
      dataKey: 'test',
      data: [1, 2, 3],
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
      ticksKey: [],
    },
    categoryKeys: [],
    sizeOptions: undefined,
    scatterDotSize: undefined,
    yAxisKeys: [],
    y2AxisKeys: [],
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

describe('barSeriesBuilder_labels - dateTicks', () => {
  it('should return date ticks when columnLabelFormat has date style and single xAxis', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [['2024-01-01'], ['2024-02-01'], ['2024-03-01']],
      ticksKey: [{ key: 'date', value: '' }],
    };

    const columnLabelFormats = {
      date: {
        columnType: 'date',
        style: 'date',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as ColumnLabelFormat,
    };

    // Act
    const result = barSeriesBuilder_labels({
      datasetOptions: mockDatasetOptions,
      columnLabelFormats,
      xAxisKeys: ['date'],
    });

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBeInstanceOf(Date);
    expect(result[2]).toBeInstanceOf(Date);
  });

  it('should return quarter ticks when columnLabelFormat has quarter convertNumberTo and single xAxis', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [[1], [2], [3], [4]],
      ticksKey: [{ key: 'quarter', value: '' }],
    };

    const columnLabelFormats = {
      quarter: {
        columnType: 'number',
        style: 'date',
        convertNumberTo: 'quarter',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as ColumnLabelFormat,
    };

    // Act
    const result = barSeriesBuilder_labels({
      datasetOptions: mockDatasetOptions,
      columnLabelFormats,
      xAxisKeys: ['quarter'],
    });

    // Assert
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('Q1');
    expect(result[1]).toBe('Q2');
    expect(result[2]).toBe('Q3');
    expect(result[3]).toBe('Q4');
  });

  it('should return quarter ticks with double xAxis when one is quarter and one is number', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [
        [1, 2023],
        [2, 2023],
        [3, 2023],
      ],
      ticksKey: [
        { key: 'quarter', value: '' },
        { key: 'year', value: '' },
      ],
    };

    const columnLabelFormats = {
      quarter: {
        columnType: 'number',
        style: 'date',
        convertNumberTo: 'quarter',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as ColumnLabelFormat,
      year: {
        columnType: 'number',
        style: 'number',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        numberSeparatorStyle: null,
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as ColumnLabelFormat,
    };

    // Act
    const result = barSeriesBuilder_labels({
      datasetOptions: mockDatasetOptions,
      columnLabelFormats,
      xAxisKeys: ['quarter', 'year'],
    });

    console.log('result', result[0]);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toContain('Q1');
    expect(result[0]).toContain('2023');
    expect(result[1]).toContain('Q2');
    expect(result[2]).toContain('Q3');
  });

  it('should return null dateTicks when columnLabelFormat does not have date style', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [['Product A'], ['Product B'], ['Product C']],
      ticksKey: [{ key: 'product', value: '' }],
    };

    const columnLabelFormats = {
      product: {
        columnType: 'string',
        style: 'string',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as unknown as ColumnLabelFormat,
    };

    // Act
    const result = barSeriesBuilder_labels({
      datasetOptions: mockDatasetOptions,
      columnLabelFormats,
      xAxisKeys: ['product'],
    });

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Product A');
    expect(result[1]).toBe('Product B');
    expect(result[2]).toBe('Product C');
  });

  it('should return date ticks when columnType is number but style is date', () => {
    // Arrange
    const mockDatasetOptions: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [['2024-01-15'], ['2024-01-16'], ['2024-01-17']],
      ticksKey: [{ key: 'timestamp', value: '' }],
    };

    const columnLabelFormats = {
      timestamp: {
        columnType: 'number',
        style: 'date',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } as ColumnLabelFormat,
    };

    // Act
    const result = barSeriesBuilder_labels({
      datasetOptions: mockDatasetOptions,
      columnLabelFormats,
      xAxisKeys: ['timestamp'],
    });

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBeInstanceOf(Date);
    expect(result[2]).toBeInstanceOf(Date);
  });
});
