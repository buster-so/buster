import { BarSortBy, BusterChartProps, ChartType, PieSortBy } from '@/api/asset_interfaces/metric';
import { DatasetOption, DatasetOptionsWithTicks, KV } from './interfaces';
import cloneDeep from 'lodash/cloneDeep';
import { sum as lodashSum } from 'lodash';

// Helper: ensure pie slices meet minimum percentage
function handlePieThreshold(datasets: DatasetOption[], minPercent: number): DatasetOption[] {
  // Special case: if there's a single dataset with multiple values (bar/line as pie)
  if (datasets.length === 1 && datasets[0].data.length > 1) {
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
    aboveIndices.forEach((i) => {
      newData.push(dataset.data[i]);
      newTooltipData.push(dataset.tooltipData?.[i] || []);
    });

    // Add the "Other" data point
    newData.push(otherValue);

    // Create "Other" tooltip with combined info
    const firstTooltip = dataset.tooltipData?.[belowIndices[0]] || [];
    const valueKey =
      firstTooltip.find((t) => t.value === dataset.data[belowIndices[0]])?.key || 'value';
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
        tooltipData: newTooltipData
      }
    ];
  }

  // Traditional case: multiple datasets, each with a single value
  const total = lodashSum(datasets.map((ds) => ds.data[0] || 0));
  if (total <= 0) return datasets;

  const above: DatasetOption[] = [];
  const below: DatasetOption[] = [];

  datasets.forEach((ds) => {
    const value = ds.data[0] || 0;
    const pct = (value / total) * 100;
    (pct >= minPercent ? above : below).push(ds);
  });

  if (!below.length) return above;

  // Combine 'below' into "Other"
  const otherValue = lodashSum(below.map((ds) => ds.data[0] || 0));
  const firstTooltip = below[0].tooltipData?.[0] || [];
  const valueKey = firstTooltip.find((t) => t.value === below[0].data[0])?.key || 'value';
  const tooltipMap = new Map<string, string | number | null>([[valueKey, otherValue]]);

  below.forEach((ds) => {
    const items = ds.tooltipData?.[0] || [];
    items.forEach(({ key, value }) => {
      if (key === 'value') return;

      const existing = tooltipMap.get(key);
      if (existing != null) {
        if (typeof existing === 'number' && typeof value === 'number') {
          // Sum numeric values
          tooltipMap.set(key, existing + value);
        } else if (typeof existing === 'string' && typeof value === 'string') {
          // Concatenate string values
          tooltipMap.set(key, `${existing}, ${value}`);
        }
      } else {
        // Set the initial value
        if (typeof value === 'string' || typeof value === 'number' || value === null) {
          tooltipMap.set(key, value);
        }
      }
    });
  });

  const otherTooltip = Array.from(tooltipMap.entries()).map(([key, value]) => ({ key, value }));

  return [
    ...above,
    {
      id: 'other',
      label: [{ key: 'category', value: 'Other' }],
      data: [otherValue],
      dataKey: 'other',
      axisType: 'y',
      tooltipData: [otherTooltip]
    }
  ];
}

// Helper: sort pie slices
function sortPie(datasets: DatasetOption[], sortBy: PieSortBy): DatasetOption[] {
  const items = cloneDeep(datasets);

  if (sortBy === 'value') {
    // Create pairs of [index, value] for stable sorting
    const indexValuePairs = items.map((item, index) => [index, item.data[0] || 0]);

    // Sort by value (ascending - smallest first)
    indexValuePairs.sort((a, b) => (a[1] as number) - (b[1] as number));

    // Reorder the items based on the sorted indices
    const sortedItems = indexValuePairs.map(([index]) => items[index as number]);
    return sortedItems;
  }

  // Sort by label alphabetically
  const indexLabelPairs = items.map((item, index) => {
    const label = item.label?.[0]?.value?.toString().toLowerCase() || '';
    return [index, label];
  });

  // Sort by label
  indexLabelPairs.sort((a, b) => (a[1] as string).localeCompare(b[1] as string));

  // Reorder the items based on the sorted indices
  const sortedItems = indexLabelPairs.map(([index]) => items[index as number]);
  return sortedItems;
}

// Helper: convert to percentage-stack
function applyPercentageStack(datasets: DatasetOption[]): DatasetOption[] {
  const clone = cloneDeep(datasets);
  const length = clone[0]?.data.length || 0;
  const sums = new Array<number>(length).fill(0);

  // Calculate sums for each data point
  clone.forEach((ds) =>
    ds.data.forEach((v, i) => {
      sums[i] += v === null ? 0 : v || 0;
    })
  );

  // Convert each data point to percentage
  clone.forEach((ds) => {
    ds.data = ds.data.map((v, i) => (sums[i] ? ((v === null ? 0 : v || 0) / sums[i]) * 100 : 0));
  });

  return clone;
}

