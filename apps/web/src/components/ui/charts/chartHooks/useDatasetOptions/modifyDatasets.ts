import type { BarSortBy, ChartType, PieSortBy } from '@buster/server-shared/metrics';
import cloneDeep from 'lodash/cloneDeep';
import lodashSum from 'lodash/sum';
import type { BusterChartProps } from '../../BusterChart.types';
import type { DatasetOption, DatasetOptionsWithTicks, KV } from './interfaces';

// Helper: ensure pie slices meet minimum percentage
function handlePieThreshold(datasets: DatasetOption[], minPercent: number): DatasetOption[] {
  // Special case: if there's a single dataset with multiple values (bar/line as pie)
  if (datasets.length === 1 && datasets[0]?.data.length && datasets[0]?.data.length > 1) {
    const dataset = cloneDeep(datasets[0]);
    const total = lodashSum(dataset.data.map((v) => (v === null ? 0 : v || 0)));
    if (total <= 0) return datasets;

    const aboveIndices: number[] = [];
    const belowIndices: number[] = [];

    // Identify which data points are above/below threshold
    dataset.data.forEach((value, index) => {
      const val = value === null ? 0 : value || 0;
      const pct = (val / total) * 100;
      (pct >= minPercent ? aboveIndices : belowIndices).push(index);
    });

    // If nothing is below threshold, return as is
    if (belowIndices.length === 0) return [dataset];

    // Calculate "Other" total value
    const otherValue = lodashSum(
      belowIndices.map((i) => (dataset.data[i] === null ? 0 : dataset.data[i] || 0))
    );

    // Create new arrays for data and tooltipData
    const newData: (number | null)[] = [];
    const newTooltipData: KV[][] = [];

    // Add all data points above threshold
    for (const i of aboveIndices) {
      newData.push(dataset.data[i] ?? null);
      newTooltipData.push(dataset.tooltipData?.[i] || []);
    }

    // Add the "Other" data point
    newData.push(otherValue);

    // Create "Other" tooltip with combined info
    const firstTooltip = dataset.tooltipData?.[belowIndices[0] ?? 0] || [];
    const valueKey =
      firstTooltip.find((t) => t.value === dataset.data[belowIndices[0] ?? 0])?.key || 'value';
    const otherTooltip: KV[] = [{ key: valueKey, value: otherValue }];

    // Add item sources to tooltip
    const sources = belowIndices
      .map((i) => {
        const tooltip = dataset.tooltipData?.[i] || [];
        const label = tooltip.find((t) => t.key === 'label' || t.key === 'category')?.value;
        return label ? String(label) : '';
      })
      .filter(Boolean)
      .join(', ');

    if (sources) {
      otherTooltip.push({ key: 'sources', value: sources });
    }

    newTooltipData.push(otherTooltip);

    return [
      {
        ...dataset,
        data: newData,
        tooltipData: newTooltipData,
      },
    ];
  }

  // Traditional case: multiple datasets, each with a single value
  const total = lodashSum(datasets.map((ds) => ds.data[0] || 0));
  if (total <= 0) return datasets;

  const above: DatasetOption[] = [];
  const below: DatasetOption[] = [];

  for (const ds of datasets) {
    const value = ds.data[0] || 0;
    const pct = (value / total) * 100;
    (pct >= minPercent ? above : below).push(ds);
  }

  if (!below.length) return above;

  // Combine 'below' into "Other"
  const otherValue = lodashSum(below.map((ds) => ds.data[0] || 0));
  const firstTooltip = below?.[0]?.tooltipData?.[0] || [];
  const valueKey = firstTooltip.find((t) => t.value === below?.[0]?.data[0])?.key || 'value';
  const tooltipMap = new Map<string, string | number | null>([[valueKey, otherValue]]);

  for (const ds of below) {
    const items = ds.tooltipData?.[0] || [];
    for (const { key, value } of items) {
      if (key === 'value') continue;

      const existing = tooltipMap.get(key);
      if (existing != null) {
        if (typeof existing === 'number' && typeof value === 'number') {
          tooltipMap.set(key, existing + value);
        } else if (typeof existing === 'string' && typeof value === 'string') {
          tooltipMap.set(key, `${existing}, ${value}`);
        }
      } else {
        if (typeof value === 'string' || typeof value === 'number' || value === null) {
          tooltipMap.set(key, value);
        }
      }
    }
  }

  const otherTooltip = Array.from(tooltipMap.entries()).map(([key, value]) => ({ key, value }));

  return [
    ...above,
    {
      id: 'other',
      label: [{ key: 'category', value: 'Other' }],
      data: [otherValue],
      dataKey: 'other',
      axisType: 'y',
      tooltipData: [otherTooltip],
    },
  ];
}

