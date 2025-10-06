import { type ColumnLabelFormat, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { aggregateAndCreateDatasets } from './aggregateAndCreateDatasets';

describe('aggregateAndCreateDatasets', () => {
  it('should handle single x-axis and single y-axis', () => {
    const testData = [
      { month: 'Jan', revenue: 1000 },
      { month: 'Feb', revenue: 1500 },
      { month: 'Mar', revenue: 2000 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([1000, 1500, 2000]);

    expect(result.datasets[0].label).toEqual([{ key: 'revenue', value: '' }]);
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'revenue', value: 1000 }],
      [{ key: 'revenue', value: 1500 }],
      [{ key: 'revenue', value: 2000 }],
    ]);

    expect(result.ticks).toEqual([['Jan'], ['Feb'], ['Mar']]);
    expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);

    expect(result.datasets[0].dataKey).toBe('revenue');
    expect(result.datasets[0].axisType).toBe('y');
  });

  it('should correctly aggregate data based on x and y axes', () => {
    // Sample data with sales across different regions and categories
    const testData = [
      { region: 'North', category: 'A', sales: 100, profit: 20 },
      { region: 'North', category: 'B', sales: 150, profit: 30 },
      { region: 'South', category: 'A', sales: 200, profit: 40 },
      { region: 'South', category: 'B', sales: 250, profit: 50 },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD',
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region', 'category'],
        y: ['sales'],
      },
      columnLabelFormats
    );

    // Verify the structure and content of the result
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([100, 150, 200, 250]);
    expect(result.datasets[0].dataKey).toBe('sales');
    expect(result.datasets[0].label).toEqual([{ key: 'sales', value: '' }]);

    // Verify the tooltips contain the correct values
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 100 }],
      [{ key: 'sales', value: 150 }],
      [{ key: 'sales', value: 200 }],
      [{ key: 'sales', value: 250 }],
    ]);

    // Verify ticks
    expect(result.ticksKey).toEqual([
      { key: 'region', value: '' },
      { key: 'category', value: '' },
    ]);
    expect(result.ticks).toEqual([
      ['North', 'A'],
      ['North', 'B'],
      ['South', 'A'],
      ['South', 'B'],
    ]);
  });

  it('should correctly sum up values for a single x axis', () => {
    const testData = [
      { region: 'North', sales: 100 },
      { region: 'North', sales: 150 },
      { region: 'South', sales: 200 },
      { region: 'South', sales: 250 },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD',
      },
    };
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales'],
      },
      columnLabelFormats
    );

    // Verify we have one dataset for sales with two data points (North and South)
    expect(result.datasets).toHaveLength(1);

    // The dataset should have two data points
    expect(result.datasets[0].data).toHaveLength(2);

    // Check data values - first point should be North total (250), second point should be South total (450)
    expect(result.datasets[0].data[0]).toBe(250);
    expect(result.datasets[0].data[1]).toBe(450);

    // Check label
    expect(result.datasets[0].label).toEqual([{ key: 'sales', value: '' }]);

    // Check tooltip data
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 250 }],
      [{ key: 'sales', value: 450 }],
    ]);

    // Check ticks
    expect(result.ticks).toEqual([['North'], ['South']]);
    expect(result.ticksKey).toEqual([{ key: 'region', value: '' }]);
  });

  it('should create separate datasets for each point in scatter plot mode', () => {
    const testData = [
      { x: 1, y: 100, category: 'A' },
      { x: 2, y: 150, category: 'A' },
      { x: 3, y: 200, category: 'B' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    // Should have one dataset
    expect(result.datasets).toHaveLength(1);

    // Check data points
    expect(result.datasets[0].data).toEqual([100, 150, 200]);

    // Check label
    expect(result.datasets[0].label).toEqual([{ key: 'y', value: '' }]);

    // Check ticks
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should correctly aggregate data based on x and y axes', () => {
    // Sample data with sales across different regions and categories
    const testData = [
      { region: 'North', category: 'A', sales: 100, profit: 20 },
      { region: 'North', category: 'B', sales: 150, profit: 30 },
      { region: 'South', category: 'A', sales: 200, profit: 40 },
      { region: 'South', category: 'B', sales: 250, profit: 50 },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD',
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region', 'category'],
        y: ['sales'],
      },
      columnLabelFormats
    );

    // Verify the structure and content of the result
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([100, 150, 200, 250]);
    expect(result.datasets[0].dataKey).toBe('sales');
    expect(result.datasets[0].label).toEqual([{ key: 'sales', value: '' }]);

    // Verify the tooltips contain the correct values
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 100 }],
      [{ key: 'sales', value: 150 }],
      [{ key: 'sales', value: 200 }],
      [{ key: 'sales', value: 250 }],
    ]);

    // Verify ticks
    expect(result.ticksKey).toEqual([
      { key: 'region', value: '' },
      { key: 'category', value: '' },
    ]);
    expect(result.ticks).toEqual([
      ['North', 'A'],
      ['North', 'B'],
      ['South', 'A'],
      ['South', 'B'],
    ]);
  });

  it('should correctly sum up values for a single x axis', () => {
    const testData = [
      { region: 'North', sales: 100 },
      { region: 'North', sales: 150 },
      { region: 'South', sales: 200 },
      { region: 'South', sales: 250 },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        style: 'currency',
        currency: 'USD',
      },
    };
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales'],
      },
      columnLabelFormats
    );

    // Verify we have one dataset for sales with two data points (North and South)
    expect(result.datasets).toHaveLength(1);

    // The dataset should have two data points
    expect(result.datasets[0].data).toHaveLength(2);

    // Check data values - first point should be North total (250), second point should be South total (450)
    expect(result.datasets[0].data[0]).toBe(250);
    expect(result.datasets[0].data[1]).toBe(450);

    // Check label
    expect(result.datasets[0].label).toEqual([{ key: 'sales', value: '' }]);

    // Check tooltip data
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 250 }],
      [{ key: 'sales', value: 450 }],
    ]);

    // Check ticks
    expect(result.ticks).toEqual([['North'], ['South']]);
    expect(result.ticksKey).toEqual([{ key: 'region', value: '' }]);
  });

  it('should create separate datasets for each point in scatter plot mode', () => {
    const testData = [
      { x: 1, y: 100, category: 'A' },
      { x: 2, y: 150, category: 'A' },
      { x: 3, y: 200, category: 'B' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    // Should have one dataset
    expect(result.datasets).toHaveLength(1);

    // Check data points
    expect(result.datasets[0].data).toEqual([100, 150, 200]);

    // Check label
    expect(result.datasets[0].label).toEqual([{ key: 'y', value: '' }]);

    // Check ticks
    expect(result.ticks).toEqual([]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
  });

  it('should handle bubble chart with size data in scatter plot mode', () => {
    const testData = [
      { x: 1, y: 100, size: 20 },
      { x: 2, y: 150, size: 30 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);

    // Check first bubble
    expect(result.datasets[0].data).toEqual([100, 150]);
    expect(result.datasets[0].sizeData).toEqual([20, 30]);
    expect(result.datasets[0].sizeDataKey).toEqual('size');

    expect(result.datasets[0].label).toEqual([{ key: 'y', value: '' }]);

    // Check tooltips
    expect(result.datasets[0].tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'y', value: 100 },
        { key: 'size', value: 20 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'y', value: 150 },
        { key: 'size', value: 30 },
      ],
    ]);

    // Check ticks
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle multiple metrics in scatter plot mode', () => {
    const testData = [
      { x: 1, sales: 100, profit: 20 },
      { x: 2, sales: 150, profit: 30 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['sales', 'profit'],
      },
      {},
      true // scatter plot mode
    );

    // Should create two datasets per point (one for each metric)
    expect(result.datasets).toHaveLength(2);

    // Check sales metrics
    expect(result.datasets[0].data).toEqual([100, 150]);
    expect(result.datasets[0].dataKey).toBe('sales');
    expect(result.datasets[0].axisType).toBe('y');
    expect(result.datasets[0].tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'sales', value: 100 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'sales', value: 150 },
      ],
    ]);

    // Check profit metrics
    expect(result.datasets[1].data).toEqual([20, 30]);
    expect(result.datasets[1].dataKey).toBe('profit');
    expect(result.datasets[1].axisType).toBe('y');
    expect(result.datasets[1].label).toEqual([{ key: 'profit', value: '' }]);
    expect(result.datasets[1].tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'profit', value: 20 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'profit', value: 30 },
      ],
    ]);

    // Check ticks
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle two x-axes and single y-axis', () => {
    const testData = [
      { region: 'North', quarter: 'Q1', sales: 1000 },
      { region: 'North', quarter: 'Q2', sales: 1200 },
      { region: 'South', quarter: 'Q1', sales: 800 },
      { region: 'South', quarter: 'Q2', sales: 900 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region', 'quarter'],
        y: ['sales'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([1000, 1200, 800, 900]);
    expect(result.datasets[0].label).toEqual([{ key: 'sales', value: '' }]);
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 1000 }],
      [{ key: 'sales', value: 1200 }],
      [{ key: 'sales', value: 800 }],
      [{ key: 'sales', value: 900 }],
    ]);

    // Check ticks structure
    expect(result.ticks).toEqual([
      ['North', 'Q1'],
      ['North', 'Q2'],
      ['South', 'Q1'],
      ['South', 'Q2'],
    ]);
    expect(result.ticksKey).toEqual([
      { key: 'region', value: '' },
      { key: 'quarter', value: '' },
    ]);
  });

  it('should handle single x-axis and two y-axes', () => {
    const testData = [
      { month: 'Jan', revenue: 1000, profit: 200 },
      { month: 'Feb', revenue: 1500, profit: 300 },
      { month: 'Mar', revenue: 2000, profit: 400 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue', 'profit'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(2); // One dataset each for revenue and profit
    expect(result.datasets[0].dataKey).toBe('revenue');
    expect(result.datasets[1].dataKey).toBe('profit');

    expect(result.datasets[0].label).toEqual([{ key: 'revenue', value: '' }]);
    expect(result.datasets[1].label).toEqual([{ key: 'profit', value: '' }]);

    // Check revenue dataset
    expect(result.datasets[0].data).toEqual([1000, 1500, 2000]);
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'revenue', value: 1000 }],
      [{ key: 'revenue', value: 1500 }],
      [{ key: 'revenue', value: 2000 }],
    ]);

    // Check profit dataset
    expect(result.datasets[1].data).toEqual([200, 300, 400]);
    expect(result.datasets[1].tooltipData).toEqual([
      [{ key: 'profit', value: 200 }],
      [{ key: 'profit', value: 300 }],
      [{ key: 'profit', value: 400 }],
    ]);

    // Check ticks
    expect(result.ticks).toEqual([['Jan'], ['Feb'], ['Mar']]);
    expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);
  });

  it('should handle single x-axis, single y-axis with category', () => {
    const testData = [
      { month: 'Jan', sales: 1000, product: 'A' },
      { month: 'Jan', sales: 800, product: 'B' },
      { month: 'Feb', sales: 1200, product: 'A' },
      { month: 'Feb', sales: 1000, product: 'B' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['sales'],
        category: ['product'],
      },
      {}
    );

    // Check the overall structure
    expect(result.datasets).toHaveLength(2);
    expect(result.ticks).toEqual([['Jan'], ['Feb']]);
    expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);

    // Check first dataset (Product A)
    expect(result.datasets[0].data).toEqual([1000, 1200]);
    expect(result.datasets[0].label).toEqual([{ key: 'product', value: 'A' }]);

    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 1000, categoryValue: 'A', categoryKey: 'product' }],
      [{ key: 'sales', value: 1200, categoryValue: 'A', categoryKey: 'product' }],
    ]);
    expect(result.datasets[0].dataKey).toBe('sales');
    expect(result.datasets[0].axisType).toBe('y');

    // Check second dataset (Product B)
    expect(result.datasets[1].data).toEqual([800, 1000]);
    expect(result.datasets[1].label).toEqual([{ key: 'product', value: 'B' }]);
    expect(result.datasets[1].tooltipData).toEqual([
      [{ key: 'sales', value: 800, categoryValue: 'B', categoryKey: 'product' }],
      [{ key: 'sales', value: 1000, categoryValue: 'B', categoryKey: 'product' }],
    ]);
    expect(result.datasets[1].dataKey).toBe('sales');
    expect(result.datasets[1].axisType).toBe('y');
  });

  it('should handle single x-axis, two y-axes with category', () => {
    const testData = [
      { month: 'Jan', revenue: 1000, profit: 200, region: 'North' },
      { month: 'Jan', revenue: 800, profit: 150, region: 'South' },
      { month: 'Feb', revenue: 1200, profit: 250, region: 'North' },
      { month: 'Feb', revenue: 900, profit: 180, region: 'South' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['revenue', 'profit'],
        category: ['region'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(4); // 2 metrics * 2 regions

    expect(result.datasets[0].label).toEqual([
      { key: 'revenue', value: '' },
      { key: 'region', value: 'North' },
    ]);

    expect(result.datasets[0].data).toEqual([1000, 1200]);
    expect(result.datasets[1].data).toEqual([800, 900]);
    expect(result.datasets[2].data).toEqual([200, 250]);
    expect(result.datasets[3].data).toEqual([150, 180]);
  });

  it('should handle scatter plot with multiple x-axes', () => {
    const testData = [
      { xValue: 1, yValue: 100, date: '2023-01-01' },
      { xValue: 2, yValue: 150, date: '2023-01-02' },
      { xValue: 3, yValue: 200, date: '2023-01-03' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['xValue'],
        y: ['yValue'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toEqual([100, 150, 200]);
    expect(result.datasets[0].label).toEqual([{ key: 'yValue', value: '' }]);
    expect(result.datasets[0].tooltipData).toEqual([
      [
        { key: 'xValue', value: 1 },
        { key: 'yValue', value: 100 },
      ],
      [
        { key: 'xValue', value: 2 },
        { key: 'yValue', value: 150 },
      ],
      [
        { key: 'xValue', value: 3 },
        { key: 'yValue', value: 200 },
      ],
    ]);

    // Check ticks
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
    expect(result.ticksKey).toEqual([{ key: 'xValue', value: '' }]);
  });

  it('should handle scatter plot with categories', () => {
    const testData = [
      { x: 1, y: 100, group: 'A' },
      { x: 2, y: 150, group: 'A' },
      { x: 1, y: 80, group: 'B' },
      { x: 2, y: 120, group: 'B' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['group'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(2); // One dataset per category

    // Check first category (A)
    const datasetA = result.datasets[0];
    expect(datasetA.data).toEqual([100, 150]);
    expect(datasetA.label).toEqual([{ key: 'group', value: 'A' }]);
    expect(datasetA.tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'y', value: 100 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'y', value: 150 },
      ],
    ]);

    // Check second category (B)
    const datasetB = result.datasets[1];
    expect(datasetB.data).toEqual([80, 120]);
    expect(datasetB.label).toEqual([{ key: 'group', value: 'B' }]);
    expect(datasetB.tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'y', value: 80 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'y', value: 120 },
      ],
    ]);

    // Check ticks
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle scatter plot with custom tooltip fields', () => {
    const testData = [
      { x: 1, y: 100, name: 'Point 1', description: 'First point' },
      { x: 2, y: 150, name: 'Point 2', description: 'Second point' },
    ];

    const resultWithoutTooltips = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['name', 'description'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];
    expect(dataset.tooltipData).toBeDefined();
    expect(dataset.tooltipData.length).toBe(2);

    // Check ticks
    expect(result.ticks).toEqual([]);
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle scatter plot with custom tooltip fields', () => {
    const testData = [
      { x: 1, y: 100, name: 'Point 1', description: 'First point' },
      { x: 2, y: 150, name: 'Point 2', description: 'Second point' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['name', 'description'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];
    expect(dataset.tooltipData).toBeDefined();
    expect(dataset.tooltipData.length).toBe(2);
    expect(dataset.tooltipData[0]).toEqual([
      { key: 'name', value: 'Point 1' },
      { key: 'description', value: 'First point' },
    ]);
    expect(dataset.tooltipData[1]).toEqual([
      { key: 'name', value: 'Point 2' },
      { key: 'description', value: 'Second point' },
    ]);
  });

  it('should handle scatter plot with custom tooltip fields', () => {
    const testData = [
      { x: 1, y: 100, name: 'Point 1', description: 'First point' },
      { x: 2, y: 150, name: 'Point 2', description: 'Second point' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['name', 'description'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];
    expect(dataset.tooltipData).toBeDefined();
    expect(dataset.tooltipData.length).toBe(2);
    expect(dataset.tooltipData[0]).toEqual([
      { key: 'name', value: 'Point 1' },
      { key: 'description', value: 'First point' },
    ]);
    expect(dataset.tooltipData[1]).toEqual([
      { key: 'name', value: 'Point 2' },
      { key: 'description', value: 'Second point' },
    ]);
  });

  it('should handle scatter plot with missing data and replaceMissingDataWith option', () => {
    const testData = [
      { x: 1, y: 100, size: 20 },
      { x: 2, y: null, size: 30 },
      { x: 3, y: undefined, size: null },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0,
      },
      size: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0,
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size'],
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];

    expect(dataset.data).toEqual([100, 0, 0]); // Missing y values replaced with 0
    expect(dataset.sizeData).toEqual([20, 30, 0]); // Missing size value replaced with 0
    expect(dataset.sizeDataKey).toEqual('size');
    expect(dataset.tooltipData).toEqual([
      [
        { key: 'x', value: 1 },
        { key: 'y', value: 100 },
        { key: 'size', value: 20 },
      ],
      [
        { key: 'x', value: 2 },
        { key: 'y', value: 0 },
        { key: 'size', value: 30 },
      ],
      [
        { key: 'x', value: 3 },
        { key: 'y', value: 0 },
        { key: 'size', value: 0 },
      ],
    ]);

    // Check ticks
    expect(result.ticks).toEqual([]);
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle replaceMissingDataWith with different values for different metrics', () => {
    const testData = [
      { id: 1, metric1: 100, metric2: 50 },
      { id: 2, metric1: null, metric2: 60 },
      { id: 3, metric1: 120, metric2: null },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      metric1: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0,
      },
      metric2: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0,
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['metric1', 'metric2'],
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(2);
    const [metric1Dataset, metric2Dataset] = result.datasets;

    // Check metric1 dataset
    expect(metric1Dataset.data).toEqual([100, 0, 120]); // metric1 with missing value replaced by 0
    expect(metric1Dataset.tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'metric1', value: 0 },
    ]);

    // Check metric2 dataset
    expect(metric2Dataset.data).toEqual([50, 60, 0]); // metric2 with missing value replaced by 0
    expect(metric2Dataset.tooltipData[2]).toEqual([
      { key: 'id', value: 3 },
      { key: 'metric2', value: 0 },
    ]);

    // Check ticks
    expect(result.ticks).toEqual([]);
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
    expect(result.ticksKey).toEqual([{ key: 'id', value: '' }]);
  });

  it('should handle replaceMissingDataWith set to null', () => {
    const testData = [
      { x: 1, y: 100 },
      { x: 2, y: null },
      { x: 3, y: 200 },
    ];

    const columnLabelFormats: Record<string, ColumnLabelFormat> = {
      y: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: null,
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];

    expect(dataset.data).toEqual([100, null, 200]); // null values preserved
    expect(dataset.tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'y', value: '' }, // null values should be converted to empty string in tooltip
    ]);

    // Check ticks
    expect(result.ticks).toEqual([]);
    expect(result.datasets[0].ticksForScatter).toEqual([[1], [2], [3]]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should correctly aggregate data with multiple y-axes and nested categories', () => {
    const testData = [
      { region: 'North', product: 'A', channel: 'Online', sales: 100, cost: 50 },
      { region: 'North', product: 'A', channel: 'Store', sales: 150, cost: 70 },
      { region: 'North', product: 'B', channel: 'Online', sales: 200, cost: 100 },
      { region: 'South', product: 'A', channel: 'Online', sales: 120, cost: 60 },
      { region: 'South', product: 'B', channel: 'Store', sales: 180, cost: 90 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales', 'cost'],
        category: ['product', 'channel'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(8); // 2 metrics * 2 products * 2 channels

    // Check one specific dataset to validate aggregation
    const northAOnlineSales = result.datasets.find(
      (ds) => ds.dataKey === 'sales' && ds.label.some((l) => l.key === 'product' && l.value === 'A')
    );

    expect(northAOnlineSales).toBeDefined();

    // Check ticks
    expect(result.ticks).toEqual([['North'], ['South']]);
    expect(result.ticksKey).toEqual([{ key: 'region', value: '' }]);
  });

  it('should handle empty data array', () => {
    const testData: any[] = [];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);
    expect(result.ticks).toEqual([]);
    expect(result.ticksKey).toEqual([{ key: 'x', value: '' }]);
  });

  it('should handle tooltip customization with custom fields', () => {
    const testData = [
      { date: '2023-01-01', sales: 1000, notes: 'Holiday sale', manager: 'John' },
      { date: '2023-01-02', sales: 1200, notes: 'Weekend', manager: 'Jane' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales'],
        tooltip: ['notes', 'manager', 'sales'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];

    // Check if tooltip contains the custom fields in correct order
    expect(dataset.tooltipData[0]).toEqual([
      { key: 'notes', value: 'Holiday sale' },
      { key: 'manager', value: 'John' },
      { key: 'sales', value: 1000 },
    ]);

    // Check ticks
    expect(result.ticks).toEqual([['2023-01-01'], ['2023-01-02']]);
    expect(result.ticksKey).toEqual([{ key: 'date', value: '' }]);
  });

  it('should handle tooltip with null values in data', () => {
    const testData = [
      { date: '2023-01-01', sales: 1000, notes: null, manager: 'John' },
      { date: '2023-01-02', sales: 1200, notes: 'Weekend', manager: null },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales'],
        tooltip: ['notes', 'manager', 'sales'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);
    const dataset = result.datasets[0];

    // Null values should be represented as empty strings in tooltip
    expect(dataset.tooltipData[0]).toEqual([
      { key: 'notes', value: '' },
      { key: 'manager', value: 'John' },
      { key: 'sales', value: 1000 },
    ]);

    expect(dataset.tooltipData[1]).toEqual([
      { key: 'notes', value: 'Weekend' },
      { key: 'manager', value: '' },
      { key: 'sales', value: 1200 },
    ]);

    // Check ticks
    expect(result.ticks).toEqual([['2023-01-01'], ['2023-01-02']]);
    expect(result.ticksKey).toEqual([{ key: 'date', value: '' }]);
  });

  it('should handle tooltip with mixed data types', () => {
    const testData = [
      { date: '2023-01-01', metric: 1000, boolean: true, object: { test: 'value' } },
      { date: '2023-01-02', metric: 1200, boolean: false, object: { test: 'other' } },
    ] as any;

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['metric'],
        tooltip: ['metric', 'boolean', 'object'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);

    // Boolean values should be converted properly, objects should be stringified or handled
    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'metric', value: 1000 },
      { key: 'boolean', value: true },
      { key: 'object', value: '[object Object]' },
    ]);

    expect(result.datasets[0].tooltipData[1]).toEqual([
      { key: 'metric', value: 1200 },
      { key: 'boolean', value: false },
      { key: 'object', value: '[object Object]' },
    ]);
  });

  it('should handle tooltip with custom order in both scatter and non-scatter mode', () => {
    const testData = [
      { x: 1, y: 100, category: 'A', description: 'First point' },
      { x: 2, y: 200, category: 'B', description: 'Second point' },
    ];

    // Test regular mode
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['description', 'category', 'y'],
      },
      {}
    );

    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'description', value: 'First point' },
      { key: 'category', value: 'A' },
      { key: 'y', value: 100 },
    ]);

    // Test scatter mode
    const scatterResult = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['description', 'category', 'y'],
      },
      {},
      true // scatter plot mode
    );

    expect(scatterResult.datasets[0].tooltipData[0]).toEqual([
      { key: 'description', value: 'First point' },
      { key: 'category', value: 'A' },
      { key: 'y', value: 100 },
    ]);
  });

  it('should handle date objects in data and tooltip', () => {
    const testData = [
      { x: 1, y: 100, date: new Date('2023-01-01').toISOString() },
      { x: 2, y: 200, date: new Date('2023-01-02').toISOString() },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        tooltip: ['date', 'y'],
      },
      {},
      true // scatter plot mode
    );

    // Date objects should be converted to strings in tooltip data
    expect(result.datasets[0].tooltipData[0][0].key).toBe('date');

    // We're just checking the type conversion occurred, not the exact format
    expect(typeof result.datasets[0].tooltipData[0][0].value).toBe('string');
  });

  it('should handle y2 axis data correctly', () => {
    const testData = [
      { month: 'Jan', primary: 100, secondary: 10 },
      { month: 'Feb', primary: 200, secondary: 20 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['primary'],
        y2: ['secondary'],
      },
      {}
    );

    // Check we have datasets for both y and y2 axes
    expect(result.datasets).toHaveLength(2); // One for primary (y) and one for secondary (y2)

    // Find y and y2 datasets
    const primaryDataset = result.datasets.find((d) => d.dataKey === 'primary');
    const secondaryDataset = result.datasets.find((d) => d.dataKey === 'secondary');

    // Check y axis dataset
    expect(primaryDataset).toBeDefined();
    expect(primaryDataset?.axisType).toBe('y');
    expect(primaryDataset?.data).toEqual([100, 200]);

    // Check y2 axis dataset
    expect(secondaryDataset).toBeDefined();
    expect(secondaryDataset?.axisType).toBe('y2');
    expect(secondaryDataset?.data).toEqual([10, 20]);
  });

  it('should handle mixed data types in scatter plot categories correctly', () => {
    const testData = [
      { x: 1, y: 100, group: true },
      { x: 2, y: 150, group: true },
      { x: 1, y: 80, group: false },
      { x: 2, y: 120, group: false },
    ] as any;

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['group'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(2); // One dataset per boolean category value

    // Check that boolean categories are correctly handled
    expect(result.datasets[0].data).toEqual([100, 150]); // group: true
    expect(result.datasets[1].data).toEqual([80, 120]); // group: false

    // Check that labels are correctly created
    expect(result.datasets[0].label).toEqual([{ key: 'group', value: 'true' }]);
    expect(result.datasets[1].label).toEqual([{ key: 'group', value: 'false' }]);
  });

  it('should populate tooltipData with all fields and values when tooltip option is not specified', () => {
    const testData = [
      { id: 1, sales: 100, profit: 20, units: 5 },
      { id: 2, sales: 200, profit: 40, units: 10 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales', 'profit'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(2); // One for sales, one for profit

    // Check sales dataset tooltips - should contain x and y values by default
    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'sales', value: 100 },
    ]);
    expect(result.datasets[0].tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'sales', value: 200 },
    ]);

    // Check profit dataset tooltips
    expect(result.datasets[1].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'profit', value: 20 },
    ]);
    expect(result.datasets[1].tooltipData[1]).toEqual([
      { key: 'id', value: 2 },
      { key: 'profit', value: 40 },
    ]);
  });

  it('should include size data in tooltipData when size axis is specified', () => {
    const testData = [
      { x: 1, y: 100, size: 5, category: 'A' },
      { x: 2, y: 200, size: 10, category: 'B' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        size: ['size'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);

    // Check tooltipData includes size information
    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'x', value: 1 },
      { key: 'y', value: 100 },
      { key: 'size', value: 5 },
    ]);
    expect(result.datasets[0].tooltipData[1]).toEqual([
      { key: 'x', value: 2 },
      { key: 'y', value: 200 },
      { key: 'size', value: 10 },
    ]);

    // Check size data is properly included in the dataset
    expect(result.datasets[0].sizeData).toEqual([5, 10]);
    expect(result.datasets[0].sizeDataKey).toBe('size');
  });

  it('should honor the order of tooltip fields as specified in the tooltip option', () => {
    const testData = [
      { id: 1, name: 'Product A', sales: 100, profit: 20, timestamp: '2023-01-01' },
      { id: 2, name: 'Product B', sales: 200, profit: 40, timestamp: '2023-01-02' },
    ];

    // Specify custom tooltip field order
    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales'],
        tooltip: ['timestamp', 'name', 'profit', 'sales'], // Intentionally different order
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);

    // Check that tooltipData respects the specified field order
    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'timestamp', value: '2023-01-01' },
      { key: 'name', value: 'Product A' },
      { key: 'profit', value: 20 },
      { key: 'sales', value: 100 },
    ]);
    expect(result.datasets[0].tooltipData[1]).toEqual([
      { key: 'timestamp', value: '2023-01-02' },
      { key: 'name', value: 'Product B' },
      { key: 'profit', value: 40 },
      { key: 'sales', value: 200 },
    ]);

    // Without tooltip option, x and y should be included by default in that order
    const defaultResult = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['sales'],
      },
      {},
      true
    );

    expect(defaultResult.datasets[0].tooltipData[0]).toEqual([
      { key: 'id', value: 1 },
      { key: 'sales', value: 100 },
    ]);
  });

  it('should handle tooltipData in non-scatter mode with aggregated values', () => {
    const testData = [
      { region: 'North', product: 'A', sales: 100 },
      { region: 'North', product: 'A', sales: 150 },
      { region: 'South', product: 'B', sales: 200 },
      { region: 'South', product: 'B', sales: 250 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1); // One dataset for sales

    // In non-scatter mode without tooltip specified, tooltipData should contain the metric values
    expect(result.datasets[0].tooltipData).toEqual([
      [{ key: 'sales', value: 250 }],
      [{ key: 'sales', value: 450 }],
    ]);

    // Check ticks are correct
    expect(result.ticks).toEqual([['North'], ['South']]);
    expect(result.ticksKey).toEqual([{ key: 'region', value: '' }]);
  });

  it('should include custom tooltip fields in non-scatter mode with categories', () => {
    const testData = [
      { month: 'Jan', product: 'A', sales: 100, notes: 'New launch' },
      { month: 'Feb', product: 'A', sales: 120, notes: 'Price increase' },
      { month: 'Jan', product: 'B', sales: 80, notes: 'Limited stock' },
      { month: 'Feb', product: 'B', sales: 90, notes: 'Back in stock' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['sales'],
        category: ['product'],
        tooltip: ['month', 'product', 'sales', 'notes'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(2); // One dataset per product category

    // Check dataset for product A
    const datasetA = result.datasets[0];
    expect(datasetA.dataKey).toBe('sales');
    expect(datasetA.data).toEqual([100, 120]); // Values for Jan and Feb

    // Check tooltipData structure for first dataset (product A)
    // First tooltipData entry should be for Jan
    expect(datasetA.tooltipData).toEqual([
      [
        { key: 'month', value: 'Jan' },
        { key: 'product', value: 'A', categoryValue: 'A', categoryKey: 'product' },
        { key: 'sales', value: 100 },
        { key: 'notes', value: 'New launch' },
      ],
      [
        { key: 'month', value: 'Feb' },
        { key: 'product', value: 'A', categoryValue: 'A', categoryKey: 'product' },
        { key: 'sales', value: 120 },
        { key: 'notes', value: 'Price increase' },
      ],
    ]);

    // Check ticks structure
    expect(result.ticks).toEqual([['Jan'], ['Feb']]);
    expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);
  });

  it('should handle zero values differently from null/missing values', () => {
    const testData = [
      { id: 1, value: 0 },
      { id: 2, value: null },
      { id: 3, value: 50 },
    ];

    const columnLabelFormats = {
      value: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: -1 as any, // Using any to avoid type issues
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['value'],
      },
      columnLabelFormats,
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);

    // Zero should be preserved as 0, not treated as missing
    expect(result.datasets[0].data[0]).toBe(0);

    // Null should be replaced with the specified replacement value
    expect(result.datasets[0].data[1]).toBe(-1);

    // Regular value should be unchanged
    expect(result.datasets[0].data[2]).toBe(50);

    // Check tooltip data reflects this behavior
    expect(result.datasets[0].tooltipData[0][1].value).toBe(0);
  });

  it('should prioritize tooltip fields in the specified order even when fields are missing', () => {
    const testData = [
      { id: 1, primary: 100, secondary: 20, note: 'first' },
      { id: 2, primary: 150, secondary: null, extra: 'metadata' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['id'],
        y: ['primary'],
        tooltip: ['note', 'secondary', 'extra', 'primary'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.datasets).toHaveLength(1);

    // First data point should have properly ordered tooltip with all specified fields
    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'note', value: 'first' },
      { key: 'secondary', value: 20 },
      { key: 'extra', value: '' }, // Missing in the first object
      { key: 'primary', value: 100 },
    ]);

    // Second data point should have properly ordered tooltip with missing fields as empty string
    expect(result.datasets[0].tooltipData[1]).toEqual([
      { key: 'note', value: '' }, // Missing in the second object
      { key: 'secondary', value: '' }, // Null value in the second object
      { key: 'extra', value: 'metadata' },
      { key: 'primary', value: 150 },
    ]);
  });

  it('should handle large datasets (5000 points) efficiently in scatter plot mode', () => {
    // Generate 5000 data points
    const testData = Array.from({ length: 5000 }, (_, i) => ({
      x: i % 100, // Creates cycle of x values
      y: Math.sin(i * 0.01) * 100 + 100, // Sine wave pattern
      category: i % 5, // 5 different categories
    }));

    const start = performance.now();

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['category'],
      },
      {},
      true // scatter plot mode
    );

    const end = performance.now();

    // Should create 5 datasets (one per category)
    expect(result.datasets).toHaveLength(5);

    // Each dataset should have 1000 points
    expect(result.datasets[0].data.length).toBe(1000);

    // Check a few data points to ensure correctness
    expect(result.datasets[0].data[0]).toBeCloseTo(100, 0); // First point in category 0
    expect(result.datasets[1].data[0]).toBeCloseTo(testData[1].y, 0); // First point in category 1

    expect(result.datasets[0].tooltipData.length).toBe(1000);

    expect(result.datasets[0].dataKey).toBe('y');
    expect(result.datasets[0].axisType).toBe('y');

    expect(result.datasets[0].tooltipData[0]).toEqual([
      { key: 'x', value: 0 },
      { key: 'y', value: 100 },
    ]);
  });

  it('should efficiently aggregate large datasets (5000 points) with multiple metrics', () => {
    // Generate 5000 data points with multiple metrics
    const testData = Array.from({ length: 5000 }, (_, i) => ({
      date: `2023-${Math.floor(i / 500) + 1}-${(i % 500) + 1}`, // Spread across months
      sales: Math.random() * 1000,
      profit: Math.random() * 200,
      units: Math.floor(Math.random() * 50),
    }));

    const start = performance.now();

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['date'],
        y: ['sales', 'profit', 'units'],
      },
      {}
    );

    const end = performance.now();

    // Check that we have datasets for each metric
    expect(result.datasets.length).toBeGreaterThan(0);

    // Verify that data is aggregated correctly for each dataset
    result.datasets.forEach((dataset) => {
      // Each dataset should have data points
      expect(dataset.data.length).toBeGreaterThan(0);

      // Each dataset should have matching tooltip data
      expect(dataset.tooltipData.length).toBe(dataset.data.length);

      // Verify dataset has correct structure
      expect(dataset).toHaveProperty('dataKey');
      expect(dataset).toHaveProperty('axisType', 'y');
      expect(dataset).toHaveProperty('tooltipData');
      expect(dataset).toHaveProperty('data');
    });

    // Verify we have the expected metrics
    const dataKeys = result.datasets.map((d) => d.dataKey);
    expect(dataKeys).toContain('sales');
    expect(dataKeys).toContain('profit');
    expect(dataKeys).toContain('units');
  });

  it('should handle nested categories with multiple metrics and missing data', () => {
    const testData = [
      { region: 'North', product: 'A', channel: 'Online', sales: 100, cost: null },
      { region: 'North', product: 'A', channel: 'Store', sales: null, cost: 30 },
      { region: 'South', product: 'B', channel: 'Online', sales: 200, cost: 40 },
      { region: 'South', product: 'B', channel: 'Store', sales: 250, cost: null },
    ];

    const columnLabelFormats = {
      sales: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 'No Data' as any,
      },
      cost: {
        ...DEFAULT_COLUMN_LABEL_FORMAT,
        replaceMissingDataWith: 0 as any,
      },
    };

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['region'],
        y: ['sales', 'cost'],
        category: ['product', 'channel'],
        tooltip: ['region', 'product', 'channel', 'sales', 'cost'],
      },
      columnLabelFormats
    );

    // Should create datasets for each combination of:
    // - metrics (sales, cost)
    // - product (A, B)
    // - channel (Online, Store)
    expect(result.datasets).toHaveLength(8); // 2 metrics × 2 products × 2 channels

    // Check that missing values are handled correctly in tooltip
    const salesDataset = result.datasets.find((d) => d.dataKey === 'sales');
    const costDataset = result.datasets.find((d) => d.dataKey === 'cost');

    expect(salesDataset).toBeDefined();
    expect(costDataset).toBeDefined();

    // Verify tooltip contain all specified fields in correct order
    expect(salesDataset?.tooltipData[0].map((t) => t.key)).toEqual([
      'region',
      'product',
      'channel',
      'sales',
      'cost',
    ]);
  });

  it('should handle special characters and unicode in category values', () => {
    const testData = [
      { category: '🚀', value: 100 },
      { category: '&%$#@', value: 200 },
      { category: 'normal', value: 300 },
      { category: '中文', value: 400 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['category'],
        y: ['value'],
      },
      {}
    );

    expect(result.datasets).toHaveLength(1);

    // Check that special characters are preserved in ticks
    expect(result.ticks).toEqual([['🚀'], ['&%$#@'], ['normal'], ['中文']]);
    expect(result.ticksKey).toEqual([{ key: 'category', value: '' }]);

    // Check that data values are correctly associated
    expect(result.datasets[0].data).toEqual([100, 200, 300, 400]);
  });

  describe('dual axis tooltip handling', () => {
    const testData = [
      {
        date: '2024-01-01',
        metric1: 100,
        metric2: 200,
        metric3: 300,
        category: 'A',
        additionalInfo: 'info1',
      },
      {
        date: '2024-01-02',
        metric1: 150,
        metric2: 250,
        metric3: 350,
        category: 'B',
        additionalInfo: 'info2',
      },
    ];

    it('should not duplicate tooltip data in dual axis charts', () => {
      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['date'],
          y: ['metric1', 'metric2'],
          y2: ['metric3'],
          tooltip: ['metric1', 'metric2', 'metric3', 'additionalInfo'],
        },
        {}
      );

      // Check y-axis datasets
      const yAxisDatasets = result.datasets.filter((d) => d.axisType === 'y');
      yAxisDatasets.forEach((dataset) => {
        dataset.tooltipData.forEach((tooltipGroup) => {
          // Y-axis tooltips should not contain y2 metrics
          const hasY2Metrics = tooltipGroup.some((tip) => tip.key === 'metric3');
          expect(hasY2Metrics).toBe(false);

          // Should contain y metrics and additional info
          const hasAdditionalInfo = tooltipGroup.some((tip) => tip.key === 'additionalInfo');
          expect(hasAdditionalInfo).toBe(true);
        });
      });

      // Check y2-axis datasets
      const y2AxisDatasets = result.datasets.filter((d) => d.axisType === 'y2');
      y2AxisDatasets.forEach((dataset) => {
        dataset.tooltipData.forEach((tooltipGroup) => {
          // Y2-axis tooltips should not contain y metrics
          const hasYMetrics = tooltipGroup.some(
            (tip) => tip.key === 'metric1' || tip.key === 'metric2'
          );
          expect(hasYMetrics).toBe(false);

          // Should contain y2 metrics and additional info
          const hasY2Metrics = tooltipGroup.some((tip) => tip.key === 'metric3');
          expect(hasY2Metrics).toBe(true);
          const hasAdditionalInfo = tooltipGroup.some((tip) => tip.key === 'additionalInfo');
          expect(hasAdditionalInfo).toBe(false);
        });
      });
    });

    it('should handle tooltip data correctly with categories in dual axis charts', () => {
      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['date'],
          y: ['metric1'],
          y2: ['metric2'],
          category: ['category'],
          tooltip: ['metric1', 'metric2', 'category', 'additionalInfo'],
        },
        {}
      );

      // Verify each dataset has correct tooltip data based on its axis type
      result.datasets.forEach((dataset) => {
        dataset.tooltipData.forEach((tooltipGroup) => {
          // Category and additional info should always be present
          const hasCategoryInfo = tooltipGroup.some((tip) => tip.key === 'category');
          const hasAdditionalInfo = tooltipGroup.some((tip) => tip.key === 'additionalInfo');
          if (dataset.axisType === 'y2') {
            expect(hasCategoryInfo).toBe(false);
          } else {
            expect(hasCategoryInfo).toBe(true);
            expect(hasAdditionalInfo).toBe(true);
          }

          if (dataset.axisType === 'y') {
            // Y-axis tooltips should have metric1 but not metric2
            const hasMetric1 = tooltipGroup.some((tip) => tip.key === 'metric1');
            const hasMetric2 = tooltipGroup.some((tip) => tip.key === 'metric2');
            expect(hasMetric1).toBe(true);
            expect(hasMetric2).toBe(false);
          } else {
            // Y2-axis tooltips should have metric2 but not metric1
            const hasMetric1 = tooltipGroup.some((tip) => tip.key === 'metric1');
            const hasMetric2 = tooltipGroup.some((tip) => tip.key === 'metric2');
            expect(hasMetric1).toBe(false);
            expect(hasMetric2).toBe(true);
          }
        });
      });
    });
  });

  it('should only include y2 metric in its tooltip when using dual axis', () => {
    const testData = [
      { month: 'Jan', temperature: 20, humidity: 80, rainfall: 50 },
      { month: 'Feb', temperature: 22, humidity: 75, rainfall: 45 },
      { month: 'Mar', temperature: 25, humidity: 70, rainfall: 40 },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['temperature', 'humidity'],
        y2: ['rainfall'],
        tooltip: ['temperature', 'humidity', 'rainfall'],
      },
      {}
    );

    // Find the y2 dataset (rainfall)
    const y2Dataset = result.datasets.find((d) => d.axisType === 'y2');
    expect(y2Dataset).toBeDefined();
    expect(y2Dataset?.dataKey).toBe('rainfall');

    // Verify y2 tooltips only contain rainfall data
    expect(y2Dataset?.tooltipData).toEqual([
      [{ key: 'rainfall', value: 50 }],
      [{ key: 'rainfall', value: 45 }],
      [{ key: 'rainfall', value: 40 }],
    ]);

    // Verify y axis tooltips exclude y2 metrics
    const yDataset = result.datasets.find((d) => d.dataKey === 'temperature');
    expect(yDataset?.tooltipData?.[0]).toEqual([
      { key: 'temperature', value: 20 },
      { key: 'humidity', value: 80 },
    ]);
  });

  it('should maintain exact data-tick alignment for scatter plots with large datasets', () => {
    // Generate 50 data points with some null values mixed in
    const testData = Array.from({ length: 60 }, (_, i) => ({
      x: i, // Reduced null frequency to every 10th point
      y: i * 2,
    }));

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.ticks).toEqual([]); // Ticks should be empty for scatter plots
    expect(result.datasets[0].data.length).toBe(60);
    expect(result.datasets[0].tooltipData.length).toBe(60);
    expect(result.datasets[0].ticksForScatter?.length).toBe(60); // Check ticksForScatter
    // Verify first and last tick values
    expect(result.datasets[0].ticksForScatter?.[0]).toEqual([0]);
    expect(result.datasets[0].ticksForScatter?.[59]).toEqual([59]);
  });

  it('should maintain exact data-tick alignment for scatter plots with large datasets - with nulls', () => {
    // Generate 50 data points with some null values mixed in
    const testData = Array.from({ length: 60 }, (_, i) => ({
      x: i === 5 ? null : i, // Reduced null frequency to every 10th point
      y: i * 2,
    }));

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.ticks).toEqual([]); // Ticks should be empty for scatter plots
    expect(result.datasets[0].data.length).toBe(59);
    expect(result.datasets[0].tooltipData.length).toBe(59);
    expect(result.datasets[0].ticksForScatter?.length).toBe(59); // Check ticksForScatter
    // Verify the gap where null was
    expect(result.datasets[0].ticksForScatter?.map((t) => t[0])).not.toContain(5);
  });

  it('should maintain exact data-tick alignment for scatter plots with large datasets - with nulls in y', () => {
    const testData = Array.from({ length: 60 }, (_, i) => ({
      x: i,
      y: i === 5 ? null : i * 2,
    }));

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.ticks).toEqual([]); // Ticks should be empty for scatter plots
    expect(result.datasets[0].data.length).toBe(60);
    expect(result.datasets[0].tooltipData.length).toBe(60);
    expect(result.datasets[0].ticksForScatter?.length).toBe(60); // Check ticksForScatter
    // Verify that x values are preserved even when y is null
    expect(result.datasets[0].ticksForScatter?.[5]).toEqual([5]);
  });

  it('should maintain exact data-tick alignment for scatter plots with large datasets - with category', () => {
    const testData = Array.from({ length: 60 }, (_, i) => ({
      x: i,
      y: i,
      category: i % 2 === 0 ? 'A' : 'B',
    }));

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['category'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.ticks).toEqual([]); // Ticks should be empty for scatter plots
    // We should have two datasets, one for each category
    expect(result.datasets.length).toBe(2);
    // Each dataset should have half the points
    const expectedPointsPerDataset = Math.floor(60 / 2);
    expect(result.datasets[0].data.length).toBe(expectedPointsPerDataset);
    expect(result.datasets[0].tooltipData.length).toBe(expectedPointsPerDataset);
    expect(result.datasets[0].ticksForScatter?.length).toBe(expectedPointsPerDataset);
    // Verify category A has even numbers and B has odd numbers
    expect(result.datasets[0].ticksForScatter?.every((t) => Number(t[0]) % 2 === 0)).toBe(true);
    expect(result.datasets[1].ticksForScatter?.every((t) => Number(t[0]) % 2 === 1)).toBe(true);
  });

  it('should maintain exact data-tick alignment for scatter plots with large datasets - with category and size', () => {
    const testData = Array.from({ length: 60 }, (_, i) => ({
      x: i,
      y: i,
      category: i % 2 === 0 ? 'A' : 'B',
      size: i / 10,
    }));

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['category'],
        size: ['size'],
      },
      {},
      true // scatter plot mode
    );

    expect(result.ticks).toEqual([]); // Ticks should be empty for scatter plots
    // We should have two datasets, one for each category
    expect(result.datasets.length).toBe(2);
    // Each dataset should have half the points
    const expectedPointsPerDataset = Math.floor(60 / 2);
    expect(result.datasets[0].data.length).toBe(expectedPointsPerDataset);
    expect(result.datasets[0].tooltipData.length).toBe(expectedPointsPerDataset);
    expect(result.datasets[0].ticksForScatter?.length).toBe(expectedPointsPerDataset);
    expect(result.datasets[0].sizeData?.length).toBe(expectedPointsPerDataset);
    // Verify category A has even numbers and B has odd numbers
    expect(result.datasets[0].ticksForScatter?.every((t) => Number(t[0]) % 2 === 0)).toBe(true);
    expect(result.datasets[1].ticksForScatter?.every((t) => Number(t[0]) % 2 === 1)).toBe(true);
    // Verify size data is correctly mapped
    expect(result.datasets[0].sizeData?.[0]).toBe(0);
    expect(result.datasets[1].sizeData?.[0]).toBe(0.1);
  });

  it('should include categoryKey in tooltip data for scatter plots with categories', () => {
    const testData = [
      { x: 1, y: 100, region: 'North', product: 'A' },
      { x: 2, y: 150, region: 'North', product: 'B' },
      { x: 3, y: 200, region: 'South', product: 'A' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['x'],
        y: ['y'],
        category: ['region', 'product'],
        tooltip: ['x', 'y', 'region', 'product'],
      },
      {},
      true // scatter plot mode
    );

    // We should have 4 datasets (2 regions × 2 products)
    expect(result.datasets.length).toBeGreaterThan(0);

    // Find the North/A dataset
    const northADataset = result.datasets.find(
      (d) =>
        d.label.some((l) => l.key === 'region' && l.value === 'North') &&
        d.label.some((l) => l.key === 'product' && l.value === 'A')
    );

    expect(northADataset).toBeDefined();

    // Verify tooltip data includes both categoryKey and categoryValue for category fields
    expect(northADataset?.tooltipData[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'region',
          value: 'North',
          categoryKey: 'region',
          categoryValue: 'North',
        }),
        expect.objectContaining({
          key: 'product',
          value: 'A',
          categoryKey: 'product',
          categoryValue: 'A',
        }),
      ])
    );
  });

  it('should include categoryKey in default tooltips with no custom tooltip fields', () => {
    const testData = [
      { month: 'Jan', sales: 1000, region: 'North' },
      { month: 'Feb', sales: 1200, region: 'North' },
      { month: 'Jan', sales: 800, region: 'South' },
      { month: 'Feb', sales: 900, region: 'South' },
    ];

    const result = aggregateAndCreateDatasets(
      testData,
      {
        x: ['month'],
        y: ['sales'],
        category: ['region'],
      },
      {}
    );

    // We should have 2 datasets (one per region)
    expect(result.datasets).toHaveLength(2);

    // Find North dataset
    const northDataset = result.datasets.find((d) =>
      d.label.some((l) => l.key === 'region' && l.value === 'North')
    );

    expect(northDataset).toBeDefined();

    // Verify tooltips include both the original metric key and the category information
    expect(northDataset?.tooltipData[0]).toEqual([
      expect.objectContaining({
        key: 'sales',
        value: 1000,
        categoryKey: 'region',
        categoryValue: 'North',
      }),
    ]);

    // Find South dataset
    const southDataset = result.datasets.find((d) =>
      d.label.some((l) => l.key === 'region' && l.value === 'South')
    );

    // Verify tooltips for South dataset
    expect(southDataset?.tooltipData[0]).toEqual([
      expect.objectContaining({
        key: 'sales',
        value: 800,
        categoryKey: 'region',
        categoryValue: 'South',
      }),
    ]);
  });

  describe('createDatasetsByColorThenAggregate', () => {
    it('should create separate datasets for each color value', () => {
      const testData = [
        { month: 'Jan', sales: 100, productType: 'Electronics' },
        { month: 'Jan', sales: 80, productType: 'Clothing' },
        { month: 'Feb', sales: 120, productType: 'Electronics' },
        { month: 'Feb', sales: 90, productType: 'Clothing' },
      ];

      const colorConfig = {
        field: 'productType',
        mapping: new Map([
          ['Electronics', '#ff0000'],
          ['Clothing', '#00ff00'],
        ]),
      };

      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['month'],
          y: ['sales'],
        },
        {},
        false,
        colorConfig
      );

      // Should have 2 datasets (one for each color/productType)
      expect(result.datasets).toHaveLength(2);

      // Check first dataset (Electronics)
      expect(result.datasets[0].colors).toBe('#ff0000');
      expect(result.datasets[0].data).toEqual([100, 120]);
      expect(result.datasets[0].label).toEqual([{ key: 'productType', value: 'Electronics' }]);

      // Check second dataset (Clothing)
      expect(result.datasets[1].colors).toBe('#00ff00');
      expect(result.datasets[1].data).toEqual([80, 90]);
      expect(result.datasets[1].label).toEqual([{ key: 'productType', value: 'Clothing' }]);

      // Check ticks are consistent across all datasets
      expect(result.ticks).toEqual([['Jan'], ['Feb']]);
      expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);
    });

    it('should handle multiple y-axes with color configuration', () => {
      const testData = [
        { month: 'Jan', sales: 100, profit: 20, region: 'North' },
        { month: 'Jan', sales: 80, profit: 15, region: 'South' },
        { month: 'Feb', sales: 120, profit: 25, region: 'North' },
        { month: 'Feb', sales: 90, profit: 18, region: 'South' },
      ];

      const colorConfig = {
        field: 'region',
        mapping: new Map([
          ['North', '#0000ff'],
          ['South', '#ff00ff'],
        ]),
      };

      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['month'],
          y: ['sales', 'profit'],
        },
        {},
        false,
        colorConfig
      );

      // Should have 4 datasets (2 metrics × 2 regions)
      expect(result.datasets).toHaveLength(4);

      // Find sales datasets
      const salesDatasets = result.datasets.filter((d) => d.dataKey === 'sales');
      const profitDatasets = result.datasets.filter((d) => d.dataKey === 'profit');

      expect(salesDatasets).toHaveLength(2);
      expect(profitDatasets).toHaveLength(2);

      // Check labels include both metric and color field
      const northSalesDataset = salesDatasets.find((d) => d.colors === '#0000ff');
      expect(northSalesDataset?.label).toEqual([
        { key: 'sales', value: '' },
        { key: 'region', value: 'North' },
      ]);

      const southProfitDataset = profitDatasets.find((d) => d.colors === '#ff00ff');
      expect(southProfitDataset?.label).toEqual([
        { key: 'profit', value: '' },
        { key: 'region', value: 'South' },
      ]);
    });

    it('should handle categories combined with color configuration', () => {
      const testData = [
        { quarter: 'Q1', sales: 100, product: 'A', region: 'North' },
        { quarter: 'Q1', sales: 80, product: 'B', region: 'North' },
        { quarter: 'Q2', sales: 120, product: 'A', region: 'North' },
        { quarter: 'Q1', sales: 90, product: 'A', region: 'South' },
        { quarter: 'Q2', sales: 95, product: 'A', region: 'South' },
      ];

      const colorConfig = {
        field: 'region',
        mapping: new Map([
          ['North', '#aabbcc'],
          ['South', '#ddeeff'],
        ]),
      };

      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['quarter'],
          y: ['sales'],
          category: ['product'],
        },
        {},
        false,
        colorConfig
      );

      // Should have 3 datasets (North: A, B; South: A)
      expect(result.datasets).toHaveLength(3);

      // Check that labels include product category AND color field
      const northProductADataset = result.datasets.find(
        (d) => d.colors === '#aabbcc' && d.label.some((l) => l.key === 'product' && l.value === 'A')
      );

      expect(northProductADataset).toBeDefined();
      expect(northProductADataset?.label).toEqual([
        { key: 'region', value: 'North' },
        { key: 'product', value: 'A' },
      ]);
      expect(northProductADataset?.data).toEqual([100, 120]);

      const southProductADataset = result.datasets.find(
        (d) => d.colors === '#ddeeff' && d.label.some((l) => l.key === 'product' && l.value === 'A')
      );

      expect(southProductADataset).toBeDefined();
      expect(southProductADataset?.data).toEqual([90, 95]);
    });

    it('should handle missing color values by filtering unmapped data', () => {
      const testData = [
        { month: 'Jan', sales: 100, category: 'A' },
        { month: 'Jan', sales: 80, category: 'C' }, // C is not mapped to a color
        { month: 'Feb', sales: 120, category: 'A' },
        { month: 'Feb', sales: 90, category: 'C' }, // C is not mapped to a color
      ];

      const colorConfig = {
        field: 'category',
        mapping: new Map([
          ['A', '#ff0000'],
          ['B', '#00ff00'], // B doesn't exist in data but is mapped
        ]),
      };

      const result = aggregateAndCreateDatasets(
        testData,
        {
          x: ['month'],
          y: ['sales'],
        },
        {},
        false,
        colorConfig
      );

      // Should have 1 dataset (only for A which has data and color mapping)
      expect(result.datasets).toHaveLength(1);

      // Dataset A should have real data
      const datasetA = result.datasets.find((d) => d.colors === '#ff0000');
      expect(datasetA?.data).toEqual([100, 120]);
      expect(datasetA?.label).toEqual([{ key: 'category', value: 'A' }]);

      // Category C data should be filtered out since it's not in the color mapping
      // Check ticks are still correct for all x-axis values from original data
      expect(result.ticks).toEqual([['Jan'], ['Feb']]);
      expect(result.ticksKey).toEqual([{ key: 'month', value: '' }]);
    });
  });
});
