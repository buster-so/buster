'use client';

import {
  type BusterChartProps,
  type ChartType,
  type BarSortBy,
  type PieSortBy
} from '@/api/asset_interfaces/metric/charts';
import { createDayjsDate } from '@/lib/date';
import { extractFieldsFromChain, appendToKeyValueChain } from './groupingHelpers';
import { DATASET_IDS, GROUPING_SEPARATOR } from './config';
import type { DatasetOption } from './interfaces';
import {
  type ColumnMetaData,
  DEFAULT_COLUMN_LABEL_FORMAT,
  type SimplifiedColumnType
} from '@/api/asset_interfaces/metric';

type DataItem = NonNullable<BusterChartProps['data']>[number];

export const sortLineBarData = (
  data: NonNullable<BusterChartProps['data']>,
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>,
  xFieldSorts: string[],
  xFields: string[]
) => {
  if (xFieldSorts.length === 0) return data;

  const columnMetadataRecord = columnMetadata.reduce<Record<string, ColumnMetaData>>(
    (acc, curr) => {
      acc[curr.name] = curr;
      return acc;
    },
    {}
  );

  const sortedData = [...data];
  if (xFieldSorts.length > 0) {
    sortedData.sort((a, b) => {
      for (let i = 0; i < xFieldSorts.length; i++) {
        const field = xFields[i];
        const fieldType: SimplifiedColumnType = columnMetadataRecord[field]?.simple_type || 'text';

        //NUMBER CASE
        if (
          fieldType === 'number' ||
          (typeof a[field] === 'number' && typeof b[field] === 'number')
        ) {
          if (a[field] !== b[field]) {
            return (a[field] as number) - (b[field] as number);
          }
        }

        //DATE CASE
        else if (fieldType === 'date') {
          const aDate = createDayjsDate(a[field] as string);
          const bDate = createDayjsDate(b[field] as string);
          if (aDate.valueOf() !== bDate.valueOf()) {
            return aDate.valueOf() - bDate.valueOf();
          }
        }

        //TEXT CASE
        else {
          if (a[field] !== b[field]) {
            return String(a[field]).localeCompare(String(b[field]));
          }
        }
      }
      return 0;
    });
  }
  return sortedData;
};

export const mapLineBarPieData = (
  sortedData: NonNullable<BusterChartProps['data']>,
  xFields: string[],
  categoryFields: string[],
  measureFields: string[]
) => {
  const xValuesSet = new Set<string>(); // Stores unique X-axis values
  const categoriesSet = new Set<string>(); // Stores unique category values
  const dataMap = new Map<string | number, Record<string, string | number | Date | null>>(); // Stores data points in format: "xValue|category" => measures

  // Pre-compile field access functions for better performance
  const xFieldAccessors = xFields.map((field) => (item: DataItem) => ({
    key: field,
    value: String(item[field])
  }));
  const categoryFieldAccessors = categoryFields.map((field) => (item: DataItem) => ({
    key: field,
    value: String(item[field])
  }));
  const measureFieldAccessors = measureFields.map((field) => (item: DataItem) => item[field]);

  // Process each data item and build up our data structures
  sortedData.forEach((item) => {
    const categoryKey = appendToKeyValueChain(
      categoryFieldAccessors.map((accessor) => accessor(item))
    );
    const measures = Object.fromEntries(
      measureFieldAccessors.map((accessor, i) => [measureFields[i], accessor(item)])
    );

    categoriesSet.add(categoryKey);

    // Track unique values
    const xKey = appendToKeyValueChain(xFieldAccessors.map((accessor) => accessor(item)));
    xValuesSet.add(xKey);

    // For other charts: aggregate measures for same x/category combination
    const mapKey = `${xKey}|${categoryKey}`;
    const existingData = dataMap.get(mapKey);
    if (!existingData) {
      dataMap.set(mapKey, measures);
    } else {
      // Sum up measures with existing values
      measureFields.forEach((field) => {
        // If both values are numbers, sum them up
        const isExistingNumber = typeof existingData[field] === 'number';
        const isNewNumber = typeof measures[field] === 'number';

        if (isExistingNumber && isNewNumber) {
          existingData[field] = (existingData[field] as number) + (measures[field] as number);
        } else {
          // If either value is not a number, concatenate them with a separator
          if (existingData[field] === measures[field]) {
            existingData[field] = measures[field];
          } else {
            existingData[field] = [existingData[field], measures[field]].join(GROUPING_SEPARATOR);
          }
        }
      });
    }
  });

  return { dataMap, xValuesSet, categoriesSet };
};