// Helper: sort pie slices
function sortPie(
  datasets: DatasetOption[],
  sortBy: PieSortBy,
  ticks: (string | number)[][] = []
): { datasets: DatasetOption[]; ticks: DatasetOptionsWithTicks['ticks'] } {
  const items = cloneDeep(datasets);
  const result = { datasets: items, ticks };

  if (!items.length) return result;

  // Get the first dataset for sorting reference
  const firstDataset = items[0];

  // Create indices array based on the first dataset's length
  const indices = Array.from({ length: firstDataset?.data.length || 0 }, (_, i) => i);

  if (!firstDataset) return result;

  // Sort indices based on the first dataset's values
  if (sortBy === 'value' && firstDataset) {
    indices.sort((a, b) => {
      const valueA = firstDataset.data[a] === null ? 0 : firstDataset.data[a] || 0;
      const valueB = firstDataset.data[b] === null ? 0 : firstDataset.data[b] || 0;
      return valueA - valueB;
    });
  } else {
    // Sort by label alphabetically using the first dataset's tooltips
    const labels = indices.map((index) => {
      const tooltip = firstDataset.tooltipData?.[index] || [];
      const label = tooltip.find((t) => t.key === 'label' || t.key === 'category')?.value;
      return (label?.toString() || '').toLowerCase();
    });

    indices.sort((a, b) => labels[a]?.localeCompare(labels[b] || '') || 0);
  }

  // Apply the same sorting order to all datasets
  result.datasets = items.map((dataset) => ({
    ...dataset,
    data: indices.map((i) => dataset.data[i] as number),
    tooltipData: dataset.tooltipData
      ? indices.map((i) => dataset.tooltipData?.[i] || [])
      : dataset.tooltipData,
    sizeData: dataset.sizeData ? indices.map((i) => dataset.sizeData?.[i] ?? null) : [],
  }));

  // Sort ticks if they exist
  if (ticks.length > 0) {
    result.ticks = indices.map((i) => ticks[i] as (string | number)[]);
  }

  return result;
}

// Helper: convert to percentage-stack
function applyPercentageStack(datasets: DatasetOption[]): DatasetOption[] {
  const clone = cloneDeep(datasets);
  const length = clone[0]?.data.length || 0;
  const sums = new Array<number>(length).fill(0);

  // Calculate sums for each data point
  for (const ds of clone) {
    ds.data.forEach((v, i) => {
      if (v !== null) {
        sums[i] += v || 0;
      }
    });
  }

  // Convert each data point to percentage and update tooltips
  for (const ds of clone) {
    ds.data = ds.data.map((v, i) => {
      const percentage = sums[i] ? ((v === null ? 0 : v || 0) / sums[i]) * 100 : 0;

      if (ds.tooltipData?.[i]) {
        const tooltipData = ds.tooltipData[i];
        for (const item of tooltipData) {
          if (item.value === v) {
            item.value = percentage;
          }
        }
        ds.tooltipData[i] = tooltipData;
      }

      return percentage;
    });
  }

  return clone;
}

