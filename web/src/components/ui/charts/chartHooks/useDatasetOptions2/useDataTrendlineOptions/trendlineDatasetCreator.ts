// Also consider modifying this package to make it work with chartjs 4 https://pomgui.github.io/chartjs-plugin-regression/demo/

import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric/charts';
import type { DatasetOptionsWithTicks } from '../interfaces';
import type { TrendlineDataset } from './trendlineDataset.types';
import { DATASET_IDS } from '../config';
import { isDateColumnType, isNumericColumnType } from '@/lib/messages';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { regression } from '@/lib/regression/regression';
import { dataMapper } from './dataMapper';

export const trendlineDatasetCreator: Record<
  Trendline['type'],
  (
    trendline: Trendline,
    rawDataset: DatasetOptionsWithTicks,
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

  logarithmic_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    const xAxisColumn = selectedDataset.dataKey;

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the dataMapper
    const mappedPoints = dataMapper(
      selectedDataset,
      {
        ticks: datasetsWithTicks.ticks,
        ticksKey: datasetsWithTicks.ticksKey
      },
      columnLabelFormats
    );

    if (mappedPoints.length === 0) return [];

    // For date x-axis, normalize to days since first date and ensure all values are positive
    const normalizedPoints: [number, number][] = isXAxisDate
      ? mappedPoints.map(([x, y]): [number, number] => {
          const firstTimestamp = mappedPoints[0][0];
          // Add 1 to avoid log(0), convert to days
          return [(x - firstTimestamp) / (1000 * 60 * 60 * 24) + 1, y];
        })
      : mappedPoints;

    // Filter out points with non-positive x values since log(x) is only defined for x > 0
    const validPoints = normalizedPoints.filter(([x]) => x > 0);
    if (validPoints.length < 2) return []; // Need at least 2 points for regression

    // Calculate logarithmic regression with higher precision
    const regressionResult = regression.logarithmic(validPoints, { precision: 4 });

    // Map back to original x values but with predicted y values
    const data = normalizedPoints.map(([x]) => {
      // Only predict for positive x values, otherwise return null
      return x > 0 ? regressionResult.predict(x)[1] : null;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.logarithmicRegression(trendline.columnId),
        data,
        dataKey: trendline.columnId,
        axisType: 'y' as const,
        tooltipData: [],
        label: [
          [
            {
              key: 'value',
              value: `Logarithmic Regression (${isXAxisDate ? 'Date' : isXAxisNumeric ? 'Numeric' : 'Categorical'})`
            }
          ]
        ]
      }
    ];
  },

  exponential_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    const xAxisColumn = selectedDataset.dataKey;

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the dataMapper
    const mappedPoints = dataMapper(
      selectedDataset,
      {
        ticks: datasetsWithTicks.ticks,
        ticksKey: datasetsWithTicks.ticksKey
      },
      columnLabelFormats
    );

    if (mappedPoints.length === 0) return [];

    // Filter out points with non-positive y values before regression
    const validPoints = mappedPoints.filter(([_, y]) => y > 0);
    if (validPoints.length < 2) return []; // Need at least 2 points for regression

    // For date x-axis, normalize to days since first date
    const points: [number, number][] = isXAxisDate
      ? validPoints.map(([x, y]): [number, number] => {
          const firstTimestamp = mappedPoints[0][0];
          return [(x - firstTimestamp) / (1000 * 60 * 60 * 24), y];
        })
      : validPoints;

    // Calculate exponential regression with higher precision for exponential values
    const regressionResult = regression.exponential(points, { precision: 6 });

    // Map back to original x values but with predicted y values
    const data = mappedPoints.map(([x]) => {
      const predictedY = isXAxisDate
        ? regressionResult.predict((x - mappedPoints[0][0]) / (1000 * 60 * 60 * 24))[1]
        : regressionResult.predict(x)[1];
      return predictedY;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.exponentialRegression(trendline.columnId),
        data,
        dataKey: trendline.columnId,
        axisType: 'y' as const,
        tooltipData: [],
        label: [
          [
            {
              key: 'value',
              value: `Exponential Regression (${isXAxisDate ? 'Date' : isXAxisNumeric ? 'Numeric' : 'Categorical'})`
            }
          ]
        ]
      }
    ];
  },

  linear_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const selectedDataset = datasets.find((dataset) => dataset.id === trendline.columnId);

    if (!selectedDataset?.data || selectedDataset.data.length === 0) return [];

    const validData = selectedDataset.data.filter((value) => value !== null && value !== undefined);
    if (validData.length === 0) return [];

    const xAxisColumn = selectedDataset.dataKey;

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the updated dataMapper
    const mappedPoints = dataMapper(
      selectedDataset,
      {
        ticks: datasetsWithTicks.ticks,
        ticksKey: datasetsWithTicks.ticksKey
      },
      columnLabelFormats
    );

    if (mappedPoints.length === 0) return [];

    // For date x-axis, normalize to days since first date
    const points: [number, number][] = isXAxisDate
      ? mappedPoints.map(([x, y]): [number, number] => {
          const firstTimestamp = mappedPoints[0][0];
          return [(x - firstTimestamp) / (1000 * 60 * 60 * 24), y];
        })
      : mappedPoints;

    // Calculate linear regression
    const regressionResult = regression.linear(points, { precision: 2 });

    // Map back to original x values but with predicted y values
    const data = mappedPoints.map(([x]) => {
      const predictedY = isXAxisDate
        ? regressionResult.predict((x - mappedPoints[0][0]) / (1000 * 60 * 60 * 24))[1]
        : regressionResult.predict(x)[1];
      return predictedY;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.linearRegression(trendline.columnId),
        data,
        dataKey: trendline.columnId,
        axisType: 'y' as const,
        tooltipData: [],
        label: [
          [
            {
              key: 'value',
              value: `Linear Regression (${isXAxisDate ? 'Date' : isXAxisNumeric ? 'Numeric' : 'Categorical'})`
            }
          ]
        ]
      }
    ];
  },

  average: (trendline, datasetsWithTicks) => {
    const datasets = datasetsWithTicks.datasets;
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

  min: (trendline, datasetsWithTicks) => {
    const datasets = datasetsWithTicks.datasets;
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

  max: (trendline, datasetsWithTicks) => {
    const datasets = datasetsWithTicks.datasets;
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

  median: (trendline, datasetsWithTicks) => {
    const datasets = datasetsWithTicks.datasets;
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
