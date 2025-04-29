import { renderHook } from '@testing-library/react';
import { useDatasetOptions } from './useDatasetOptions';
import {
  type ChartType,
  type IColumnLabelFormat
} from '../../../../../api/asset_interfaces/metric/charts';

describe('useDatasetOptions - bar chart - all values are present', () => {
  const mockData = [
    { date: '2024-01-01', value: 100, category: 'A' },
    { date: '2024-01-02', value: 200, category: 'B' },
    { date: '2024-01-02', value: 200, category: 'A' },
    { date: '2024-01-03', value: 300, category: 'A' }
  ];

  const defaultParams = {
    data: mockData,
    selectedAxis: {
      x: ['date'],
      y: ['value'],
      category: ['category'],
      tooltip: []
    },
    selectedChartType: 'bar' as ChartType,
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        replaceMissingDataWith: null
      } as IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        replaceMissingDataWith: 0
      } as IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string',
        replaceMissingDataWith: ''
      } as IColumnLabelFormat
    },
    pieMinimumSlicePercentage: undefined,
    barGroupType: undefined,
    lineGroupType: undefined,
    trendlines: undefined,
    columnMetadata: []
  };

  it('should return the correct structure - has category', () => {
    const { result } = renderHook(() => useDatasetOptions(defaultParams));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;

    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, 0],
      ['date__🔑__2024-01-02', 200, 200],
      ['date__🔑__2024-01-03', 300, 0]
    ]);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
  });

  it('should return the correct structure - no category', () => {
    const defaultParams2 = {
      ...defaultParams,
      selectedAxis: {
        ...defaultParams.selectedAxis,
        category: []
      }
    };

    const { result } = renderHook(() => useDatasetOptions(defaultParams2));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;

    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100],
      ['date__🔑__2024-01-02', 400],
      ['date__🔑__2024-01-03', 300]
    ]);
    expect(datasetOptions[0].dimensions).toEqual(['date', 'value__🔑__']);
    expect(yAxisKeys).toEqual(['value__🔑__']);
  });
});

describe('useDatasetOptions - bar chart ', () => {
  const mockData = [
    { date: '2024-01-01', value: 100, category: 'A' },
    { date: '2024-01-02', value: 200, category: 'B' },
    { date: '2024-01-03', value: 300, category: 'A' }
  ];

  const defaultParams = {
    data: mockData,
    selectedAxis: {
      x: ['date'],
      y: ['value'],
      category: ['category'],
      tooltip: []
    },
    selectedChartType: 'bar' as ChartType,
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        replaceMissingDataWith: null
      } as IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        replaceMissingDataWith: 0
      } as IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string',
        replaceMissingDataWith: ''
      } as IColumnLabelFormat
    },
    pieMinimumSlicePercentage: undefined,
    barGroupType: undefined,
    lineGroupType: undefined,
    trendlines: undefined,
    columnMetadata: []
  };

  it('should return the correct structure', () => {
    const { result } = renderHook(() => useDatasetOptions(defaultParams));

    expect(result.current).toHaveProperty('datasetOptions');
    expect(result.current).toHaveProperty('dataTrendlineOptions');
    expect(result.current).toHaveProperty('yAxisKeys');
    expect(result.current).toHaveProperty('y2AxisKeys');
    expect(result.current).toHaveProperty('tooltipKeys');
    expect(result.current).toHaveProperty('hasMismatchedTooltipsAndMeasures');
  });

  it('should process bar chart data correctly', () => {
    const { result } = renderHook(() => useDatasetOptions(defaultParams));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;

    expect(datasetOptions).toHaveLength(1);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, 0],
      ['date__🔑__2024-01-02', 0, 200],
      ['date__🔑__2024-01-03', 300, 0]
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
  });
});