// Helper: sort bar data
function sortBar(
  datasets: DatasetOption[],
  sortKey: NonNullable<BarSortBy>[number],
  ticks: (string | number)[][] = []
): { datasets: DatasetOption[]; ticks: DatasetOptionsWithTicks['ticks'] } {
  const items = cloneDeep(datasets);
  const result = { datasets: items, ticks };

  const dataLen = items[0]?.data.length || 0;
  if (!dataLen) return result;

  // Compute sums for each data column
  const sums = new Array<number>(dataLen).fill(0);
  for (const ds of items) {
    ds.data.forEach((v, i) => {
      sums[i] += v === null ? 0 : v || 0;
    });
  }

  // Create sorting indices
  const indices = Array.from({ length: dataLen }, (_, idx) => idx);

  indices.sort((a, b) => (sortKey === 'asc' ? sums[a] - sums[b] : sums[b] - sums[a]));

  // Sort datasets
  result.datasets = items.map((ds) => ({
    ...ds,
    // Sort data
    data: indices.map((i) => ds.data[i] ?? null),
    // Sort tooltipData if it exists
    tooltipData: ds.tooltipData ? indices.map((i) => ds.tooltipData?.[i] || []) : ds.tooltipData,
    // Sort sizeData if it exists
    sizeData: ds.sizeData ? indices.map((i) => ds.sizeData?.[i] ?? null) : [],
  }));

  // Sort ticks (x-axis labels)
  if (ticks.length > 0) {
    result.ticks = indices.map((i) => ticks[i] || []);
  }

  return result;
}

type ModifyDatasetsParams = {
  datasets: DatasetOptionsWithTicks;
  pieMinimumSlicePercentage?: number | undefined;
  barSortBy?: BarSortBy | undefined;
  pieSortBy?: PieSortBy | undefined;
  barGroupType?: BusterChartProps['barGroupType'] | undefined;
  lineGroupType: BusterChartProps['lineGroupType'];
  selectedChartType: ChartType;
};

export function modifyDatasets({
  datasets,
  pieMinimumSlicePercentage,
  pieSortBy,
  barSortBy,
  barGroupType,
  lineGroupType,
  selectedChartType,
}: ModifyDatasetsParams): DatasetOptionsWithTicks {
  if (!datasets.datasets.length) return datasets;

  // Only clone when we actually need to modify something
  let needsModification: boolean = false;

  // Check if we need to modify for pie charts
  const isPie = selectedChartType === 'pie';
  const needsPieThreshold = isPie && pieMinimumSlicePercentage != null;
  const needsPieSort = isPie && pieSortBy;

  // Check if we need to modify for percentage stack
  const needsPercentageStack =
    (selectedChartType === 'bar' && barGroupType === 'percentage-stack') ||
    (selectedChartType === 'line' && lineGroupType === 'percentage-stack');

  // Check if we need to modify for bar sorting
  const needsBarSort =
    selectedChartType === 'bar' && barSortBy && barSortBy.some((o) => o !== 'none');

  needsModification = needsPieThreshold || !!needsPieSort || needsPercentageStack || !!needsBarSort;

  // If no modifications needed, return original
  if (!needsModification) {
    return datasets;
  }

  // Create a shallow clone of the result structure, only clone deeply when needed
  const result: DatasetOptionsWithTicks = {
    datasets: datasets.datasets, // Start with reference, will replace if modified
    ticksKey: datasets.ticksKey,
    ticks: datasets.ticks,
  };

  // Pie chart handling
  if (isPie) {
    let modifiedDatasets = datasets.datasets;

    // Apply minimum threshold if needed
    if (needsPieThreshold) {
      modifiedDatasets = handlePieThreshold(modifiedDatasets, pieMinimumSlicePercentage);
    }

    // Apply sorting if needed
    if (needsPieSort) {
      // Only clone ticks if we need to sort
      const ticksToSort =
        modifiedDatasets !== datasets.datasets ? result.ticks : cloneDeep(result.ticks);
      const sortResult = sortPie(modifiedDatasets, pieSortBy, ticksToSort);
      modifiedDatasets = sortResult.datasets;
      result.ticks = sortResult.ticks;
    }

    result.datasets = modifiedDatasets;
    return result;
  }

  // Percentage-stack for bar or line
  if (needsPercentageStack) {
    result.datasets = applyPercentageStack(datasets.datasets);
    return result;
  }

  // Bar sorting
  if (needsBarSort) {
    const sortKey = barSortBy.find((o) => o !== 'none');
    if (!sortKey) return result;
    const sortResult = sortBar(datasets.datasets, sortKey, cloneDeep(result.ticks));
    result.datasets = sortResult.datasets;
    result.ticks = sortResult.ticks;
    return result;
  }

  return result;
}
