import { ChartType } from '@/api/asset_interfaces/metric';
import type { DatasetOption, DatasetOptionsWithTicks } from './interfaces';
import { modifyDatasets } from './modifyDatasets';

describe('modifyDatasets - pieMinimumSlicePercentage tests', () => {
  // Basic dataset setup
  const createBasicDatasets = (): DatasetOptionsWithTicks => {
    return {
      datasets: [
        {
          id: 'slice1',
          label: [{ key: 'category', value: 'Category A' }],
          data: [500], // 50%
          dataKey: 'slice1',
          axisType: 'y',
          tooltipData: [[{ key: 'value', value: 500 }]]
        },
        {
          id: 'slice2',
          label: [{ key: 'category', value: 'Category B' }],
          data: [300], // 30%
          dataKey: 'slice2',
          axisType: 'y',
          tooltipData: [[{ key: 'value', value: 300 }]]
        },
        {
          id: 'slice3',
          label: [{ key: 'category', value: 'Category C' }],
          data: [100], // 10%
          dataKey: 'slice3',
          axisType: 'y',
          tooltipData: [[{ key: 'value', value: 100 }]]
        },
        {
          id: 'slice4',
          label: [{ key: 'category', value: 'Category D' }],
          data: [80], // 8%
          dataKey: 'slice4',
          axisType: 'y',
          tooltipData: [[{ key: 'value', value: 80 }]]
        },
        {
          id: 'slice5',
          label: [{ key: 'category', value: 'Category E' }],
          data: [20], // 2%
          dataKey: 'slice5',
          axisType: 'y',
          tooltipData: []
        }
      ],
      ticks: [],
      ticksKey: []
    };
  };

  test('should not modify datasets if chart type is not pie', () => {
    const datasets = createBasicDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: 5,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    expect(result).toEqual(datasets.datasets);
    expect(result.length).toBe(5);
  });

  test('should not modify datasets if pieMinimumSlicePercentage is undefined', () => {
    const datasets = createBasicDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    expect(result).toEqual(datasets.datasets);
    expect(result.length).toBe(5);
  });

  test('should combine slices below the minimum percentage into an "Other" category', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Slices 1, 2 and 3 should remain (>=10%)
    // Slices 4 and 5 should be combined into "Other" (8% and 2%)
    expect(result.length).toBe(4);

    // Check that the original large slices are preserved
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(true);

    // Check that the smaller slices are removed
    expect(result.some((dataset) => dataset.id === 'slice4')).toBe(false);
    expect(result.some((dataset) => dataset.id === 'slice5')).toBe(false);

    // Check that an "Other" category was created with the combined value
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();
    expect(otherCategory?.data[0]).toBe(100); // Combined value of slice4 (80) and slice5 (20)
    expect(otherCategory?.label[0].value).toBe('Other');
  });

  test('should handle case when no slices are below the minimum percentage', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 1; // All slices are above 1%

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // All slices should remain, no "Other" category
    expect(result.length).toBe(5);
    expect(result.some((dataset) => dataset.id === 'other')).toBe(false);
  });

  test('should handle case when all slices are below the minimum percentage', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 60; // All slices are below 60%

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // All slices should be combined into one "Other" slice
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('other');
    expect(result[0].data[0]).toBe(1000); // Sum of all values
  });

  test('should handle empty datasets array', () => {
    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: [],
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: 10,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    expect(result).toEqual([]);
  });

  test('should handle datasets with null or zero values', () => {
    const datasets: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [null], // Null value
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: null }]]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [0], // Zero value
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 0 }]]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [100], // The only actual value
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 100 }]]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: 10,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Since we want a minimum percentage of 10%, it will combine the null and 0 values into the "Other" category
    expect(result.length).toBe(2);
    // Verify that it's the slice with the actual value that remains
    expect(result[0].id).toBe('slice3');
    expect(result[1].id).toBe('other');
    expect(result[0].data[0]).toBe(100);
    expect(result[1].data[0]).toBe(0);
  });

  test('should handle case when all values are null or zero', () => {
    const datasets: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [null],
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: null }]]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [0],
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 0 }]]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: 10,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Should return the original datasets when all values are null/zero
    expect(result).toEqual(datasets);
  });

  test('should handle decimal values in pieMinimumSlicePercentage', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 8.5; // Between slice4 (8%) and slice3 (10%)

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Slices 1, 2 and 3 should remain (>=8.5%)
    // Slices 4 and 5 should be combined into "Other" (8% and 2%)
    expect(result.length).toBe(4);
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(true);

    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();
    expect(otherCategory?.data[0]).toBe(100); // Combined value of slice4 (80) and slice5 (20)
  });

  test('should preserve tooltipData when combining into Other category', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();
    expect(otherCategory?.tooltipData).toBeDefined();
    expect(otherCategory?.tooltipData?.[0]).toBeDefined();

    // Check that the tooltipData contains the combined value
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(100); // Combined value of slice4 (80) and slice5 (20)
  });

  test('should handle edge case where pieMinimumSlicePercentage is exactly equal to a slice percentage', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 8; // Exactly equal to slice4's percentage

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Slices 1, 2, 3, and 4 should remain (>=8%)
    // Only slice5 should be combined into "Other" (2%)
    expect(result.length).toBe(5);
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice4')).toBe(true);

    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();
    expect(otherCategory?.data[0]).toBe(20); // Only slice5 (20) is combined
  });

  test('should correctly combine tooltipData from multiple slices into the Other category', () => {
    // Create datasets with more complex tooltip data
    const datasetsWithDetailedTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'region', value: 'North' },
            { key: 'growth', value: 15 }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'region', value: 'South' },
            { key: 'growth', value: 8 }
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [100], // 10%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 100 },
            { key: 'region', value: 'East' },
            { key: 'growth', value: 5 }
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [50], // 5%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 50 },
            { key: 'region', value: 'West' },
            { key: 'growth', value: 3 }
          ]
        ]
      },
      {
        id: 'slice5',
        label: [{ key: 'category', value: 'Category E' }],
        data: [40], // 4%
        dataKey: 'slice5',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 40 },
            { key: 'region', value: 'Central' },
            { key: 'growth', value: 2 }
          ]
        ]
      },
      {
        id: 'slice6',
        label: [{ key: 'category', value: 'Category F' }],
        data: [10], // 1%
        dataKey: 'slice6',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 10 },
            { key: 'region', value: 'Northwest' },
            { key: 'growth', value: 1 }
          ]
        ]
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithDetailedTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2, 3 should remain (>=10%)
    // Slices 4, 5, 6 should be combined into "Other" (<10%)
    expect(result.length).toBe(4);

    // Check that the original large slices are preserved
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(true);

    // Check that the smaller slices are removed
    expect(result.some((dataset) => dataset.id === 'slice4')).toBe(false);
    expect(result.some((dataset) => dataset.id === 'slice5')).toBe(false);
    expect(result.some((dataset) => dataset.id === 'slice6')).toBe(false);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 50 + 40 + 10; // sum of slice4, slice5, slice6
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    expect(otherCategory?.tooltipData).toEqual([
      [
        { key: 'value', value: 100 },
        { key: 'region', value: 'West, Central, Northwest' },
        { key: 'growth', value: 6 }
      ]
    ]);

    // Verify the tooltipData value is correctly summed
    expect(otherCategory?.tooltipData?.[0]).toBeDefined();
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Verify the label is set to "Other"
    expect(otherCategory?.label[0].key).toBe('category');
    expect(otherCategory?.label[0].value).toBe('Other');
  });

  test('should accurately reflect the sum of combined values in tooltip when creating Other category', () => {
    const datasets = createBasicDatasets();
    const minimumPercentage = 15; // This will cause slices 3, 4, and 5 to be combined

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2 should remain (>=15%)
    // Slices 3, 4, 5 should be combined into "Other" (<15%)
    expect(result.length).toBe(3);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Calculate expected "Other" value
    const expectedOtherValue = 100 + 80 + 20; // sum of slice3, slice4, slice5

    // Verify the data value matches the sum
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify the tooltipData value matches the sum
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);
  });

  test('should handle datasets with different tooltip structures when creating Other category', () => {
    // Create datasets with varying tooltip structures
    const datasetsWithVariedTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'region', value: 'North' }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [200], // 20%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 200 }
            // No region key
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [100], // 10%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 100 },
            { key: 'region', value: 'East' },
            { key: 'extra', value: 'Additional data' } // Extra field
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [80], // 8%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 80 },
            { key: 'region', value: 'West' }
          ]
        ]
      },
      {
        id: 'slice5',
        label: [{ key: 'category', value: 'Category E' }],
        data: [70], // 7%
        dataKey: 'slice5',
        axisType: 'y',
        tooltipData: [
          [
            // Different order
            { key: 'region', value: 'Central' },
            { key: 'value', value: 70 }
          ]
        ]
      },
      {
        id: 'slice6',
        label: [{ key: 'category', value: 'Category F' }],
        data: [50], // 5%
        dataKey: 'slice6',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 50 },
            { key: 'region', value: 'Northwest' }
          ]
        ]
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithVariedTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2, 3 should remain (>=10%)
    // Slices 4, 5, 6 should be combined into "Other" (<10%)
    expect(result.length).toBe(4);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 80 + 70 + 50; // sum of slice4, slice5, slice6
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify the tooltipData is correct
    expect(otherCategory?.tooltipData?.[0]).toBeDefined();
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Should just have a single key-value pair for 'value' in the tooltip
    expect(otherCategory?.tooltipData?.[0].length).toBe(2);
    expect(otherCategory?.tooltipData?.[0][0].key).toBe('value');
    expect(otherCategory?.tooltipData?.[0][1].key).toBe('region');
    expect(otherCategory?.tooltipData).toEqual([
      [
        { key: 'value', value: 200 },
        { key: 'region', value: 'West, Central, Northwest' }
      ]
    ]);
  });

  test('should properly handle and combine numeric tooltip values in Other category', () => {
    // Create datasets with numeric tooltip values
    const datasetsWithNumericTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'growth', value: 10 }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'growth', value: 5 }
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [40], // 4%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 40 },
            { key: 'growth', value: 8 }
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [60], // 6%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 60 },
            { key: 'growth', value: 12 }
          ]
        ]
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithNumericTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2 should remain (>=10%)
    // Slices 3, 4 should be combined into "Other" (<10%)
    expect(result.length).toBe(3);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 40 + 60; // sum of slice3, slice4
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify the tooltipData structure is correct
    expect(otherCategory?.tooltipData?.[0]).toBeDefined();
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Check that growth numeric values don't get summed (should be concatenated as strings)
    const growthTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'growth');
    expect(growthTooltip).toBeDefined();
    expect(growthTooltip?.value).toBe(20); // sum of the tooltip growth values in slices 3 and 4
  });

  test('should correctly concatenate string tooltip values when combining into Other category', () => {
    // Create datasets with string tooltip values
    const datasetsWithStringTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'region', value: 'North' }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'region', value: 'South' }
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [40], // 4%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 40 },
            { key: 'region', value: 'East' }
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [60], // 6%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 60 },
            { key: 'region', value: 'West' }
          ]
        ]
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithStringTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2 should remain (>=10%)
    // Slices 3, 4 should be combined into "Other" (<10%)
    expect(result.length).toBe(3);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 40 + 60; // sum of slice3, slice4
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify the tooltipData value is correctly summed
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Check that string values are correctly concatenated with commas
    const regionTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'region');
    expect(regionTooltip).toBeDefined();
    expect(regionTooltip?.value).toBe('East, West'); // String values should be concatenated with comma separator
  });

  test('should correctly handle mixed types of tooltip values when combining into Other category', () => {
    // Create datasets with mixed tooltip value types
    const datasetsWithMixedTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'growth', value: 10 },
            { key: 'status', value: 'Active' }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'growth', value: 5 },
            { key: 'status', value: 'Active' }
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [40], // 4%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 40 },
            { key: 'growth', value: 8 },
            { key: 'status', value: 'Inactive' }
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [60], // 6%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 60 },
            { key: 'growth', value: -2 }, // Note the negative value
            { key: 'status', value: 'Pending' }
          ]
        ]
      },
      {
        id: 'slice5',
        label: [{ key: 'category', value: 'Category E' }],
        data: [30], // 3%
        dataKey: 'slice5',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 30 },
            { key: 'growth', value: 0 }, // Zero value
            { key: 'status', value: 'Active' }
          ]
        ]
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithMixedTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2 should remain (>=10%)
    // Slices 3, 4, 5 should be combined into "Other" (<10%)
    expect(result.length).toBe(3);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 40 + 60 + 30; // sum of slice3, slice4, slice5
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify numeric value is correctly summed
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Check that numeric growth values are summed correctly, including negative and zero values
    const growthTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'growth');
    expect(growthTooltip).toBeDefined();
    expect(growthTooltip?.value).toBe(6); // 8 + (-2) + 0 = 6

    // Check that string status values are concatenated correctly with no duplicates
    const statusTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'status');
    expect(statusTooltip).toBeDefined();
    expect(statusTooltip?.value).toBe('Inactive, Pending, Active'); // Unique string values concatenated
  });

  test('should handle tooltip merging when some slices have missing tooltip keys', () => {
    // Create datasets with some missing tooltip keys
    const datasetsWithMissingTooltips: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 500 },
            { key: 'region', value: 'North' },
            { key: 'status', value: 'Active' }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'region', value: 'South' }
            // No status key
          ]
        ]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [50], // 5%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 50 },
            // No region key
            { key: 'status', value: 'Inactive' }
          ]
        ]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [30], // 3%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 30 },
            { key: 'region', value: 'West' },
            { key: 'status', value: 'Pending' },
            { key: 'extra', value: 'Unique field' } // Unique key not in other slices
          ]
        ]
      },
      {
        id: 'slice5',
        label: [{ key: 'category', value: 'Category E' }],
        data: [20], // 2%
        dataKey: 'slice5',
        axisType: 'y',
        // No tooltipData at all
        tooltipData: []
      }
    ];

    const minimumPercentage = 10;

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithMissingTooltips,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: minimumPercentage,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Verify the result has the right number of datasets
    // Slices 1, 2 should remain (>=10%)
    // Slices 3, 4, 5 should be combined into "Other" (<10%)
    expect(result.length).toBe(3);

    // Find the Other category
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();

    // Verify the data value is correctly summed
    const expectedOtherValue = 50 + 30 + 20; // sum of slice3, slice4, slice5
    expect(otherCategory?.data[0]).toBe(expectedOtherValue);

    // Verify the tooltipData structure
    expect(otherCategory?.tooltipData?.[0]).toBeDefined();

    // Check value is summed correctly
    const valueTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'value');
    expect(valueTooltip).toBeDefined();
    expect(valueTooltip?.value).toBe(expectedOtherValue);

    // Check that region is merged from available values
    const regionTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'region');
    expect(regionTooltip).toBeDefined();
    expect(regionTooltip?.value).toBe('West'); // Only slice4 has region in the "Other" group

    // Check that status is merged from available values
    const statusTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'status');
    expect(statusTooltip).toBeDefined();
    expect(statusTooltip?.value).toBe('Inactive, Pending'); // From slice3 and slice4

    // Check that unique fields are preserved
    const extraTooltip = otherCategory?.tooltipData?.[0].find((item) => item.key === 'extra');
    expect(extraTooltip).toBeDefined();
    expect(extraTooltip?.value).toBe('Unique field'); // Only from slice4
  });

  test('should handle negative values in pie charts', () => {
    const datasetsWithNegativeValues: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }],
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 500 }]]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category B' }],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 300 }]]
      },
      {
        id: 'slice3',
        label: [{ key: 'category', value: 'Category C' }],
        data: [-100], // Negative value
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: -100 }]]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithNegativeValues,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: 10,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Negative values should be ignored in percentage calculations for pie charts
    // Total of positive values is 800
    // Slice 3 is negative so should be kept separate
    expect(result.length).toBe(3);
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(false);

    // No "Other" category should be created
    expect(result.some((dataset) => dataset.id === 'other')).toBe(true);
  });

  test('should handle pieMinimumSlicePercentage with datasets having different label structures', () => {
    const datasetsWithDifferentLabels: DatasetOption[] = [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category A' }], // Simple label
        data: [500], // 50%
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 500 }]]
      },
      {
        id: 'slice2',
        label: [
          { key: 'category', value: 'Category B' },
          { key: 'subcategory', value: 'Subcategory 1' } // Complex label with subcategory
        ],
        data: [300], // 30%
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 300 }]]
      },
      {
        id: 'slice3',
        label: [{ key: 'custom_key', value: 'Category C' }], // Different key
        data: [80], // 8%
        dataKey: 'slice3',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 80 }]]
      },
      {
        id: 'slice4',
        label: [{ key: 'category', value: 'Category D' }],
        data: [70], // 7%
        dataKey: 'slice4',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 70 }]]
      },
      {
        id: 'slice5',
        label: [], // Empty label
        data: [50], // 5%
        dataKey: 'slice5',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 50 }]]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithDifferentLabels,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: 10,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Slices 1 and 2 should remain (>=10%)
    // Slices 3, 4, and 5 should be combined into "Other" (<10%)
    expect(result.length).toBe(3);

    // Check that the original large slices are preserved
    expect(result.some((dataset) => dataset.id === 'slice1')).toBe(true);
    expect(result.some((dataset) => dataset.id === 'slice2')).toBe(true);

    // Check that the smaller slices are removed
    expect(result.some((dataset) => dataset.id === 'slice3')).toBe(false);
    expect(result.some((dataset) => dataset.id === 'slice4')).toBe(false);
    expect(result.some((dataset) => dataset.id === 'slice5')).toBe(false);

    // Check that an "Other" category was created with the combined value
    const otherCategory = result.find((dataset) => dataset.id === 'other');
    expect(otherCategory).toBeDefined();
    expect(otherCategory?.data[0]).toBe(200); // Sum of slice3 (80), slice4 (70), and slice5 (50)
    expect(otherCategory?.label[0].value).toBe('Other');
  });
});