type ModifyDatasetsParams = {
  datasets: DatasetOptionsWithTicks;
  pieMinimumSlicePercentage?: number;
  barSortBy?: BarSortBy;
  pieSortBy?: PieSortBy;
  barGroupType?: BusterChartProps['barGroupType'];
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
  selectedChartType
}: ModifyDatasetsParams): DatasetOptionsWithTicks {
  if (!datasets.datasets.length) return datasets;

  // Create a deep clone of the entire datasets object
  const result: DatasetOptionsWithTicks = cloneDeep(datasets);

  // Pie chart handling
  if (selectedChartType === ChartType.Pie) {
    let modifiedDatasets = cloneDeep(datasets.datasets);

    // Apply minimum threshold if needed
    if (pieMinimumSlicePercentage != null) {
      modifiedDatasets = handlePieThreshold(modifiedDatasets, pieMinimumSlicePercentage);
    }

    // Apply sorting if needed
    if (pieSortBy) {
      // For datasets with a single dataset but multiple values, we need to sort the ticks alongside the data
      if (modifiedDatasets.length === 1 && modifiedDatasets[0].data.length > 1) {
        const singleDataset = modifiedDatasets[0];
        const indices = Array.from({ length: singleDataset.data.length }, (_, i) => i);

        // Sort indices by value or label
        if (pieSortBy === 'value') {
          const values = singleDataset.data;
          indices.sort((a, b) => {
            const valA = values[a] === null ? 0 : values[a] || 0;
            const valB = values[b] === null ? 0 : values[b] || 0;
            return valA - valB; // Smallest first
          });
        } else {
          // Sort by label from tooltipData
          const labels = indices.map((i) => {
            const tooltip = singleDataset.tooltipData?.[i] || [];
            const label = tooltip.find((t) => t.key === 'label' || t.key === 'category')?.value;
            return (label?.toString() || '').toLowerCase();
          });
          indices.sort((a, b) => labels[a].localeCompare(labels[b]));
        }

        // Sort the dataset
        const newData = indices.map((i) => singleDataset.data[i]);
        const newTooltipData = indices.map((i) => singleDataset.tooltipData?.[i] || []);

        // Also sort the ticks (x-axis labels)
        const newTicks = indices.map((i) => result.ticks[i] || []);

        // Update the dataset and ticks
        modifiedDatasets = [
          {
            ...singleDataset,
            data: newData,
            tooltipData: newTooltipData
          }
        ];

        result.ticks = newTicks;

        console.log('Sorted pie data (single dataset with multiple values):', {
          sortBy: pieSortBy,
          sortedIndices: indices,
          newData,
          newTicks
        });
      } else {
        // Traditional pie chart with multiple datasets
        modifiedDatasets = sortPie(modifiedDatasets, pieSortBy);
      }
    }

    result.datasets = modifiedDatasets;
    return result;
  }

  // Percentage-stack for bar or line
  if (
    (selectedChartType === ChartType.Bar && barGroupType === 'percentage-stack') ||
    (selectedChartType === ChartType.Line && lineGroupType === 'percentage-stack')
  ) {
    result.datasets = applyPercentageStack(datasets.datasets);
    return result;
  }

  // Bar sorting
  if (selectedChartType === ChartType.Bar && barSortBy && barSortBy.some((o) => o !== 'none')) {
    const sortKey = barSortBy.find((o) => o !== 'none');
    if (sortKey) {
      const dataLen = datasets.datasets[0]?.data.length || 0;

      // Compute sums for each data column
      const sums = new Array<number>(dataLen).fill(0);
      datasets.datasets.forEach((ds) =>
        ds.data.forEach((v, i) => {
          sums[i] += v === null ? 0 : v || 0;
        })
      );

      // Create sorting indices
      const indices = Array.from({ length: dataLen }, (_, idx) => idx);
      indices.sort((a, b) => (sortKey === 'asc' ? sums[a] - sums[b] : sums[b] - sums[a]));

      // Sort datasets
      result.datasets.forEach((ds) => {
        // Sort data
        ds.data = indices.map((i) => ds.data[i]);

        // Sort tooltipData if it exists
        if (ds.tooltipData) {
          ds.tooltipData = indices.map((i) => ds.tooltipData?.[i] || []);
        }

        // Sort sizeData if it exists
        if (ds.sizeData) {
          ds.sizeData = indices.map((i) => ds.sizeData?.[i] || null);
        }
      });

      // Sort ticks (x-axis labels)
      result.ticks = indices.map((i) => result.ticks[i] || []);

      console.log('Sorted bar data:', {
        sortKey,
        sortedIndices: indices,
        newTicks: result.ticks
      });
    }

    return result;
  }

  return result;
}