export const processLineBarData = (
  categoriesSet: Set<string>,
  xValuesSet: Set<string>,
  dataMap: Map<string | number, Record<string, string | number | Date | null>>,
  measureFields: string[],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
) => {
  const categories = Array.from(categoriesSet);

  // Helper to create initial row with x-value
  const createRow = (xValue: string | number) => [xValue];
  const defaultReplaceMissingDataWith = 0;

  // For bar/line/pie charts - aggregate by x-value and category
  const processedData = Array.from(xValuesSet).map((xValue) => {
    const row = createRow(xValue);

    // Build row by adding values for each measure/category combination

    measureFields.forEach((measure) => {
      categories.forEach((category) => {
        const key = `${xValue}|${category}`;
        const columnLabelFormat = columnLabelFormats[measure] || DEFAULT_COLUMN_LABEL_FORMAT;
        const replaceMissingDataWith = columnLabelFormat?.replaceMissingDataWith;

        const value =
          typeof dataMap.get(key)?.[measure] === 'number'
            ? dataMap.get(key)?.[measure]
            : replaceMissingDataWith !== undefined
              ? replaceMissingDataWith
              : defaultReplaceMissingDataWith;

        row.push(value as string | number);
      });
    });

    return row;
  });

  return processedData;
};

export const createDimension = (measures: string[], categories: string[]) => {
  const headers: string[] = [];
  measures.forEach((measure) => {
    categories.forEach((category) => {
      //i need both the measure and the category because i need format label
      const key = measure;
      const value = null;
      const header = appendToKeyValueChain([{ key, value }], category);
      headers.push(header);
    });
  });
  return headers;
};

export const getLineBarPieDimensions = (
  categoriesSet: Set<string>,
  measureFields: string[],
  xFields: string[]
) => {
  const categories = Array.from(categoriesSet);
  return [xFields.join(','), ...createDimension(measureFields, categories)];
};

export const getLineBarPieYAxisKeys = (categoriesSet: Set<string>, measureFields: string[]) => {
  const categories = Array.from(categoriesSet);
  return createDimension(measureFields, categories);
};

export const getLineBarPieTooltipKeys = (
  categoriesSet: Set<string>,
  tooltipFields: string[],
  measureFields: string[]
) => {
  const categories = Array.from(categoriesSet);
  const fieldsToUse = [...(tooltipFields.length > 0 ? tooltipFields : measureFields)];
  return createDimension(fieldsToUse, categories);
};

