// Also consider modifying this package to make it work with chartjs 4 https://pomgui.github.io/chartjs-plugin-regression/demo/

import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric/charts';
import type { DatasetOptionsWithTicks } from '../interfaces';
import type { TrendlineDataset } from './trendlineDataset.types';
import { DATASET_IDS } from '../config';
import { isDateColumnType, isNumericColumnType } from '@/lib/messages';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';
import { regression } from '@/lib/regression/regression';
import { dataMapper } from './dataMapper';
import { TypeToLabel } from '../../../BusterChartJS/hooks/useTrendlines/config';

export const trendlineDatasetCreator: Record<
  Trendline['type'],
  (
    trendline: Trendline,
    rawDataset: DatasetOptionsWithTicks,
    columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
  ) => TrendlineDataset[]
> = {
  polynomial_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const { validData, ticks, xAxisColumn, selectedDatasets } = getValidDataAndTicks(
      datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the dataMapper
    const mappedPoints = dataMapper(
      validData,
      xAxisColumn,
      {
        ticks,
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

    // Calculate polynomial regression with order 2 (quadratic)
    const regressionResult = regression.polynomial(points, { order: 2, precision: 4 });

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
        id: DATASET_IDS.polynomialRegression(trendline.columnId),
        data,
        dataKey: trendline.columnId,
        axisType: 'y' as const,
        tooltipData: [],
        label: [
          {
            key: 'value',
            value: TypeToLabel[trendline.type]
          }
        ]
      }
    ];
  },

  logarithmic_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const { validData, ticks, xAxisColumn, selectedDatasets } = getValidDataAndTicks(
      datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the dataMapper
    const mappedPoints = dataMapper(
      validData,
      xAxisColumn,
      {
        ticks,
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
      if (x === 0) return 0;
      return regressionResult.predict(x)[1];
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
          {
            key: 'value',
            value: TypeToLabel[trendline.type]
          }
        ]
      }
    ];
  },

  exponential_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const { validData, ticks, xAxisColumn, selectedDatasets } = getValidDataAndTicks(
      datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the dataMapper
    const mappedPoints = dataMapper(
      validData,
      xAxisColumn,
      {
        ticks,
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
          {
            key: 'value',
            value: TypeToLabel[trendline.type]
          }
        ]
      }
    ];
  },

  linear_regression: (trendline, datasetsWithTicks, columnLabelFormats) => {
    const datasets = datasetsWithTicks.datasets;
    const { validData, ticks, xAxisColumn, selectedDatasets } = getValidDataAndTicks(
      datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    console.log('linear_regression', {
      datasets,
      datasetsWithTicks,
      validData,
      ticks,
      xAxisColumn,
      selectedDatasets
    });

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    // Get mapped data points using the updated dataMapper
    const mappedPoints = dataMapper(
      validData,
      xAxisColumn,
      {
        ticks: ticks,
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
          {
            key: 'value',
            value: TypeToLabel[trendline.type]
          }
        ]
      }
    ];
  },

  average: (trendline, datasetsWithTicks) => {
    const { validData, selectedDatasets } = getValidDataAndTicks(
      datasetsWithTicks.datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    // Sum all valid values and divide by the count
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
        label: [{ key: 'value', value: average }],
        data: [average],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: average }]]
      }
    ];
  },

  min: (trendline, datasetsWithTicks) => {
    const { validData, selectedDatasets } = getValidDataAndTicks(
      datasetsWithTicks.datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    // Use the first valid value as initial accumulator
    const min = validData.reduce<number>((acc, datapoint) => {
      return Math.min(acc, datapoint as number);
    }, validData[0] as number);

    return [
      {
        ...trendline,
        id: DATASET_IDS.min(trendline.columnId),
        label: [{ key: 'value', value: min }],
        data: [min],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: min }]]
      }
    ];
  },

  max: (trendline, datasetsWithTicks) => {
    const { validData, selectedDatasets } = getValidDataAndTicks(
      datasetsWithTicks.datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    // Use the first valid value as initial accumulator
    const max = validData.reduce<number>((acc, datapoint) => {
      return Math.max(acc, datapoint as number);
    }, validData[0] as number);

    return [
      {
        ...trendline,
        id: DATASET_IDS.max(trendline.columnId),
        label: [{ key: 'value', value: max }],
        data: [max],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: max }]]
      }
    ];
  },

  median: (trendline, datasetsWithTicks) => {
    const { validData, selectedDatasets } = getValidDataAndTicks(
      datasetsWithTicks.datasets,
      trendline,
      datasetsWithTicks.ticks
    );

    if (!selectedDatasets || selectedDatasets.length === 0 || validData.length === 0) return [];

    // Sort the data and get the middle value
    const sortedData = [...validData].sort((a, b) => (a as number) - (b as number));

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
        label: [{ key: 'value', value: median }],
        data: [median],
        dataKey: trendline.columnId,
        axisType: 'y',
        tooltipData: [[{ key: 'value', value: median }]]
      }
    ];
  }
};

const getValidDataAndTicks = (
  datasets: DatasetOptionsWithTicks['datasets'],
  trendline: Trendline,
  datasetTicks: DatasetOptionsWithTicks['ticks']
) => {
  const selectedDatasets =
    datasets?.filter((dataset) => dataset.dataKey === trendline.columnId) || [];
  const xAxisColumn = selectedDatasets[0]?.dataKey;

  // If there's only one dataset, we can skip sorting
  if (selectedDatasets.length === 1) {
    const dataset = selectedDatasets[0];
    const validData: number[] = [];
    const ticks: (string | number)[][] = [];

    dataset.data.forEach((value, index) => {
      const isValidData = value !== null && value !== undefined;

      const associatedTick = dataset.ticksForScatter?.[index] || datasetTicks?.[index];

      if (isValidData) {
        validData.push(value as number);
        if (associatedTick !== undefined) ticks.push(associatedTick);
      }
    });

    return { validData, ticks, selectedDatasets, xAxisColumn };
  }

  // For multiple datasets, collect and sort pairs
  const pairs = selectedDatasets.reduce<Array<[(string | number)[], number]>>((acc, dataset) => {
    dataset.data.forEach((value, index) => {
      const isValidData = value !== null && value !== undefined;
      const associatedTick = dataset.ticksForScatter?.[index] || datasetTicks?.[index];

      if (isValidData && associatedTick !== undefined) {
        acc.push([associatedTick, value as number]);
      }
    });
    return acc;
  }, []);

  // Sort pairs based on tick values
  pairs.sort(([tickA], [tickB]) => {
    const a = Array.isArray(tickA) ? tickA[0] : tickA;
    const b = Array.isArray(tickB) ? tickB[0] : tickB;
    return (a as number) - (b as number);
  });

  // Separate sorted pairs back into ticks and values
  const sortedTicks = pairs.map(([tick]) => tick);
  const sortedValues = pairs.map(([_, value]) => value);

  return {
    validData: sortedValues,
    ticks: sortedTicks,
    selectedDatasets,
    xAxisColumn
  };
};
