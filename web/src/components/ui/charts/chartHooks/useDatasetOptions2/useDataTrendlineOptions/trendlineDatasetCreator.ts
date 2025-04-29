// Also consider modifying this package to make it work with chartjs 4 https://pomgui.github.io/chartjs-plugin-regression/demo/

import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric/charts';
import type { DatasetOption } from '../interfaces';
import type { TrendlineDataset } from './trendlineDataset.types';
import { DATASET_IDS } from '../config';
import { isDateColumnType, isNumericColumnType } from '@/lib/messages';
import { extractFieldsFromChain } from '../groupingHelpers';
import { DataFrameOperations } from '@/lib/math';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { dataMapper } from './dataMapper';
import { regression } from '@/lib/regression/regression';

export const trendlineDatasetCreator: Record<
  Trendline['type'],
  (
    trendline: Trendline,
    rawDataset: DatasetOption[],
    columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
  ) => TrendlineDataset[]
> = {
  polynomial_regression: (trendline, selectedDataset, columnLabelFormats) => {
    return [];
    // const dimensions = selectedDataset.dimensions as string[];
    // const xAxisColumn = dimensions[0];
    // const isXAxisNumeric = isNumericColumnType(
    //   columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    // );
    // const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    // const { mappedData, indexOfTrendlineColumn } = dataMapper(
    //   trendline,
    //   selectedDataset,
    //   columnLabelFormats,
    //   isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    // );

    // if (indexOfTrendlineColumn === undefined) return [];

    // if (isXAxisNumeric) {
    //   const regressionResult = regression.polynomial(mappedData, { order: 2, precision: 2 });
    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.polynomialRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // if (isXAxisDate) {
    //   const firstTimestamp = mappedData[0][0];
    //   // Convert timestamps to days since first timestamp for better numerical stability
    //   const regressionResult = regression.polynomial(
    //     mappedData.map(([timestamp, value]) => [
    //       (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24),
    //       value
    //     ]),
    //     { order: 2, precision: 2 }
    //   );

    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24);
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.polynomialRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // // For non-numeric, non-date x-axis, use indices
    // const regressionResult = regression.polynomial(
    //   mappedData.map((item, index) => [index, item[1]]),
    //   { order: 2, precision: 2 }
    // );

    // const data = mappedData.map((item, index) => {
    //   const newItem = [...item];
    //   newItem[indexOfTrendlineColumn] = regressionResult.predict(index)[1];
    //   return newItem;
    // });

    // return [
    //   {
    //     ...trendline,
    //     id: DATASET_IDS.polynomialRegression(trendline.columnId),
    //     source: data,
    //     dimensions: dimensions,
    //     equation: regressionResult.string
    //   }
    // ];
  },

  logarithmic_regression: (trendline, selectedDataset, columnLabelFormats) => {
    return [];
    // const dimensions = selectedDataset.dimensions as string[];
    // const xAxisColumn = dimensions[0];
    // const isXAxisNumeric = isNumericColumnType(
    //   columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    // );
    // const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    // const { mappedData, indexOfTrendlineColumn } = dataMapper(
    //   trendline,
    //   selectedDataset,
    //   columnLabelFormats,
    //   isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    // );

    // if (indexOfTrendlineColumn === undefined) return [];

    // if (isXAxisNumeric) {
    //   // For numeric x-axis, ensure all x values are positive
    //   const minX = Math.min(...mappedData.map(([x]) => x));
    //   if (minX <= 0) {
    //     // Shift all x values to be positive
    //     const shift = Math.abs(minX) + 1;
    //     mappedData.forEach((item) => (item[0] += shift));
    //   }

    //   const regressionResult = regression.logarithmic(mappedData, { precision: 2 });
    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.logarithmicRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // if (isXAxisDate) {
    //   const firstTimestamp = mappedData[0][0];
    //   // Start from day 1 instead of day 0 to avoid log(0)
    //   const regressionResult = regression.logarithmic(
    //     mappedData.map(([timestamp, value]) => [
    //       // Convert timestamp to days since first timestamp, starting from 1
    //       (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24) + 1,
    //       value
    //     ]),
    //     { precision: 2 }
    //   );

    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24) + 1;
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.logarithmicRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // const regressionResult = regression.logarithmic(
    //   mappedData.map(([x, y]) => [x + 1, y]),
    //   {
    //     precision: 2
    //   }
    // );
    // const data = mappedData.map((item) => {
    //   const newItem = [...item];
    //   newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0] + 1)[1];
    //   return newItem;
    // });

    // return [
    //   {
    //     ...trendline,
    //     id: DATASET_IDS.logarithmicRegression(trendline.columnId),
    //     source: data,
    //     dimensions: dimensions,
    //     equation: regressionResult.string
    //   }
    // ];
  },

  exponential_regression: (trendline, selectedDataset, columnLabelFormats) => {
    return [];
    // const dimensions = selectedDataset.dimensions as string[];
    // const xAxisColumn = dimensions[0];
    // const isXAxisNumeric = isNumericColumnType(
    //   columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    // );
    // const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    // const { mappedData, indexOfTrendlineColumn } = dataMapper(
    //   trendline,
    //   selectedDataset,
    //   columnLabelFormats,
    //   isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    // );

    // if (indexOfTrendlineColumn === undefined) return [];

    // // Ensure all y values are positive for exponential regression
    // const minY = Math.min(...mappedData.map(([_, y]) => y));
    // if (minY <= 0) {
    //   // If we have zero or negative values, shift all y values up by |minY| + 1
    //   const shift = Math.abs(minY) + 1;
    //   mappedData.forEach((item) => (item[1] += shift));
    // }

    // if (isXAxisNumeric) {
    //   // For numeric x-axis, normalize x values to start from 1 to enhance exponential fit
    //   const minX = Math.min(...mappedData.map(([x]) => x));
    //   const normalizedData: [number, number][] = mappedData.map(([x, y]) => [x - minX + 1, y]);

    //   const regressionResult = regression.exponential(normalizedData, { precision: 6 });

    //   const data = mappedData.map((item, index) => {
    //     const newItem = [...item];
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(normalizedData[index][0])[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.exponentialRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // if (isXAxisDate) {
    //   const firstTimestamp = mappedData[0][0];
    //   // Convert to days and ensure we start from day 1 (not day 0)
    //   const normalizedData: [number, number][] = mappedData.map(([timestamp, value]) => [
    //     (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24) + 1,
    //     value
    //   ]);

    //   const regressionResult = regression.exponential(normalizedData, { precision: 6 });

    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24) + 1;
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.exponentialRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // // For non-numeric, non-date x-axis, use indices starting from 1
    // const normalizedData: [number, number][] = mappedData.map((item, index) => [
    //   index + 1,
    //   item[1]
    // ]);
    // const regressionResult = regression.exponential(normalizedData, { precision: 6 });

    // const data = mappedData.map((item, index) => {
    //   const newItem = [...item];
    //   newItem[indexOfTrendlineColumn] = regressionResult.predict(index + 1)[1];
    //   return newItem;
    // });

    // return [
    //   {
    //     ...trendline,
    //     id: DATASET_IDS.exponentialRegression(trendline.columnId),
    //     source: data,
    //     dimensions,
    //     equation: regressionResult.string
    //   }
    // ];
  },

  linear_regression: (trendline, datasets, columnLabelFormats) => {
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    const validData = selectedDataset.data.filter((value) => value !== null && value !== undefined);
    if (validData.length === 0) return [];

    return [];
    // const dimensions = selectedDataset.dimensions as string[];
    // const xAxisColumn = dimensions[0];
    // const isXAxisNumeric = isNumericColumnType(
    //   columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    // );
    // const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    // const { mappedData, indexOfTrendlineColumn } = dataMapper(
    //   trendline,
    //   selectedDataset,
    //   columnLabelFormats,
    //   isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    // );

    // if (indexOfTrendlineColumn === undefined) return [];

    // if (isXAxisNumeric) {
    //   if (indexOfTrendlineColumn === undefined) return [];

    //   const regressionResult = regression.linear(mappedData, { precision: 2 });

    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.linearRegression(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // if (isXAxisDate) {
    //   const firstTimestamp = mappedData[0][0];
    //   const regressionResult = regression.linear(
    //     mappedData.map(([timestamp, value]) => [
    //       // Convert timestamp to days since first timestamp
    //       (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24),
    //       value
    //     ]),
    //     { precision: 2 }
    //   );
    //   const data = mappedData.map((item) => {
    //     const newItem = [...item];
    //     newItem[indexOfTrendlineColumn] = regressionResult.predict(
    //       (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24)
    //     )[1];
    //     return newItem;
    //   });

    //   return [
    //     {
    //       ...trendline,
    //       id: DATASET_IDS.linearSlope(trendline.columnId),
    //       source: data,
    //       dimensions: dimensions,
    //       equation: regressionResult.string
    //     }
    //   ];
    // }

    // const regressionResult = regression.linear(mappedData, { precision: 2 });
    // const data = mappedData.map((item) => {
    //   const newItem = [...item];
    //   newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
    //   return newItem;
    // });

    // return [
    //   {
    //     ...trendline,
    //     id: DATASET_IDS.linearSlope(trendline.columnId),
    //     source: data,
    //     dimensions,
    //     equation: regressionResult.string
    //   }
    // ];
  },

  average: (trendline, datasets) => {
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    // Filter out null/undefined values
    const validData = selectedDataset.data.filter((value) => value !== null && value !== undefined);
    if (validData.length === 0) return [];

    // Sum all valid values and divide by the count
    const sum = validData.reduce<number>((acc, datapoint) => {
      return acc + (datapoint as number);
    }, 0);

    const average = sum / validData.length;

    return [
      {
        ...trendline,
        id: DATASET_IDS.average(trendline.columnId),
        label: [[{ key: 'value', value: average }]],
        data: [average],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: average }]]
      }
    ];
  },

  min: (trendline, datasets) => {
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    // Filter out null/undefined values
    const validData = selectedDataset.data.filter((value) => value !== null && value !== undefined);
    if (validData.length === 0) return [];

    // Use the first valid value as initial accumulator
    const min = validData.reduce<number>((acc, datapoint) => {
      return Math.min(acc, datapoint as number);
    }, validData[0] as number);

    return [
      {
        ...trendline,
        id: DATASET_IDS.min(trendline.columnId),
        label: [[{ key: 'value', value: min }]],
        data: [min],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: min }]]
      }
    ];
  },

  max: (trendline, datasets) => {
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    // Filter out null/undefined values
    const validData = selectedDataset.data.filter((value) => value !== null && value !== undefined);
    if (validData.length === 0) return [];

    // Use the first valid value as initial accumulator
    const max = validData.reduce<number>((acc, datapoint) => {
      return Math.max(acc, datapoint as number);
    }, validData[0] as number);

    return [
      {
        ...trendline,
        id: DATASET_IDS.max(trendline.columnId),
        label: [[{ key: 'value', value: max }]],
        data: [max],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: max }]]
      }
    ];
  },

  median: (trendline, datasets) => {
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    // Sort the data and get the middle value
    const sortedData = [...selectedDataset.data]
      .filter((value) => value !== null && value !== undefined)
      .sort((a, b) => (a as number) - (b as number));

    let median: number;
    const midIndex = Math.floor(sortedData.length / 2);

    if (sortedData.length % 2 === 0) {
      // Even number of elements - average the two middle values
      median = ((sortedData[midIndex - 1] as number) + (sortedData[midIndex] as number)) / 2;
    } else {
      // Odd number of elements - take the middle value
      median = sortedData[midIndex] as number;
    }

    if (median === undefined) return [];

    return [
      {
        ...trendline,
        id: DATASET_IDS.median(trendline.columnId),
        label: [[{ key: 'value', value: median }]],
        data: [median],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: median }]]
      }
    ];
  }
};