export const getLineBarPieDatasetOptions = (
  dimensions: string[],
  processedData: (string | number | Date | null)[][],
  selectedChartType: ChartType,
  pieMinimumSlicePercentage: number | undefined,
  barSortBy: BarSortBy | undefined,
  pieSortBy: PieSortBy | undefined,
  yAxisKeys: string[], //only used this for pie charts
  xFieldDateSorts: string[],
  barGroupType: BusterChartProps['barGroupType'] | undefined,
  lineGroupType: BusterChartProps['lineGroupType']
) => {
  const datasets: DatasetOption[] = [];

  datasets.push({
    id: DATASET_IDS.raw,
    dimensions,
    source: processedData
  });

  if (selectedChartType === 'pie' && pieMinimumSlicePercentage) {
    const minimumPiePercentage = pieMinimumSlicePercentage;
    const lastDataset = datasets[datasets.length - 1];
    const lastSource = lastDataset.source as (string | number | Date | null)[][];

    // Process each y-axis column (starting from index 1 since index 0 is title)
    const processedSlices = yAxisKeys.map((_, yIndex) => {
      const columnIndex = yIndex + 1;

      // Calculate total value for percentage calculations
      const total = lastSource.reduce((sum, row) => sum + (Number(row[columnIndex]) || 0), 0);
      const minThreshold = (total * minimumPiePercentage) / 100;

      // Sort rows by current y-axis value descending
      const sortedData = [...lastSource].sort(
        (a, b) => (Number(b[columnIndex]) || 0) - (Number(a[columnIndex]) || 0)
      );

      // Split into main slices and small slices
      const mainSlices: typeof processedData = [];
      const smallSlices: typeof processedData = [];

      sortedData.forEach((row) => {
        if (Number(row[columnIndex]) >= minThreshold) {
          mainSlices.push([...row]); // Clone row to avoid mutations
        } else {
          smallSlices.push([...row]);
        }
      });

      // Combine small slices into "Other"
      if (smallSlices.length > 0) {
        const otherValue = smallSlices.reduce(
          (sum, row) => sum + (Number(row[columnIndex]) || 0),
          0
        );
        const otherRow = new Array(dimensions.length).fill(0);
        otherRow[0] = 'Other';
        otherRow[columnIndex] = otherValue;
        mainSlices.push(otherRow);
      }

      return mainSlices;
    });

    // Add transformed datasets for each y-axis
    processedSlices.forEach((slices, index) => {
      const yAxisKey = yAxisKeys[index];
      datasets.push({
        id: DATASET_IDS.pieMinimum(yAxisKey),
        dimensions,
        source: slices
      });
    });
  }

  // Add relative stacking transform for bar charts
  if (
    (selectedChartType === 'bar' && barGroupType === 'percentage-stack') ||
    (selectedChartType === 'line' && lineGroupType === 'percentage-stack')
  ) {
    const lastDataset = datasets[datasets.length - 1];
    const lastSource = lastDataset.source as (string | number | Date | null)[][];
    const relativeStackedData = makeRelativeStack(lastSource);
    datasets.push({
      id: DATASET_IDS.relativeStack,
      dimensions,
      source: relativeStackedData
    });
  }

  if (selectedChartType === 'pie' && pieSortBy === 'value') {
    const lastDataset = datasets[datasets.length - 1];
    const lastSource = lastDataset.source as (string | number | Date | null)[][];
    const sortedData = [...lastSource]
      .sort((a, b) => {
        return (Number(b[1]) || 0) - (Number(a[1]) || 0);
      })
      .reverse();
    datasets.push({
      id: DATASET_IDS.sortedByValue,
      dimensions,
      source: sortedData
    });
  }

  if (selectedChartType === 'bar' && barSortBy && barSortBy?.some((y) => y !== 'none')) {
    // Sort the processed data based on the y-axis values at their respective indices
    // Pre-calculate indices and directions to avoid repeated lookups
    const sortConfigs = yAxisKeys
      .map((key, index) => ({
        index: dimensions.indexOf(key),
        direction: barSortBy[index]
      }))
      .filter((config) => config.index !== -1 && config.direction !== 'none');
    const lastDataset = datasets[datasets.length - 1];
    const lastSource = lastDataset.source as (string | number | Date | null)[][];

    const sortedData = [...lastSource].sort((a, b) => {
      for (const { index, direction } of sortConfigs) {
        const valueA = Number(a[index]) || 0;
        const valueB = Number(b[index]) || 0;

        if (valueA !== valueB) {
          return direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
      }
      return 0;
    });

    datasets.push({
      id: DATASET_IDS.sortedByBar,
      dimensions,
      source: sortedData
    });
  }

  //we carve out this case because line charts with date x axis are a special case and need raw dates
  if (
    (selectedChartType === 'line' || selectedChartType === 'combo') &&
    xFieldDateSorts.length === 1
  ) {
    const lastDataset = datasets[datasets.length - 1];
    const lastSource = lastDataset.source as (string | number | Date | null)[][];
    const processedDataWithDate = lastSource.map((row) => {
      const delinimatedDate = row[0] as string;
      const { value: rawStringDate } = extractFieldsFromChain(delinimatedDate)[0];
      return [rawStringDate, ...row.slice(1)];
    });
    datasets.push({
      id: DATASET_IDS.rawWithDateNotDelimited,
      dimensions,
      source: processedDataWithDate
    });
  }

  return datasets;
};

const makeRelativeStack = (processedData: (string | number | Date | null)[][]) => {
  if (!processedData.length) return [];

  return processedData.map((row) => {
    const [firstColumn, ...values] = row;

    // Replace nulls with 0 and calculate total in single pass
    const rowTotal = values.reduce<number>(
      (sum, val) => sum + (typeof val === 'number' ? val : 0),
      0
    );

    // Skip percentage calculation if total is 0
    if (rowTotal === 0) return row;

    // Convert to percentages in single transformation, replacing nulls with 0
    return [
      firstColumn,
      ...values.map((val) => {
        if (val === null) return 0;
        return typeof val === 'number' ? (val / rowTotal) * 100 : val;
      })
    ];
  });
};
