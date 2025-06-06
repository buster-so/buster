import { describe, expect, it, vi } from 'vitest';
import { compareObjectsByKeys } from './objects';

describe('compareObjectsByKeys', () => {
  // Test basic equality
  it('should return true when objects are equal for specified keys', () => {
    const obj1 = { name: 'John', age: 30, city: 'New York' };
    const obj2 = { name: 'John', age: 30, country: 'USA' };

    expect(compareObjectsByKeys(obj1, obj2, ['name', 'age'])).toBe(true);
  });

  // Test inequality
  it('should return false when objects are not equal for specified keys', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'Jane', age: 25 };

    expect(compareObjectsByKeys(obj1, obj2, ['name', 'age'])).toBe(false);
  });

  // Test with nested objects
  it('should correctly compare nested objects', () => {
    const obj1 = { user: { id: 1, name: 'John' }, status: 'active' };
    const obj2 = { user: { id: 1, name: 'John' }, status: 'inactive' };

    expect(compareObjectsByKeys(obj1, obj2, ['user'])).toBe(true);
    expect(compareObjectsByKeys(obj1, obj2, ['status'])).toBe(false);
  });

  // Test with null values
  it('should handle null values correctly', () => {
    const obj1 = { name: 'John', age: null };
    const obj2 = { name: 'John', age: null };
    const obj3 = { name: 'John', age: 30 };

    expect(compareObjectsByKeys(obj1, obj2, ['name', 'age'])).toBe(true);
    expect(compareObjectsByKeys(obj1, obj3, ['name', 'age'])).toBe(false);
  });

  // Test with arrays
  it('should compare arrays correctly', () => {
    const obj1 = { tags: [1, 2, 3], name: 'John' };
    const obj2 = { tags: [1, 2, 3], name: 'Jane' };
    const obj3 = { tags: [1, 2, 4], name: 'John' };

    expect(compareObjectsByKeys(obj1, obj2, ['tags'])).toBe(true);
    expect(compareObjectsByKeys(obj1, obj3, ['tags'])).toBe(false);
  });

  // Test error cases
  it('should throw error for null/undefined objects', () => {
    const obj1 = { name: 'John' };

    expect(() => compareObjectsByKeys(null as any, obj1, ['name'])).toThrow(
      'Both objects must be defined'
    );
    expect(() => compareObjectsByKeys(obj1, undefined as any, ['name'])).toThrow(
      'Both objects must be defined'
    );
  });

  it('should throw error for empty keys array', () => {
    const obj1 = { name: 'John' };
    const obj2 = { name: 'John' };

    expect(() => compareObjectsByKeys(obj1, obj2, [])).toThrow('Keys array must be non-empty');
  });

  // Test with different object shapes
  it('should handle objects with different shapes', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'John', title: 'Developer' };

    expect(compareObjectsByKeys(obj1, obj2, ['name'])).toBe(true);
  });

  it('complex test with debug logging', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    const object1 = {
      colors: [
        '#B399FD',
        '#FC8497',
        '#FBBC30',
        '#279EFF',
        '#E83562',
        '#41F8FF',
        '#F3864F',
        '#C82184',
        '#31FCB4',
        '#E83562'
      ]
    };

    const object2 = {
      colors: [
        '#B399FD',
        '#FC8497',
        '#FBBC30',
        '#279EFF',
        '#E83562',
        '#41F8FF',
        '#F3864F',
        '#C82184',
        '#31FCB4',
        '#E83562'
      ]
    };

    const result = compareObjectsByKeys(object1, object2, ['colors']);

    expect(result).toBe(true);
    consoleSpy.mockRestore();
  });

  it('complex test 2 with debug logging', () => {
    const object1 = {
      id: '84cbc2f3-a4e5-52c5-a784-c9cb14b55eab',
      type: 'metric',
      name: 'Orders vs Revenue Trend',
      version_number: 1,
      description:
        'Combines the monthly count of orders and sales revenue to show their trends side by side.',
      file_name: 'Orders vs Revenue Trend',
      time_frame: 'All time',
      datasets: [
        {
          name: 'entity_sales_order',
          id: '9fa460b4-1410-4e74-aa34-eb79027cd59c'
        }
      ],
      data_source_id: 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a',
      error: null,
      chart_config: {
        colors: [
          '#B399FD',
          '#FC8497',
          '#FBBC30',
          '#279EFF',
          '#E83562',
          '#41F8FF',
          '#F3864F',
          '#C82184',
          '#31FCB4',
          '#E83562'
        ],
        selectedChartType: 'combo',
        yAxisShowAxisLabel: true,
        yAxisShowAxisTitle: true,
        yAxisAxisTitle: null,
        yAxisStartAxisAtZero: null,
        yAxisScaleType: 'linear',
        y2AxisShowAxisLabel: true,
        y2AxisAxisTitle: null,
        y2AxisShowAxisTitle: true,
        y2AxisStartAxisAtZero: true,
        y2AxisScaleType: 'linear',
        xAxisTimeInterval: null,
        xAxisShowAxisLabel: true,
        xAxisShowAxisTitle: true,
        xAxisAxisTitle: null,
        xAxisLabelRotation: 'auto',
        xAxisDataZoom: false,
        categoryAxisTitle: null,
        showLegend: null,
        gridLines: true,
        goalLines: [],
        trendlines: [],
        showLegendHeadline: false,
        disableTooltip: false,
        barAndLineAxis: {
          x: ['month'],
          y: ['order_count'],
          category: [],
          tooltip: null
        },
        scatterAxis: {
          x: ['order_count'],
          y: ['total_revenue'],
          size: [],
          tooltip: null
        },
        comboChartAxis: {
          x: ['month'],
          y: ['order_count', 'total_revenue'],
          y2: [],
          tooltip: null
        },
        pieChartAxis: {
          x: ['month'],
          y: ['order_count'],
          tooltip: null
        },
        lineGroupType: null,
        scatterDotSize: [3, 15],
        barSortBy: [],
        barLayout: 'vertical',
        barGroupType: 'group',
        barShowTotalAtTop: false,
        pieShowInnerLabel: true,
        pieInnerLabelAggregate: 'sum',
        pieInnerLabelTitle: 'Total',
        pieLabelPosition: null,
        pieDonutWidth: 40,
        pieMinimumSlicePercentage: 0,
        pieDisplayLabelAs: 'number',
        metricColumnId: 'order_count',
        metricValueAggregate: 'sum',
        metricHeader: null,
        metricSubHeader: null,
        metricValueLabel: null,
        tableColumnOrder: null,
        tableColumnWidths: null,
        tableHeaderBackgroundColor: null,
        tableHeaderFontColor: null,
        tableColumnFontColor: null,
        columnSettings: {
          month: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          },
          order_count: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          },
          total_revenue: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          }
        },
        columnLabelFormats: {
          month: {
            style: 'date',
            compactNumbers: false,
            columnType: 'date',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'MMM YYYY',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: null,
            makeLabelHumanReadable: true
          },
          order_count: {
            style: 'number',
            compactNumbers: false,
            columnType: 'number',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'auto',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: 0,
            makeLabelHumanReadable: true
          },
          total_revenue: {
            style: 'currency',
            compactNumbers: false,
            columnType: 'number',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'auto',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: 0,
            makeLabelHumanReadable: true
          }
        }
      },
      data_metadata: {
        column_count: 3,
        row_count: 15,
        column_metadata: [
          {
            name: 'month',
            min_value: '2022-02-01',
            max_value: '2023-04-01',
            unique_values: 15,
            simple_type: 'date',
            type: 'date'
          },
          {
            name: 'order_count',
            min_value: 368,
            max_value: 3216,
            unique_values: 15,
            simple_type: 'number',
            type: 'int8'
          },
          {
            name: 'total_revenue',
            min_value: 539906.14,
            max_value: 4113794.05,
            unique_values: 15,
            simple_type: 'number',
            type: 'float8'
          }
        ]
      },
      status: 'notRequested',
      evaluation_score: null,
      evaluation_summary: '',
      file: 'name: Orders vs Revenue Trend\ndescription: Combines the monthly count of orders and sales revenue to show their trends side by side.\ntimeFrame: All time\nsql: "SELECT \\n  DATE_TRUNC(\'month\', order_date)::date AS month, \\n  COUNT(sales_order_id) AS order_count, \\n  SUM(line_total) AS total_revenue\\nFROM sem.entity_sales_order\\nGROUP BY 1\\nORDER BY 1\\n"\nchartConfig:\n  selectedChartType: combo\n  columnLabelFormats:\n    month:\n      columnType: date\n      style: date\n      dateFormat: MMM YYYY\n    order_count:\n      columnType: number\n      style: number\n      minimumFractionDigits: 0\n    total_revenue:\n      columnType: number\n      style: currency\n      minimumFractionDigits: 2\n      currency: USD\n  comboChartAxis:\n    x:\n    - month\n    y:\n    - order_count\n    - total_revenue\ndatasetIds:\n- 9fa460b4-1410-4e74-aa34-eb79027cd59c\n',
      created_at: '2025-04-08T16:31:43.755232Z',
      updated_at: '2025-04-08T16:31:43.755237Z',
      sent_by_id: 'c2dd64cd-f7f3-4884-bc91-d46ae431901e',
      sent_by_name: '',
      sent_by_avatar_url: null,
      code: null,
      dashboards: [
        {
          id: '2057b640-3e98-56e0-a9af-093875a94f17',
          name: 'Sales Dashboard'
        }
      ],
      collections: [],
      versions: [
        {
          version_number: 1,
          updated_at: '2025-04-08T16:31:43.755253Z'
        }
      ],
      permission: 'owner',
      sql: "SELECT \n  DATE_TRUNC('month', order_date)::date AS month, \n  COUNT(sales_order_id) AS order_count, \n  SUM(line_total) AS total_revenue\nFROM sem.entity_sales_order\nGROUP BY 1\nORDER BY 1\n",
      individual_permissions: [
        {
          email: 'chad@buster.so',
          role: 'owner',
          name: 'Chad 🇹🇩'
        }
      ],
      public_expiry_date: null,
      public_enabled_by: null,
      publicly_accessible: false,
      public_password: null
    } as const;

    const object2 = {
      name: 'Orders vs Revenue Trend',
      description:
        'Combines the monthly count of orders and sales revenue to show their trends side by side.',
      chart_config: {
        colors: [
          '#B399FD',
          '#FC8497',
          '#FBBC30',
          '#279EFF',
          '#E83562',
          '#41F8FF',
          '#F3864F',
          '#C82184',
          '#31FCB4',
          '#E83562'
        ],
        selectedChartType: 'combo',
        yAxisShowAxisLabel: true,
        yAxisShowAxisTitle: true,
        yAxisAxisTitle: null,
        yAxisStartAxisAtZero: null,
        yAxisScaleType: 'linear',
        y2AxisShowAxisLabel: true,
        y2AxisAxisTitle: null,
        y2AxisShowAxisTitle: true,
        y2AxisStartAxisAtZero: true,
        y2AxisScaleType: 'linear',
        xAxisTimeInterval: null,
        xAxisShowAxisLabel: true,
        xAxisShowAxisTitle: true,
        xAxisAxisTitle: null,
        xAxisLabelRotation: 'auto',
        xAxisDataZoom: false,
        categoryAxisTitle: null,
        showLegend: null,
        gridLines: true,
        goalLines: [],
        trendlines: [],
        showLegendHeadline: false,
        disableTooltip: false,
        barAndLineAxis: {
          x: ['month'],
          y: ['order_count'],
          category: [],
          tooltip: null
        },
        scatterAxis: {
          x: ['order_count'],
          y: ['total_revenue'],
          size: [],
          tooltip: null
        },
        comboChartAxis: {
          x: ['month'],
          y: ['order_count', 'total_revenue'],
          y2: [],
          tooltip: null
        },
        pieChartAxis: {
          x: ['month'],
          y: ['order_count'],
          tooltip: null
        },
        lineGroupType: null,
        scatterDotSize: [3, 15],
        barSortBy: [],
        barLayout: 'vertical',
        barGroupType: 'group',
        barShowTotalAtTop: false,
        pieShowInnerLabel: true,
        pieInnerLabelAggregate: 'sum',
        pieInnerLabelTitle: 'Total',
        pieLabelPosition: null,
        pieDonutWidth: 40,
        pieMinimumSlicePercentage: 0,
        pieDisplayLabelAs: 'number',
        metricColumnId: 'order_count',
        metricValueAggregate: 'sum',
        metricHeader: null,
        metricSubHeader: null,
        metricValueLabel: null,
        tableColumnOrder: null,
        tableColumnWidths: null,
        tableHeaderBackgroundColor: null,
        tableHeaderFontColor: null,
        tableColumnFontColor: null,
        columnSettings: {
          month: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          },
          order_count: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          },
          total_revenue: {
            showDataLabels: false,
            columnVisualization: 'bar',
            lineWidth: 2,
            lineStyle: 'line',
            lineType: 'normal',
            lineSymbolSize: 0,
            barRoundness: 8,
            showDataLabelsAsPercentage: false
          }
        },
        columnLabelFormats: {
          month: {
            style: 'date',
            compactNumbers: false,
            columnType: 'date',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'MMM YYYY',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: null,
            makeLabelHumanReadable: true
          },
          order_count: {
            style: 'number',
            compactNumbers: false,
            columnType: 'number',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'auto',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: 0,
            makeLabelHumanReadable: true
          },
          total_revenue: {
            style: 'currency',
            compactNumbers: false,
            columnType: 'number',
            displayName: '',
            numberSeparatorStyle: ',',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            currency: 'USD',
            convertNumberTo: null,
            dateFormat: 'auto',
            useRelativeTime: false,
            isUTC: false,
            multiplier: 1,
            prefix: '',
            suffix: '',
            replaceMissingDataWith: 0,
            makeLabelHumanReadable: true
          }
        }
      },
      file: 'name: Orders vs Revenue Trend\ndescription: Combines the monthly count of orders and sales revenue to show their trends side by side.\ntimeFrame: All time\nsql: "SELECT \\n  DATE_TRUNC(\'month\', order_date)::date AS month, \\n  COUNT(sales_order_id) AS order_count, \\n  SUM(line_total) AS total_revenue\\nFROM sem.entity_sales_order\\nGROUP BY 1\\nORDER BY 1\\n"\nchartConfig:\n  selectedChartType: combo\n  columnLabelFormats:\n    month:\n      columnType: date\n      style: date\n      dateFormat: MMM YYYY\n    order_count:\n      columnType: number\n      style: number\n      minimumFractionDigits: 0\n    total_revenue:\n      columnType: number\n      style: currency\n      minimumFractionDigits: 2\n      currency: USD\n  comboChartAxis:\n    x:\n    - month\n    y:\n    - order_count\n    - total_revenue\ndatasetIds:\n- 9fa460b4-1410-4e74-aa34-eb79027cd59c\n'
    } as const;

    const result = compareObjectsByKeys(object1, object2, [
      'name',
      'description',
      'chart_config',
      'file'
    ]);

    expect(result).toBe(true);
  });
});