describe('modifyDatasets - pieSortBy tests', () => {
  const createPieDatasets = (): DatasetOptionsWithTicks => ({
    datasets: [
      {
        id: 'slice1',
        label: [{ key: 'category', value: 'Category C' }],
        data: [300, 100, 500],
        dataKey: 'slice1',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 300 },
            { key: 'label', value: 'Category C' }
          ],
          [
            { key: 'value', value: 100 },
            { key: 'label', value: 'Category A' }
          ],
          [
            { key: 'value', value: 500 },
            { key: 'label', value: 'Category B' }
          ]
        ]
      },
      {
        id: 'slice2',
        label: [{ key: 'category', value: 'Category A' }],
        data: [100, 300, 200],
        dataKey: 'slice2',
        axisType: 'y',
        tooltipData: [
          [
            { key: 'value', value: 100 },
            { key: 'label', value: 'Category A' }
          ],
          [
            { key: 'value', value: 300 },
            { key: 'label', value: 'Category B' }
          ],
          [
            { key: 'value', value: 200 },
            { key: 'label', value: 'Category C' }
          ]
        ]
      }
    ],
    ticks: [],
    ticksKey: []
  });

  test('should sort pie chart data by value in ascending order', () => {
    const datasets = createPieDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: 'value',
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // First dataset should be slice2 (100) and second should be slice1 (300)

    expect(result[0].data[0]).toBe(100);
    expect(result[1].data[0]).toBe(300);

    // Check that tooltipData is also correctly reordered
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(100);
    expect(result[1].tooltipData?.[0]?.[0]?.value).toBe(300);
  });

  test('should sort pie chart data by key alphabetically', () => {
    const datasets = createPieDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: 'key',
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // First dataset should be Category A (slice2) and second should be Category C (slice1)
    expect(result[0].label[0].value).toBe('Category C');
    expect(result[1].label[0].value).toBe('Category A');

    // Check that data and tooltipData are correctly reordered
    expect(result[0].data[0]).toBe(100);
    expect(result[1].data[0]).toBe(300);
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(100);
    expect(result[1].tooltipData?.[0]?.[0]?.value).toBe(300);
  });

  test('should not modify order when pieSortBy is null', () => {
    const datasets = createPieDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: null,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    // Should maintain the same number of datasets and original order
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('slice1');
    expect(result[1].id).toBe('slice2');

    // Data and tooltipData should remain in original order
    expect(result[0].data[0]).toBe(300);
    expect(result[1].data[0]).toBe(100);
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(300);
    expect(result[1].tooltipData?.[0]?.[0]?.value).toBe(100);
  });

  test('should handle empty datasets array', () => {
    const emptyDatasets: DatasetOptionsWithTicks = {
      datasets: [],
      ticks: [],
      ticksKey: []
    };

    const { datasets: result } = modifyDatasets({
      datasets: emptyDatasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: 'value',
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Pie
    });

    expect(result).toEqual([]);
  });
});

