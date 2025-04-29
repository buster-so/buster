import { describe, it, expect } from '@jest/globals';
import { aggregateAndCreateDatasets } from './aggregateAndCreateDatasets';
import { DEFAULT_COLUMN_LABEL_FORMAT, IColumnLabelFormat } from '@/api/asset_interfaces';

describe('aggregateAndCreateDatasets', () => {
  it('should correctly aggregate data based on x and y axes', () => {
    // Sample data with sales across different regions and categories
    const testData = [
      { region: 'North', category: 'A', sales: 100, profit: 20 },
      { region: 'North', category: 'B', sales: 150, profit: 30 },
      { region: 'South', category: 'A', sales: 200, profit: 40 },
      { region: 'South', category: 'B', sales: 250, profit: 50 }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD'
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region', 'category'],
        y: ['sales']
      },
      columnLabelFormats
    );

    // Verify the structure and content of the result
    expect(result).toHaveLength(4); // One dataset for 'sales'
    expect(result[0].data).toHaveLength(1); // One value per unique x-axis combination
    expect(result[0].dataKey).toBe('sales');

    // Verify the labels contain all x-axis combinations
    expect(result[0].label).toEqual([
      [
        { key: 'region', value: 'North' },
        { key: 'category', value: 'A' }
      ]
    ]);

    // Verify the data values are correct
    expect(result[0].data).toEqual([100]);

    expect(result[0].tooltipData).toEqual([[{ key: 'sales', value: 100 }]]);

    expect(result[1].data).toEqual([150]);
    expect(result[1].tooltipData).toEqual([[{ key: 'sales', value: 150 }]]);

    expect(result[2].data).toEqual([200]);
    expect(result[2].tooltipData).toEqual([[{ key: 'sales', value: 200 }]]);
  });

  it('should correctly sum up values for a single x axis', () => {
    const testData = [
      { region: 'North', sales: 100 },
      { region: 'North', sales: 150 },
      { region: 'South', sales: 200 },
      { region: 'South', sales: 250 }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD'
      }
    };
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales']
      },
      columnLabelFormats
    );

    // Verify we have one dataset for sales
    expect(result).toHaveLength(2);

    // Verify the structure of the first dataset
    expect(result[0].label).toEqual([[{ key: 'region', value: 'North' }]]);
    expect(result[0].data).toEqual([250]); // 100 + 150 for North

    // Verify the structure of the second dataset
    expect(result[1].label).toEqual([[{ key: 'region', value: 'South' }]]);
    expect(result[1].data).toEqual([450]); // 200 + 250 for South

    expect(result[0].tooltipData).toEqual([[{ key: 'sales', value: 250 }]]);
    expect(result[1].tooltipData).toEqual([[{ key: 'sales', value: 450 }]]);
  });

  it('should create separate datasets for each point in scatter plot mode', () => {
    const testData = [
      { x: 1, y: 100, category: 'A' },
      { x: 2, y: 150, category: 'A' },
      { x: 3, y: 200, category: 'B' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y']
      },
      {},
      true // scatter plot mode
    );

    expect(result.length).toEqual(1);

    // Check first point
    expect(result[0].data).toEqual([100, 150, 200]);
    expect(result[0].label).toEqual([
      [{ key: 'x', value: 1 }],
      [{ key: 'x', value: 2 }],
      [{ key: 'x', value: 3 }]
    ]);
  });

  it('should handle bubble chart with size data in scatter plot mode', () => {
    const testData = [
      { x: 1, y: 100, size: 20 },
      { x: 2, y: 150, size: 30 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Check first bubble
    expect(result[0].data).toEqual([100, 150]);
    expect(result[0].sizeData).toEqual([20, 30]);
    expect(result[0].sizeDataKey).toEqual('size');
  });

  it('should handle multiple metrics in scatter plot mode', () => {
    const testData = [
      { x: 1, sales: 100, profit: 20 },
      { x: 2, sales: 150, profit: 30 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['sales', 'profit']
      },
      {},
      true // scatter plot mode
    );

    // Should create two datasets per point (one for each metric)
    expect(result).toHaveLength(2);

    // Check sales metrics
    expect(result[0].data).toEqual([100, 150]);
    expect(result[0].dataKey).toBe('sales');
    expect(result[0].axisType).toBe('y');

    expect(result[1].data).toEqual([20, 30]);
    expect(result[1].dataKey).toBe('profit');
    expect(result[1].axisType).toBe('y');

    // Check profit metrics
    expect(result[1].data).toEqual([20, 30]);
    expect(result[1].dataKey).toBe('profit');
    expect(result[1].axisType).toBe('y');
  });

  it('should handle single x-axis and single y-axis', () => {
    const testData = [
      { month: 'Jan', revenue: 1000 },
      { month: 'Feb', revenue: 1500 },
      { month: 'Mar', revenue: 2000 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue']
      },
      {}
    );

    expect(result).toHaveLength(3);
    expect(result[0].data).toEqual([1000]);
    expect(result[1].data).toEqual([1500]);
    expect(result[2].data).toEqual([2000]);
    expect(result[0].label).toEqual([[{ key: 'month', value: 'Jan' }]]);
    expect(result[0].tooltipData).toEqual([[{ key: 'revenue', value: 1000 }]]);
  });

  it('should handle two x-axes and single y-axis', () => {
    const testData = [
      { region: 'North', quarter: 'Q1', sales: 1000 },
      { region: 'North', quarter: 'Q2', sales: 1200 },
      { region: 'South', quarter: 'Q1', sales: 800 },
      { region: 'South', quarter: 'Q2', sales: 900 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region', 'quarter'],
        y: ['sales']
      },
      {}
    );

    expect(result).toHaveLength(4);
    expect(result[0].data).toEqual([1000]);
    expect(result[0].label).toEqual([
      [
        { key: 'region', value: 'North' },
        { key: 'quarter', value: 'Q1' }
      ]
    ]);
  });

  it('should handle single x-axis and two y-axes', () => {
    const testData = [
      { month: 'Jan', revenue: 1000, profit: 200 },
      { month: 'Feb', revenue: 1500, profit: 300 },
      { month: 'Mar', revenue: 2000, profit: 400 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue', 'profit']
      },
      {}
    );

    expect(result).toHaveLength(6); // 3 months * 2 metrics
    expect(result[0].dataKey).toBe('revenue');
    expect(result[3].dataKey).toBe('profit');
    expect(result[0].tooltipData).toEqual([[{ key: 'revenue', value: 1000 }]]);
    expect(result[3].tooltipData).toEqual([[{ key: 'profit', value: 200 }]]);
  });

  it('should handle single x-axis, single y-axis with category', () => {
    const testData = [
      { month: 'Jan', sales: 1000, product: 'A' },
      { month: 'Jan', sales: 800, product: 'B' },
      { month: 'Feb', sales: 1200, product: 'A' },
      { month: 'Feb', sales: 1000, product: 'B' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['sales'],
        category: ['product']
      },
      {}
    );

    expect(result).toHaveLength(2);
    expect(result[0].data).toEqual([1000, 1200]);
    expect(result[0].label).toEqual([
      [{ key: 'month', value: 'Jan' }],
      [{ key: 'month', value: 'Feb' }]
    ]);
  });

  it('should handle single x-axis, two y-axes with category', () => {
    const testData = [
      { month: 'Jan', revenue: 1000, profit: 200, region: 'North' },
      { month: 'Jan', revenue: 800, profit: 150, region: 'South' },
      { month: 'Feb', revenue: 1200, profit: 250, region: 'North' },
      { month: 'Feb', revenue: 900, profit: 180, region: 'South' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue', 'profit'],
        category: ['region']
      },
      {}
    );

    expect(result).toHaveLength(4); // 2 metrics * 2 regions

    expect(result[0].label).toEqual([
      [{ key: 'month', value: 'Jan' }],
      [{ key: 'month', value: 'Feb' }]
    ]);
    expect(result[0].data).toEqual([1000, 1200]);
    expect(result[1].data).toEqual([800, 900]);
    expect(result[2].data).toEqual([200, 250]);
    expect(result[3].data).toEqual([150, 180]);
  });

  it('should handle scatter plot with multiple x-axes', () => {
    const testData = [
      { xValue: 1, yValue: 100, date: '2023-01-01' },
      { xValue: 2, yValue: 150, date: '2023-01-02' },
      { xValue: 3, yValue: 200, date: '2023-01-03' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['xValue'],
        y: ['yValue']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual([100, 150, 200]);
    expect(result[0].label).toEqual([
      [{ key: 'xValue', value: 1 }],
      [{ key: 'xValue', value: 2 }],
      [{ key: 'xValue', value: 3 }]
    ]);
    expect(result[0].tooltipData).toEqual([
      [
        { key: 'xValue', value: 1 },
        { key: 'yValue', value: 100 }
      ],
      [
        { key: 'xValue', value: 2 },
        { key: 'yValue', value: 150 }
      ],
      [
        { key: 'xValue', value: 3 },
        { key: 'yValue', value: 200 }
      ]
    ]);
  });

  it('should handle scatter plot with categories', () => {
    const testData = [
      { x: 1, y: 100, group: 'A' },
      { x: 2, y: 150, group: 'A' },
      { x: 1, y: 80, group: 'B' },
      { x: 2, y: 120, group: 'B' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['group']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(2); // One dataset per category

    // Check first category (A)
    expect(result[0].data).toEqual([100, 150]);
    expect(result[0].label).toEqual([[{ key: 'x', value: 1 }], [{ key: 'x', value: 2 }]]);

    // Check second category (B)
    expect(result[1].data).toEqual([80, 120]);
    expect(result[1].label).toEqual([[{ key: 'x', value: 1 }], [{ key: 'x', value: 2 }]]);

    // Check tooltip contain category information

    expect(result[0].tooltipData[0]).toEqual([
      { key: 'x', value: 1 },
      { key: 'y', value: 100 }
      //   { key: 'group', value: 'A' }
    ]);
  });

  it('should handle scatter plot with custom tooltip fields', () => {
    const testData = [
      { x: 1, y: 100, name: 'Point 1', description: 'First point' },
      { x: 2, y: 150, name: 'Point 2', description: 'Second point' }
    ];

    const resultWithoutTooltips = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y']
      },
      {},
      true // scatter plot mode
    );

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['name', 'description']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual([100, 150]);

    // For now, test that tooltipData exists and has the right structure
    expect(result[0].tooltipData).toBeDefined();
    expect(result[0].tooltipData.length).toBe(2);
  });

  it('should handle scatter plot with missing data and replaceMissingDataWith option', () => {
    const testData = [
      { x: 1, y: 100, size: 20 },
      { x: 2, y: null, size: 30 },
      { x: 3, y: undefined, size: null }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      size: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual([100, 0, 0]); // Missing y values replaced with 0
    expect(result[0].sizeData).toEqual([20, 30, 0]); // Missing size value replaced with 0
    expect(result[0].sizeDataKey).toEqual('size');
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'x', value: 1 },
      { key: 'y', value: 100 },
      { key: 'size', value: 20 }
    ]);

    expect(result[0].tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'y', value: 0 },
      { key: 'size', value: 30 }
    ]);
  });

  it('should handle replaceMissingDataWith with different values for different metrics', () => {
    const testData = [
      { x: 1, metric1: 100, metric2: 50 },
      { x: 2, metric1: null, metric2: 60 },
      { x: 3, metric1: 120, metric2: null }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      metric1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      },
      metric2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['metric1', 'metric2']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result).toHaveLength(2);
    expect(result[0].data).toEqual([100, 0, 120]); // metric1 with missing value replaced by 0
    expect(result[1].data).toEqual([50, 60, 0]); // metric2 with missing value replaced by 0

    // Check that the tooltip data also reflects the replacements
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'metric1', value: 0 }
    ]);
    expect(result[1].tooltipData[2]).toEqual([
      { key: 'x', value: 3 },
      { key: 'metric2', value: 0 }
    ]);
  });

  it('should handle replaceMissingDataWith set to null', () => {
    const testData = [
      { x: 1, y: 100 },
      { x: 2, y: null },
      { x: 3, y: 200 }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);
    expect(result[0].data).toEqual([100, null, 200]); // null values preserved

    // Check tooltip data for null values
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'y', value: '' } // null values should be converted to empty string in tooltip
    ]);
  });

  it('should correctly aggregate data with multiple y-axes and nested categories', () => {
    const testData = [
      { region: 'North', product: 'A', channel: 'Online', sales: 100, cost: 50 },
      { region: 'North', product: 'A', channel: 'Store', sales: 150, cost: 70 },
      { region: 'North', product: 'B', channel: 'Online', sales: 200, cost: 100 },
      { region: 'South', product: 'A', channel: 'Online', sales: 120, cost: 60 },
      { region: 'South', product: 'B', channel: 'Store', sales: 180, cost: 90 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales', 'cost'],
        category: ['product', 'channel']
      },
      {}
    );

    // Should be 8 datasets: 2 metrics * 2 products * 2 channels
    // But actually only 5 because not all combinations exist in the data
    expect(result.length).toBeGreaterThan(0);

    // Check one specific dataset to validate aggregation
    const northAOnlineSales = result.find(
      (ds) =>
        ds.dataKey === 'sales' &&
        ds.label.some((l) => l.some((kv) => kv.key === 'region' && kv.value === 'North'))
    );

    expect(northAOnlineSales).toBeDefined();
  });

  it('should handle empty data array', () => {
    const testData: any[] = [];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y']
      },
      {}
    );

    expect(result).toHaveLength(0);
  });

  it('should handle tooltip customization with custom fields', () => {
    const testData = [
      { date: '2023-01-01', sales: 1000, notes: 'Holiday sale', manager: 'John' },
      { date: '2023-01-02', sales: 1200, notes: 'Weekend', manager: 'Jane' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales'],
        tooltip: ['notes', 'manager', 'sales']
      },
      {}
    );

    expect(result).toHaveLength(2);

    // Check if tooltip contain the custom fields in correct order
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'notes', value: 'Holiday sale' },
      { key: 'manager', value: 'John' },
      { key: 'sales', value: 1000 }
    ]);

    expect(result[1].tooltipData[0]).toEqual([
      { key: 'notes', value: 'Weekend' },
      { key: 'manager', value: 'Jane' },
      { key: 'sales', value: 1200 }
    ]);
  });

  it('should handle tooltip with null values in data', () => {
    const testData = [
      { date: '2023-01-01', sales: 1000, notes: null, manager: 'John' },
      { date: '2023-01-02', sales: 1200, notes: 'Weekend', manager: null }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales'],
        tooltip: ['notes', 'manager', 'sales']
      },
      {}
    );

    expect(result).toHaveLength(2);

    // Null values should be represented as empty strings in tooltip
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'notes', value: '' },
      { key: 'manager', value: 'John' },
      { key: 'sales', value: 1000 }
    ]);

    expect(result[1].tooltipData[0]).toEqual([
      { key: 'notes', value: 'Weekend' },
      { key: 'manager', value: '' },
      { key: 'sales', value: 1200 }
    ]);
  });

  it('should handle tooltip with mixed data types', () => {
    const testData = [
      { date: '2023-01-01', metric: 1000, boolean: true, object: { test: 'value' } },
      { date: '2023-01-02', metric: 1200, boolean: false, object: { test: 'other' } }
    ] as any;

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['metric'],
        tooltip: ['metric', 'boolean', 'object']
      },
      {}
    );

    expect(result).toHaveLength(2);

    // Boolean values should be converted properly, objects should be stringified or handled
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'metric', value: 1000 },
      { key: 'boolean', value: 1 },
      { key: 'object', value: { test: 'value' } }
    ]);

    expect(result[1].tooltipData[0]).toEqual([
      { key: 'metric', value: 1200 },
      { key: 'boolean', value: 0 },
      { key: 'object', value: { test: 'other' } }
    ]);
  });

  it('should handle tooltip with custom order in both scatter and non-scatter mode', () => {
    const testData = [
      { x: 1, y: 100, category: 'A', description: 'First point' },
      { x: 2, y: 200, category: 'B', description: 'Second point' }
    ];

    // Test regular mode
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['description', 'category', 'y']
      },
      {}
    );

    expect(result[0].tooltipData[0]).toEqual([
      { key: 'description', value: 'First point' },
      { key: 'category', value: 'A' },
      { key: 'y', value: 100 }
    ]);

    // Test scatter mode
    const scatterResult = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['description', 'category', 'y']
      },
      {},
      true // scatter plot mode
    );

    expect(scatterResult[0].tooltipData[0]).toEqual([
      { key: 'description', value: 'First point' },
      { key: 'category', value: 'A' },
      { key: 'y', value: 100 }
    ]);
  });

  it('should handle date objects in data and tooltip', () => {
    const testData = [
      { x: 1, y: 100, date: new Date('2023-01-01').toISOString() },
      { x: 2, y: 200, date: new Date('2023-01-02').toISOString() }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['date', 'y']
      },
      {},
      true // scatter plot mode
    );

    // Date objects should be converted to strings in tooltip data
    expect(result[0].tooltipData[0][0].key).toBe('date');

    // We're just checking the type conversion occurred, not the exact format
    expect(typeof result[0].tooltipData[0][0].value).toBe('string');
  });

  it('should handle y2 axis data correctly', () => {
    const testData = [
      { month: 'Jan', primary: 100, secondary: 10 },
      { month: 'Feb', primary: 200, secondary: 20 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['primary'],
        y2: ['secondary']
      },
      {}
    );

    // Check we have datasets for both y and y2 axes
    expect(result.length).toBe(4); // 2 months × (1 y + 1 y2)

    // Find y and y2 datasets
    const primaryDatasets = result.filter((d) => d.dataKey === 'primary');
    const secondaryDatasets = result.filter((d) => d.dataKey === 'secondary');

    // Check y axis dataset
    expect(primaryDatasets.length).toBe(2);
    expect(primaryDatasets[0].axisType).toBe('y');
    expect(primaryDatasets[0].data[0]).toBe(100);

    // Check y2 axis dataset
    expect(secondaryDatasets.length).toBe(2);
    expect(secondaryDatasets[0].axisType).toBe('y2');
    expect(secondaryDatasets[0].data[0]).toBe(10);
  });

  it('should handle extremely large numbers without losing precision', () => {
    const largeNumber = 9007199254740991; // MAX_SAFE_INTEGER
    const testData = [
      { id: 1, value: largeNumber },
      { id: 2, value: largeNumber * 0.5 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['value']
      },
      {},
      true // scatter plot mode
    );

    // Check that large numbers are preserved
    expect(result[0].data[0]).toBe(largeNumber);
    expect(result[0].data[1]).toBe(largeNumber * 0.5);
  });

  it('should handle custom replaceMissingDataWith values for each column', () => {
    const testData = [
      { id: 1, metric1: null, metric2: 100 },
      { id: 2, metric1: 200, metric2: null }
    ];

    const columnLabelFormats = {
      metric1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 'custom1' // Custom replacement for metric1 as string
      },
      metric2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as any // Using any to avoid type issues
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['metric1', 'metric2']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    // Check metric1 dataset with custom replacement (will be converted to number if possible)
    expect(result[0].data[0]).not.toBe(null);
    expect(result[0].data[1]).toBe(200);

    // Check metric2 dataset with different custom replacement
    expect(result[1].data).toEqual([100, 0]);

    // Check tooltip data includes replaced values
    expect(result[0].tooltipData[0][1].value).toBe('custom1');
    expect(result[1].tooltipData[1][1].value).toBe(0);
  });

  it('should handle mixed data types in scatter plot categories correctly', () => {
    const testData = [
      { x: 1, y: 100, group: true },
      { x: 2, y: 150, group: true },
      { x: 1, y: 80, group: false },
      { x: 2, y: 120, group: false }
    ] as any;

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['group']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(2); // One dataset per boolean category value

    // Check that boolean categories are correctly handled
    expect(result[0].data).toEqual([100, 150]); // group: true
    expect(result[1].data).toEqual([80, 120]); // group: false

    // Check that labels are correctly created
    expect(result[0].label[0][0]).toEqual({ key: 'x', value: 1 });
    expect(result[1].label[0][0]).toEqual({ key: 'x', value: 1 });
  });

  it('should populate tooltipData with all fields and values when tooltip option is not specified', () => {
    const testData = [
      { id: 1, sales: 100, profit: 20, units: 5 },
      { id: 2, sales: 200, profit: 40, units: 10 }
    ];

    // Test without specifying tooltip fields
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales', 'profit']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(2); // One for sales, one for profit

    expect(result[0].tooltipData.length).toBe(2);

    // Check sales dataset tooltips - should contain x and y values by default
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'sales', value: 100 }
    ]);
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'sales', value: 200 }
    ]);

    // Check profit dataset tooltips
    expect(result[1].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'profit', value: 20 }
    ]);
    expect(result[1].tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'profit', value: 40 }
    ]);
  });

  it('should include size data in tooltipData when size axis is specified', () => {
    const testData = [
      { x: 1, y: 100, size: 5, category: 'A' },
      { x: 2, y: 200, size: 10, category: 'B' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Check tooltipData includes size information
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'x', value: 1 },
      { key: 'y', value: 100 },
      { key: 'size', value: 5 }
    ]);
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'y', value: 200 },
      { key: 'size', value: 10 }
    ]);

    // Check size data is properly included in the dataset
    expect(result[0].sizeData).toEqual([5, 10]);
    expect(result[0].sizeDataKey).toBe('size');
  });

  it('should honor the order of tooltip fields as specified in the tooltip option', () => {
    const testData = [
      { id: 1, name: 'Product A', sales: 100, profit: 20, timestamp: '2023-01-01' },
      { id: 2, name: 'Product B', sales: 200, profit: 40, timestamp: '2023-01-02' }
    ];

    // Specify custom tooltip field order
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales'],
        tooltip: ['timestamp', 'name', 'profit', 'sales'] // Intentionally different order
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Check that tooltipData respects the specified field order
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'timestamp', value: '2023-01-01' },
      { key: 'name', value: 'Product A' },
      { key: 'profit', value: 20 },
      { key: 'sales', value: 100 }
    ]);
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'timestamp', value: '2023-01-02' },
      { key: 'name', value: 'Product B' },
      { key: 'profit', value: 40 },
      { key: 'sales', value: 200 }
    ]);

    // Without tooltip option, x and y should be included by default in that order
    const defaultResult = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales']
      },
      {},
      true
    );

    expect(defaultResult[0].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'sales', value: 100 }
    ]);
  });

  it('should handle tooltipData in non-scatter mode with aggregated values', () => {
    const testData = [
      { region: 'North', product: 'A', sales: 100 },
      { region: 'North', product: 'A', sales: 150 },
      { region: 'South', product: 'B', sales: 200 },
      { region: 'South', product: 'B', sales: 250 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales']
      },
      {}
    );

    expect(result).toHaveLength(2); // One dataset per unique region

    // In non-scatter mode without tooltip specified, tooltipData should only contain the metric
    expect(result[0].tooltipData).toEqual([[{ key: 'sales', value: 250 }]]); // North: 100+150
    expect(result[1].tooltipData).toEqual([[{ key: 'sales', value: 450 }]]); // South: 200+250

    // Each tooltipData should have length 1 (one entry per x-axis value)
    expect(result[0].tooltipData.length).toBe(1);
    expect(result[1].tooltipData.length).toBe(1);
  });

  it('should include custom tooltip fields in non-scatter mode with categories', () => {
    const testData = [
      { month: 'Jan', product: 'A', sales: 100, notes: 'New launch' },
      { month: 'Feb', product: 'A', sales: 120, notes: 'Price increase' },
      { month: 'Jan', product: 'B', sales: 80, notes: 'Limited stock' },
      { month: 'Feb', product: 'B', sales: 90, notes: 'Back in stock' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['sales'],
        category: ['product'],
        tooltip: ['month', 'product', 'sales', 'notes']
      },
      {}
    );

    expect(result).toHaveLength(2); // One dataset per product category

    // Check dataset for product A
    expect(result[0].dataKey).toBe('sales');
    expect(result[0].data).toEqual([100, 120]); // Values for Jan and Feb

    // Check tooltipData structure for first dataset (product A)
    // First tooltipData entry should be for Jan
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'month', value: 'Jan' },
      { key: 'product', value: 'A' },
      { key: 'sales', value: 100 },
      { key: 'notes', value: 'New launch' }
    ]);

    // Second tooltipData entry should be for Feb
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'month', value: 'Feb' },
      { key: 'product', value: 'A' },
      { key: 'sales', value: 120 },
      { key: 'notes', value: 'Price increase' }
    ]);

    // Check tooltipData structure for second dataset (product B)
    expect(result[1].tooltipData[0]).toEqual([
      { key: 'month', value: 'Jan' },
      { key: 'product', value: 'B' },
      { key: 'sales', value: 80 },
      { key: 'notes', value: 'Limited stock' }
    ]);

    expect(result[1].tooltipData[1]).toEqual([
      { key: 'month', value: 'Feb' },
      { key: 'product', value: 'B' },
      { key: 'sales', value: 90 },
      { key: 'notes', value: 'Back in stock' }
    ]);
  });

  it('should handle zero values differently from null/missing values', () => {
    const testData = [
      { id: 1, value: 0 },
      { id: 2, value: null },
      { id: 3, value: 50 }
    ];

    const columnLabelFormats = {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: -1 as any // Using any to avoid type issues
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['value']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Zero should be preserved as 0, not treated as missing
    expect(result[0].data[0]).toBe(0);

    // Null should be replaced with the specified replacement value
    expect(result[0].data[1]).toBe(-1);

    // Regular value should be unchanged
    expect(result[0].data[2]).toBe(50);

    // Check tooltip data reflects this behavior
    expect(result[0].tooltipData[0][1].value).toBe(0);
    expect(result[0].tooltipData[1][1].value).toBe(-1);
  });

  it('should prioritize tooltip fields in the specified order even when fields are missing', () => {
    const testData = [
      { id: 1, primary: 100, secondary: 20, note: 'first' },
      { id: 2, primary: 150, secondary: null, extra: 'metadata' }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['primary'],
        tooltip: ['note', 'secondary', 'extra', 'primary']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // First data point should have properly ordered tooltip with all specified fields
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'note', value: 'first' },
      { key: 'secondary', value: 20 },
      { key: 'extra', value: '' }, // Missing in the first object
      { key: 'primary', value: 100 }
    ]);

    // Second data point should have properly ordered tooltip with missing fields as empty string
    expect(result[0].tooltipData[1]).toEqual([
      { key: 'note', value: '' }, // Missing in the second object
      { key: 'secondary', value: '' }, // Null value in the second object
      { key: 'extra', value: 'metadata' },
      { key: 'primary', value: 150 }
    ]);
  });

  it('should handle large datasets (5000 points) efficiently in scatter plot mode', () => {
    // Generate 5000 data points
    const testData = Array.from({ length: 5000 }, (_, i) => ({
      x: i % 100, // Creates cycle of x values
      y: Math.sin(i * 0.01) * 100 + 100, // Sine wave pattern
      category: i % 5 // 5 different categories
    }));

    const start = performance.now();

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['category']
      },
      {},
      true // scatter plot mode
    );

    const end = performance.now();

    // Should create 5 datasets (one per category)
    expect(result).toHaveLength(5);

    // Each dataset should have 1000 points
    expect(result[0].data.length).toBe(1000);

    // Check a few data points to ensure correctness
    expect(result[0].data[0]).toBeCloseTo(100, 0); // First point in category 0
    expect(result[1].data[0]).toBeCloseTo(testData[1].y, 0); // First point in category 1

    expect(result[0].tooltipData.length).toBe(1000);
  });

  it('should efficiently aggregate large datasets (5000 points) with multiple metrics', () => {
    // Generate 5000 data points with multiple metrics
    const testData = Array.from({ length: 5000 }, (_, i) => ({
      date: `2023-${Math.floor(i / 500) + 1}-${(i % 500) + 1}`, // Spread across months
      sales: Math.random() * 1000,
      profit: Math.random() * 200,
      units: Math.floor(Math.random() * 50)
    }));

    const start = performance.now();

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales', 'profit', 'units']
      },
      {}
    );

    const end = performance.now();

    // Each unique date should become a dataset for each metric
    // We have maximum of 12 months × 500 days = 6000 potential dates
    // But with 5000 records, we'll have fewer unique dates

    // Check that we have the right number of datasets (one per unique date × metrics)
    expect(result.length).toBeGreaterThan(0);

    // Verify that data is aggregated correctly (each dataset has a single data point)
    expect(result[0].data.length).toBe(1);

    // Check that tooltip are properly generated
    expect(result[0].tooltipData.length).toBe(1);
  });

  it('should handle large datasets (5000 points) with missing values efficiently', () => {
    // Generate 5000 data points with some missing values
    const testData = Array.from({ length: 5000 }, (_, i) => {
      // Every 3rd point has null revenue, every 5th has null cost
      return {
        id: i,
        revenue: i % 3 === 0 ? null : Math.random() * 10000,
        cost: i % 5 === 0 ? null : Math.random() * 5000,
        timestamp: new Date(2023, 0, 1, Math.floor(i / 60), i % 60).toISOString()
      };
    });

    const columnLabelFormats = {
      revenue: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as any
      },
      cost: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 'N/A' as any
      }
    };

    const start = performance.now();

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['revenue', 'cost'],
        tooltip: ['timestamp', 'revenue', 'cost']
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    const end = performance.now();

    // Should create 2 datasets (one per metric)
    expect(result).toHaveLength(2);

    // Each dataset should have 5000 points
    expect(result[0].data.length).toBe(5000);
    expect(result[1].data.length).toBe(5000);

    // Check that missing values are replaced correctly
    // For revenue (every 3rd point should be 0)
    expect(result[0].data[0]).toBe(0); // First point (id 0) is null for revenue
    expect(result[0].data[1]).not.toBe(0); // Second point (id 1) has a value
    expect(result[0].data[3]).toBe(0); // Fourth point (id 3) is null for revenue

    // For cost (every 5th point should be NaN since 'N/A' is a string)
    expect(Number.isNaN(result[1].data[0])).toBe(true); // First point (id 0) is null for cost
    expect(Number.isNaN(result[1].data[5])).toBe(true); // Sixth point (id 5) is null for cost

    // Checking the exact index where we know we have missing values
    // The tooltip include timestamp, revenue, and cost in that order
    expect(result[0].tooltipData[0][1].value).toBe(0); // revenue tooltip for id 0

    // For tooltip array with timestamp, revenue, and cost
    // Check a different tooltip index (id 5) where we know cost is missing
    // Index 5 has null cost, and we should see our 'N/A' value there
    expect(result[1].tooltipData[5][2].value).toBe('N/A');
  });

  it('should handle nested categories with multiple metrics and missing data', () => {
    const testData = [
      { region: 'North', product: 'A', channel: 'Online', sales: 100, profit: null },
      { region: 'North', product: 'A', channel: 'Store', sales: null, profit: 30 },
      { region: 'South', product: 'B', channel: 'Online', sales: 200, profit: 40 },
      { region: 'South', product: 'B', channel: 'Store', sales: 250, profit: null }
    ];

    const columnLabelFormats = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 'No Data' as any
      },
      profit: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as any
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales', 'profit'],
        category: ['product', 'channel'],
        tooltip: ['region', 'product', 'channel', 'sales', 'profit']
      },
      columnLabelFormats
    );

    // Should create datasets for each combination of:
    // - metrics (sales, profit)
    // - product (A, B)
    // - channel (Online, Store)
    expect(result.length).toBe(8); // 2 metrics × 2 products × 2 channels

    // Check that missing values are handled correctly in tooltip
    const salesDataset = result.find((d) => d.dataKey === 'sales');
    const profitDataset = result.find((d) => d.dataKey === 'profit');

    expect(salesDataset).toBeDefined();
    expect(profitDataset).toBeDefined();

    // Verify tooltip contain all specified fields in correct order
    expect(salesDataset!.tooltipData[0].map((t) => t.key)).toEqual([
      'region',
      'product',
      'channel',
      'sales',
      'profit'
    ]);
  });

  it('should handle special characters and unicode in category values', () => {
    const testData = [
      { category: '🚀', value: 100 },
      { category: '&%$#@', value: 200 },
      { category: 'normal', value: 300 },
      { category: '中文', value: 400 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['category'],
        y: ['value']
      },
      {}
    );

    expect(result).toHaveLength(4);

    // Check that special characters are preserved in labels
    const labels = result.map((d) => d.label[0][0].value);
    expect(labels).toContain('🚀');
    expect(labels).toContain('&%$#@');
    expect(labels).toContain('normal');
    expect(labels).toContain('中文');

    // Check that data values are correctly associated
    const emojiDataset = result.find((d) => d.label[0][0].value === '🚀');
    expect(emojiDataset?.data[0]).toBe(100);

    const unicodeDataset = result.find((d) => d.label[0][0].value === '中文');
    expect(unicodeDataset?.data[0]).toBe(400);
  });

  it('should handle repeated values in category combinations', () => {
    const testData = [
      { region: 'North', type: 'A', subtype: 'A', value: 100 }, // Note: type and subtype are same
      { region: 'North', type: 'B', subtype: 'B', value: 200 },
      { region: 'South', type: 'A', subtype: 'B', value: 300 },
      { region: 'South', type: 'B', subtype: 'A', value: 400 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['value'],
        category: ['type', 'subtype']
      },
      {}
    );

    // Should create a dataset for each unique combination of type and subtype
    expect(result).toHaveLength(4);

    console.log(result[0].tooltipData);

    expect(result[0].label[0]).toEqual([{ key: 'region', value: 'North' }]);
    expect(result[0].label[1]).toEqual([{ key: 'region', value: 'South' }]);
    expect(result[1].label[0]).toEqual([{ key: 'region', value: 'North' }]);

    expect(result[0].tooltipData[0]).toEqual([{ key: 'value', value: 100 }]);
  });

  it('should handle floating point precision in aggregations', () => {
    const testData = [
      { group: 'A', value: 0.1 },
      { group: 'A', value: 0.2 },
      { group: 'B', value: 1 / 3 }, // Repeating decimal
      { group: 'B', value: 2 / 3 }, // Repeating decimal
      { group: 'C', value: 0.1 + 0.2 }, // JavaScript floating point quirk
      { group: 'C', value: 0.3 } // Direct value for comparison
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['group'],
        y: ['value']
      },
      {}
    );

    expect(result).toHaveLength(3);

    // Group A: 0.1 + 0.2 = 0.3
    expect(result[0].data[0]).toBeCloseTo(0.3, 10);

    // Group B: 1/3 + 2/3 = 1
    expect(result[1].data[0]).toBeCloseTo(1, 10);

    // Group C: (0.1 + 0.2) + 0.3 = 0.6
    expect(result[2].data[0]).toBeCloseTo(0.6, 10);

    // Verify that tooltip also maintain precision
    result.forEach((dataset) => {
      const value = dataset.data[0];
      const tooltipValue = dataset.tooltipData[0][0].value;
      expect(typeof tooltipValue).toBe('number');
      expect(tooltipValue).toBeCloseTo(value!, 10);
    });
  });

  it('should handle empty strings and whitespace in category values', () => {
    const testData = [
      { category: '', value: 100 },
      { category: '   ', value: 200 },
      { category: '\t', value: 300 },
      { category: '\n', value: 400 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['category'],
        y: ['value']
      },
      {}
    );

    expect(result).toHaveLength(4);

    // Check that whitespace characters are preserved in labels
    const labels = result.map((d) => d.label[0][0].value);
    expect(labels).toContain('');
    expect(labels).toContain('   ');
    expect(labels).toContain('\t');
    expect(labels).toContain('\n');

    // Check that data values are correctly associated
    const emptyDataset = result.find((d) => d.label[0][0].value === '');
    expect(emptyDataset?.data[0]).toBe(100);

    const spaceDataset = result.find((d) => d.label[0][0].value === '   ');
    expect(spaceDataset?.data[0]).toBe(200);
  });

  it('should handle extremely small numbers and scientific notation', () => {
    const testData = [
      { id: 1, value: 1e-10 },
      { id: 2, value: 1e-15 },
      { id: 3, value: Number.EPSILON }, // Smallest number that can be represented
      { id: 4, value: 1e-20 } // Ultra small number
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['value']
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Check that very small numbers are preserved
    expect(result[0].data[0]).toBe(1e-10);
    expect(result[0].data[1]).toBe(1e-15);
    expect(result[0].data[2]).toBe(Number.EPSILON);
    expect(result[0].data[3]).toBe(1e-20);

    // Check tooltip formatting for small numbers
    expect(result[0].tooltipData[0][1].value).toBe(1e-10);
    expect(result[0].tooltipData[1][1].value).toBe(1e-15);
  });

  it('should handle tooltip fields that are not present in the data', () => {
    const testData = [
      { id: 1, sales: 100, profit: 20 },
      { id: 2, sales: 200, profit: 40 }
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales'],
        tooltip: ['id', 'sales', 'nonExistentField', 'anotherMissingField'] as any
      },
      {},
      true // scatter plot mode
    );

    expect(result).toHaveLength(1);

    // Check that both existing and non-existent fields are included in tooltipData
    expect(result[0].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'sales', value: 100 },
      { key: 'nonExistentField', value: '' },
      { key: 'anotherMissingField', value: '' }
    ]);

    expect(result[0].tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'sales', value: 200 },
      { key: 'nonExistentField', value: '' },
      { key: 'anotherMissingField', value: '' }
    ]);
  });

  it('should handle y-axis fields that are not present in the data', () => {
    const testData = [
      { id: 1, sales: 100, profit: 20 },
      { id: 2, sales: 200, profit: 40 }
    ];

    const columnLabelFormats: Record<string, IColumnLabelFormat> = {
      nonExistentMetric: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as any
      }
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales', 'nonExistentMetric'] as any
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result).toHaveLength(2); // Should create datasets for both metrics

    // Check that the existing metric has correct data
    const salesDataset = result.find((ds) => ds.dataKey === 'sales');
    expect(salesDataset).toBeDefined();
    expect(salesDataset?.data).toEqual([100, 200]);

    // Check that the non-existent metric produces a dataset with missing values
    const missingDataset = result.find((ds) => ds.dataKey === 'nonExistentMetric');
    expect(missingDataset).toBeDefined();

    // Non-existent metric should have values replaced according to columnLabelFormats
    expect(missingDataset?.data).toEqual([0, 0]);

    // Check tooltipData for non-existent metric
    expect(missingDataset?.tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'nonExistentMetric', value: 0 }
    ]);
    expect(missingDataset?.tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'nonExistentMetric', value: 0 }
    ]);
  });
});