describe('useDatasetOptions - bar chart - some numerical values are null', () => {
  const mockData = [
    { date: '2024-01-01', value: 100, category: 'A' },
    { date: '2024-01-02', value: null, category: 'B' },
    { date: '2024-01-03', value: 300, category: 'A' }
  ];

  const defaultParams = {
    data: mockData,
    selectedAxis: {
      x: ['date'],
      y: ['value'],
      category: ['category'],
      tooltip: []
    },
    selectedChartType: 'bar' as ChartType,
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        replaceMissingDataWith: null
      } as IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        replaceMissingDataWith: 0
      } as IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string',
        replaceMissingDataWith: ''
      } as IColumnLabelFormat
    },
    pieMinimumSlicePercentage: undefined,
    barGroupType: undefined,
    lineGroupType: undefined,
    trendlines: undefined,
    columnMetadata: []
  };

  it('should process bar chart data correctly', () => {
    const { result } = renderHook(() => useDatasetOptions(defaultParams));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;

    expect(datasetOptions).toHaveLength(1);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, 0],
      ['date__🔑__2024-01-02', 0, 0],
      ['date__🔑__2024-01-03', 300, 0]
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
  });

  it('replace missing data with a null', () => {
    const defaultParams2 = {
      ...defaultParams,
      columnLabelFormats: {
        ...defaultParams.columnLabelFormats,
        value: {
          ...defaultParams.columnLabelFormats.value,
          replaceMissingDataWith: null
        }
      }
    };
    const { result } = renderHook(() => useDatasetOptions(defaultParams2));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;
    expect(datasetOptions).toHaveLength(1);

    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, null],
      ['date__🔑__2024-01-02', null, null],
      ['date__🔑__2024-01-03', 300, null]
    ]);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
  });

  it('replace missing data with a 🥳', () => {
    const defaultParams3 = {
      ...defaultParams,
      columnLabelFormats: {
        ...defaultParams.columnLabelFormats,
        value: {
          ...defaultParams.columnLabelFormats.value,
          replaceMissingDataWith: '🥳'
        }
      }
    };
    const { result } = renderHook(() => useDatasetOptions(defaultParams3));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, '🥳'],
      ['date__🔑__2024-01-02', '🥳', '🥳'],
      ['date__🔑__2024-01-03', 300, '🥳']
    ]);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__B__📍__value__🔑__'
    ]);
  });

  it('replace missing data with a 0 - no category', () => {
    const defaultParams4 = {
      ...defaultParams,
      selectedAxis: {
        ...defaultParams.selectedAxis,
        category: []
      }
    };
    const { result } = renderHook(() => useDatasetOptions(defaultParams4));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100],
      ['date__🔑__2024-01-02', 0],
      ['date__🔑__2024-01-03', 300]
    ]);
    expect(datasetOptions[0].dimensions).toEqual(['date', 'value__🔑__']);
    expect(yAxisKeys).toEqual(['value__🔑__']);
  });

  it('replace missing data with a null - no category', () => {
    const defaultParams5 = {
      ...defaultParams,
      selectedAxis: {
        ...defaultParams.selectedAxis,
        category: []
      },
      columnLabelFormats: {
        ...defaultParams.columnLabelFormats,
        value: {
          ...defaultParams.columnLabelFormats.value,
          replaceMissingDataWith: null
        }
      }
    };

    const { result } = renderHook(() => useDatasetOptions(defaultParams5));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;

    expect(datasetOptions[0].dimensions).toEqual(['date', 'value__🔑__']);
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100],
      ['date__🔑__2024-01-02', null],
      ['date__🔑__2024-01-03', 300]
    ]);
    expect(yAxisKeys).toEqual(['value__🔑__']);
  });
});

describe('useDatasetOptions - bar chart - some string values are null', () => {
  const mockData = [
    { date: '2024-01-01', value: 100, category: 'A' },
    { date: '2024-01-02', value: 100, category: null },
    { date: '2024-01-03', value: 300, category: 'A' }
  ];

  const defaultParams = {
    data: mockData,
    selectedChartType: 'bar' as ChartType,
    selectedAxis: {
      x: ['date'],
      y: ['value'],
      category: ['category'],
      tooltip: []
    },
    columnLabelFormats: {
      date: {
        columnType: 'date',
        style: 'date',
        replaceMissingDataWith: null
      } as IColumnLabelFormat,
      value: {
        columnType: 'number',
        style: 'number',
        replaceMissingDataWith: 0
      } as IColumnLabelFormat,
      category: {
        columnType: 'text',
        style: 'string',
        replaceMissingDataWith: ''
      } as IColumnLabelFormat
    },
    pieMinimumSlicePercentage: undefined,
    barGroupType: undefined,
    lineGroupType: undefined,
    trendlines: undefined,
    columnMetadata: []
  };

  it('should process bar chart data correctly', () => {
    const { result } = renderHook(() => useDatasetOptions(defaultParams));
    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;
    const yAxisKeys = result.current.yAxisKeys;
    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, 0],
      ['date__🔑__2024-01-02', 0, 100],
      ['date__🔑__2024-01-03', 300, 0]
    ]);
    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__null__📍__value__🔑__'
    ]);
    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__null__📍__value__🔑__'
    ]);
  });

  it('replace missing data with a WOWZA - it does not work because it is a string and not a number', () => {
    const defaultParams2 = {
      ...defaultParams,
      columnLabelFormats: {
        ...defaultParams.columnLabelFormats,
        category: {
          ...defaultParams.columnLabelFormats.category,
          replaceMissingDataWith: 'WOWZA'
        }
      }
    };
    const { result } = renderHook(() => useDatasetOptions(defaultParams2));
    const yAxisKeys = result.current.yAxisKeys;

    const datasetOptions = result.current.datasetOptions;
    const source = datasetOptions[0].source;

    expect(source).toEqual([
      ['date__🔑__2024-01-01', 100, 0],
      ['date__🔑__2024-01-02', 0, 100],
      ['date__🔑__2024-01-03', 300, 0]
    ]);

    expect(yAxisKeys).toEqual([
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__null__📍__value__🔑__'
    ]);

    expect(datasetOptions[0].dimensions).toEqual([
      'date',
      'category__🔑__A__📍__value__🔑__',
      'category__🔑__null__📍__value__🔑__'
    ]);
  });
});