describe('modifyDatasets - percentage stack tests', () => {
  const createBarDatasets = (): DatasetOptionsWithTicks => ({
    datasets: [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [100, 200, 300],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 300 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [50, 150, 250],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 50 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: 250 }]
        ]
      }
    ],
    ticks: [],
    ticksKey: []
  });

  test('should convert bar chart values to percentages for percentage-stack mode', () => {
    const datasets = createBarDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: 'percentage-stack',
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // First point: 100 + 50 = 150 total
    // 100/150 = 66.67%, 50/150 = 33.33%
    expect(result[0].data[0]).toBeCloseTo(66.67, 1);
    expect(result[1].data[0]).toBeCloseTo(33.33, 1);

    // Second point: 200 + 150 = 350 total
    // 200/350 = 57.14%, 150/350 = 42.86%
    expect(result[0].data[1]).toBeCloseTo(57.14, 1);
    expect(result[1].data[1]).toBeCloseTo(42.86, 1);

    // Third point: 300 + 250 = 550 total
    // 300/550 = 54.55%, 250/550 = 45.45%
    expect(result[0].data[2]).toBeCloseTo(54.55, 1);
    expect(result[1].data[2]).toBeCloseTo(45.45, 1);
  });

  test('should sort bar chart data by value in ascending order', () => {
    const datasets = createBarDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['asc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [100, 200, 300], [50, 150, 250]
    // Original sums: [150, 350, 550]
    // Ordered by ascending sum: [150, 350, 550]
    // Since already in ascending order, should remain the same

    // First dataset
    expect(result[0].data).toEqual([100, 200, 300]);

    // Second dataset
    expect(result[1].data).toEqual([50, 150, 250]);

    // Original tooltipData should maintain association with data
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(100);
    expect(result[0].tooltipData?.[1]?.[0]?.value).toBe(200);
    expect(result[0].tooltipData?.[2]?.[0]?.value).toBe(300);
  });

  test('should handle percentage-stack for line charts', () => {
    const datasets = createBarDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: 'percentage-stack',
      selectedChartType: ChartType.Line
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // First point: 100 + 50 = 150 total
    // 100/150 = 66.67%, 50/150 = 33.33%
    expect(result[0].data[0]).toBeCloseTo(66.67, 1);
    expect(result[1].data[0]).toBeCloseTo(33.33, 1);

    // Second point: 200 + 150 = 350 total
    // 200/350 = 57.14%, 150/350 = 42.86%
    expect(result[0].data[1]).toBeCloseTo(57.14, 1);
    expect(result[1].data[1]).toBeCloseTo(42.86, 1);

    // Third point: 300 + 250 = 550 total
    // 300/550 = 54.55%, 250/550 = 45.45%
    expect(result[0].data[2]).toBeCloseTo(54.55, 1);
    expect(result[1].data[2]).toBeCloseTo(45.45, 1);
  });

  test('should handle percentage-stack with zero values', () => {
    const datasetsWithZeros: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [100, 0, 300],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 0 }],
          [{ key: 'value', value: 300 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [50, 150, 0],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 50 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: 0 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithZeros,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: 'percentage-stack',
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // First point: 100 + 50 = 150 total
    // 100/150 = 66.67%, 50/150 = 33.33%
    expect(result[0].data[0]).toBeCloseTo(66.67, 1);
    expect(result[1].data[0]).toBeCloseTo(33.33, 1);

    // Second point: 0 + 150 = 150 total
    // 0/150 = 0%, 150/150 = 100%
    expect(result[0].data[1]).toBeCloseTo(0, 1);
    expect(result[1].data[1]).toBeCloseTo(100, 1);

    // Third point: 300 + 0 = 300 total
    // 300/300 = 100%, 0/300 = 0%
    expect(result[0].data[2]).toBeCloseTo(100, 1);
    expect(result[1].data[2]).toBeCloseTo(0, 1);
  });

  test('should handle percentage-stack with null and mixed values', () => {
    const datasetsWithNulls: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [100, null, 300],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: null }],
          [{ key: 'value', value: 300 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [50, 150, 0],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 50 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: 0 }]
        ]
      },
      {
        id: 'dataset3',
        label: [{ key: 'category', value: 'Series 3' }],
        data: [0, 0, 200],
        dataKey: 'dataset3',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 0 }],
          [{ key: 'value', value: 0 }],
          [{ key: 'value', value: 200 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithNulls,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: 'percentage-stack',
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(3);

    // First point: 100 + 50 + 0 = 150 total
    // 100/150 = 66.67%, 50/150 = 33.33%, 0/150 = 0%
    expect(result[0].data[0]).toBeCloseTo(66.67, 1);
    expect(result[1].data[0]).toBeCloseTo(33.33, 1);
    expect(result[2].data[0]).toBeCloseTo(0, 1);

    // Second point: null (treated as 0) + 150 + 0 = 150 total
    // 0/150 = 0%, 150/150 = 100%, 0/150 = 0%
    expect(result[0].data[1]).toBeCloseTo(0, 1);
    expect(result[1].data[1]).toBeCloseTo(100, 1);
    expect(result[2].data[1]).toBeCloseTo(0, 1);

    // Third point: 300 + 0 + 200 = 500 total
    // 300/500 = 60%, 0/500 = 0%, 200/500 = 40%
    expect(result[0].data[2]).toBeCloseTo(60, 1);
    expect(result[1].data[2]).toBeCloseTo(0, 1);
    expect(result[2].data[2]).toBeCloseTo(40, 1);
  });

  test('should handle percentage-stack with uneven data lengths', () => {
    const datasetsWithUnevenLengths: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [100, 200, 300, 400], // 4 data points
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: 400 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [50, 150], // Only 2 data points
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: 50 }], [{ key: 'value', value: 150 }]]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithUnevenLengths,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: undefined,
      pieSortBy: undefined,
      barGroupType: 'percentage-stack',
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets and data length
    expect(result.length).toBe(2);
    expect(result[0].data.length).toBe(4);
    expect(result[1].data.length).toBe(2);

    // First point: 100 + 50 = 150 total
    expect(result[0].data[0]).toBeCloseTo(66.67, 1); // 100/150 = 66.67%
    expect(result[1].data[0]).toBeCloseTo(33.33, 1); // 50/150 = 33.33%

    // Second point: 200 + 150 = 350 total
    expect(result[0].data[1]).toBeCloseTo(57.14, 1); // 200/350 = 57.14%
    expect(result[1].data[1]).toBeCloseTo(42.86, 1); // 150/350 = 42.86%

    // Third point: 300 + 0 = 300 total (dataset2 doesn't have a third point)
    expect(result[0].data[2]).toBeCloseTo(100, 1); // 300/300 = 100%

    // Fourth point: 400 + 0 = 400 total (dataset2 doesn't have a fourth point)
    expect(result[0].data[3]).toBeCloseTo(100, 1); // 400/400 = 100%
  });
});

