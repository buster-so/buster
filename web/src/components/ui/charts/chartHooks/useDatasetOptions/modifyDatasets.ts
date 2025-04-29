import { BarSortBy, BusterChartProps, ChartType, PieSortBy } from '@/api/asset_interfaces/metric';
import { DatasetOption, DatasetOptionsWithTicks, KV } from './interfaces';
import cloneDeep from 'lodash/cloneDeep';
import { sum as lodashSum } from 'lodash';

// Helper: ensure pie slices meet minimum percentage
function handlePieThreshold(datasets: DatasetOption[], minPercent: number): DatasetOption[] {
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
  const tooltipMap = new Map<string, string | number | null>([['value', otherValue]]);

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
  const items = [...datasets];
  if (sortBy === 'value') {
    return items.sort((a, b) => (b.data[0] || 0) - (a.data[0] || 0));
  }
  return items.sort((a, b) => {
    const aKey = a.label?.[0]?.value?.toString().toLowerCase() || '';
    const bKey = b.label?.[0]?.value?.toString().toLowerCase() || '';
    return aKey.localeCompare(bKey);
  });
}

// Helper: convert to percentage-stack
function applyPercentageStack(datasets: DatasetOption[]): DatasetOption[] {
  const clone = cloneDeep(datasets);
  const length = clone[0]?.data.length || 0;
  const sums = new Array<number>(length).fill(0);

  clone.forEach((ds) =>
    ds.data.forEach((v, i) => {
      sums[i] += v || 0;
    })
  );

  clone.forEach((ds) => {
    ds.data = ds.data.map((v, i) => (sums[i] ? ((v || 0) / sums[i]) * 100 : 0));
  });

  return clone;
}

// Helper: sort bar/line datasets by sum per index
function sortBarLine(datasets: DatasetOption[], barSortBy: BarSortBy): DatasetOption[] {
  const clone = cloneDeep(datasets);
  const sortKey = barSortBy.find((o) => o !== 'none');
  if (!sortKey) return datasets;

  const dataLen = clone[0]?.data.length || 0;
  // compute sums
  const sums = new Array<number>(dataLen).fill(0);
  clone.forEach((ds) =>
    ds.data.forEach((v, i) => {
      sums[i] += v === null ? 0 : v || 0;
    })
  );

  // generate sorted indices
  const indices = sums.map((sum, idx) => idx);
  indices.sort((a, b) => (sortKey === 'asc' ? sums[a] - sums[b] : sums[b] - sums[a]));

  // reorder each dataset
  clone.forEach((ds) => {
    ds.data = indices.map((i) => ds.data[i]);
    if (ds.tooltipData) {
      ds.tooltipData = indices.map((i) => ds.tooltipData![i] || []);
    }
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

  // Pie chart handling
  if (selectedChartType === ChartType.Pie) {
    if (pieMinimumSlicePercentage != null) {
      const modifiedDatasets = handlePieThreshold(datasets.datasets, pieMinimumSlicePercentage);
      return {
        ...datasets,
        datasets: modifiedDatasets
      };
    }
    if (pieSortBy) {
      const modifiedDatasets = sortPie(datasets.datasets, pieSortBy);
      return {
        ...datasets,
        datasets: modifiedDatasets
      };
    }
  }

  // Percentage-stack for bar or line
  if (
    (selectedChartType === ChartType.Bar && barGroupType === 'percentage-stack') ||
    (selectedChartType === ChartType.Line && lineGroupType === 'percentage-stack')
  ) {
    const modifiedDatasets = applyPercentageStack(datasets.datasets);
    return {
      ...datasets,
      datasets: modifiedDatasets
    };
  }

  // Bar sorting
  if (selectedChartType === ChartType.Bar && barSortBy && barSortBy.some((o) => o !== 'none')) {
    const modifiedDatasets = sortBarLine(datasets.datasets, barSortBy);
    return {
      ...datasets,
      datasets: modifiedDatasets
    };
  }

  return datasets;
}