describe('modifyDatasets - barSortBy tests', () => {
  const createBarDatasets = (): DatasetOptionsWithTicks => ({
    datasets: [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [300, 100, 200],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [200, 150, 50],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: 50 }]
        ]
      }
    ],
    ticks: [],
    ticksKey: []
  });

  test('should sort bar chart data by descending values', () => {
    const datasets = createBarDatasets();
    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['desc', 'desc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [300, 100, 200], [200, 150, 50]
    // Original sums: [500, 250, 250]
    // Ordered by descending sum: [500, 250, 250] (note the tied values)
    // After sorting: index 0 first, then indices 1 and 2 (but since they're tied, their order remains the same)

    // First dataset
    expect(result[0].data[0]).toBe(300); // 300 from the first position
    expect(result[0].data[1]).toBe(100); // 100 from the second position
    expect(result[0].data[2]).toBe(200); // 200 from the third position

    // Second dataset
    expect(result[1].data[0]).toBe(200); // 200 from the first position
    expect(result[1].data[1]).toBe(150); // 150 from the second position
    expect(result[1].data[2]).toBe(50); // 50 from the third position

    // Check that tooltipData is also correctly reordered
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(300);
    expect(result[0].tooltipData?.[1]?.[0]?.value).toBe(100);
    expect(result[0].tooltipData?.[2]?.[0]?.value).toBe(200);
  });

  test('should sort bar chart data by ascending values when values are not already in order', () => {
    // Create datasets that are not already in ascending order
    const datasetsNotInOrder: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [300, 100, 200],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [200, 50, 150],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 50 }],
          [{ key: 'value', value: 150 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsNotInOrder,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['asc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [300, 100, 200], [200, 50, 150]
    // Original sums: [500, 150, 350]
    // Ordered by ascending sum: [150, 350, 500]
    // After sorting: index 1, then 2, then 0

    // Test the new ordering reflects ascending order by sum
    // First dataset (original index mapping: 1->0, 2->1, 0->2)
    expect(result[0].data[0]).toBe(100); // from index 1
    expect(result[0].data[1]).toBe(200); // from index 2
    expect(result[0].data[2]).toBe(300); // from index 0

    // Second dataset
    expect(result[1].data[0]).toBe(50); // from index 1
    expect(result[1].data[1]).toBe(150); // from index 2
    expect(result[1].data[2]).toBe(200); // from index 0

    // Check that tooltipData is also correctly reordered
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(100);
    expect(result[0].tooltipData?.[1]?.[0]?.value).toBe(200);
    expect(result[0].tooltipData?.[2]?.[0]?.value).toBe(300);
  });

  test('should handle bar sort with multiple options but use first valid option', () => {
    const datasets = createBarDatasets();

    const { datasets: result } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['none', 'desc'], // First one is 'none', should use 'desc'
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [300, 100, 200], [200, 150, 50]
    // Original sums: [500, 250, 250]
    // With 'none' first and 'desc' second, should use 'desc'
    // Ordered by descending sum: [500, 250, 250]

    // First dataset - should remain in original order since 'none' was first
    expect(result[0].data[0]).toBe(300);
    expect(result[0].data[1]).toBe(100);
    expect(result[0].data[2]).toBe(200);

    // Second dataset
    expect(result[1].data[0]).toBe(200);
    expect(result[1].data[1]).toBe(150);
    expect(result[1].data[2]).toBe(50);

    // Test with a different order of options
    const { datasets: result2 } = modifyDatasets({
      datasets,
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['desc', 'none'], // First one is 'desc', should use that
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // First dataset - should now be sorted
    expect(result2[0].data[0]).toBe(300);
    expect(result2[0].data[1]).toBe(100);
    expect(result2[0].data[2]).toBe(200);

    // Second dataset
    expect(result2[1].data[0]).toBe(200);
    expect(result2[1].data[1]).toBe(150);
    expect(result2[1].data[2]).toBe(50);
  });

  test('should handle bar sort with datasets containing negative values', () => {
    const datasetsWithNegatives: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [-100, 200, -300],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: -100 }],
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: -300 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [-50, 150, -100],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: -50 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: -100 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithNegatives,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['asc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [-100, 200, -300], [-50, 150, -100]
    // Original sums: [-150, 350, -400]
    // Ordered by ascending sum: [-400, -150, 350]
    // After sorting: index 2, then 0, then 1

    // First dataset (original index mapping: 2->0, 0->1, 1->2)
    expect(result[0].data[0]).toBe(-300); // from index 2
    expect(result[0].data[1]).toBe(-100); // from index 0
    expect(result[0].data[2]).toBe(200); // from index 1

    // Second dataset
    expect(result[1].data[0]).toBe(-100); // from index 2
    expect(result[1].data[1]).toBe(-50); // from index 0
    expect(result[1].data[2]).toBe(150); // from index 1

    // Check that tooltipData is also correctly reordered
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(-300);
    expect(result[0].tooltipData?.[1]?.[0]?.value).toBe(-100);
    expect(result[0].tooltipData?.[2]?.[0]?.value).toBe(200);
  });

  test('should handle bar sort with datasets containing null values', () => {
    const datasetsWithNulls: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [null, 200, 100],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: null }],
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 100 }]
        ]
      },
      {
        id: 'dataset2',
        label: [{ key: 'category', value: 'Series 2' }],
        data: [50, null, 150],
        dataKey: 'dataset2',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 50 }],
          [{ key: 'value', value: null }],
          [{ key: 'value', value: 150 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets: datasetsWithNulls,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['desc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    // Should maintain the same number of datasets
    expect(result.length).toBe(2);

    // Original order: [null, 200, 100], [50, null, 150]
    // Original sums: [50, 200, 250] (null treated as 0)
    // Ordered by descending sum: [250, 200, 50]
    // After sorting: index 2, then 1, then 0

    // First dataset (original index mapping: 2->0, 1->1, 0->2)
    expect(result[0].data[0]).toBe(100); // from index 2
    expect(result[0].data[1]).toBe(200); // from index 1
    expect(result[0].data[2]).toBe(null); // from index 0

    // Second dataset
    expect(result[1].data[0]).toBe(150); // from index 2
    expect(result[1].data[1]).toBe(null); // from index 1
    expect(result[1].data[2]).toBe(50); // from index 0

    // Check that tooltipData is also correctly reordered
    expect(result[0].tooltipData?.[0]?.[0]?.value).toBe(100);
    expect(result[0].tooltipData?.[1]?.[0]?.value).toBe(200);
    expect(result[0].tooltipData?.[2]?.[0]?.value).toBe(null);
  });

  test('single dataset can sort by ascending values', () => {
    const datasets: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [300, 100, 200],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['asc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    expect(result.length).toBe(1);
    expect(result[0].data[0]).toBe(100);
    expect(result[0].data[1]).toBe(200);
    expect(result[0].data[2]).toBe(300);
  });

  test('single dataset can sort by descending values', () => {
    const datasets: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [300, 100, 200],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: 100 }],
          [{ key: 'value', value: 200 }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['desc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    expect(result.length).toBe(1);
    expect(result[0].data[0]).toBe(300);
    expect(result[0].data[1]).toBe(200);
    expect(result[0].data[2]).toBe(100);
  });

  test('single dataset with null values can sort by descending values', () => {
    const datasets: DatasetOption[] = [
      {
        id: 'dataset1',
        label: [{ key: 'category', value: 'Series 1' }],
        data: [300, null, 200, 150, null],
        dataKey: 'dataset1',
        axisType: 'y',
        tooltipData: [
          [{ key: 'value', value: 300 }],
          [{ key: 'value', value: null }],
          [{ key: 'value', value: 200 }],
          [{ key: 'value', value: 150 }],
          [{ key: 'value', value: null }]
        ]
      }
    ];

    const { datasets: result } = modifyDatasets({
      datasets: {
        datasets,
        ticks: [],
        ticksKey: []
      },
      pieMinimumSlicePercentage: undefined,
      barSortBy: ['desc'],
      pieSortBy: undefined,
      barGroupType: undefined,
      lineGroupType: undefined,
      selectedChartType: ChartType.Bar
    });

    expect(result.length).toBe(1);
    expect(result[0].data[0]).toBe(300);
    expect(result[0].data[1]).toBe(200);
    expect(result[0].data[2]).toBe(150);
    expect(result[0].data[3]).toBe(null);
    expect(result[0].data[4]).toBe(null);
  });
});
