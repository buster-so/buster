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
    rawDataset: DatasetOption,
    columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
  ) => TrendlineDataset[]
> = {
  polynomial_regression: (trendline, selectedDataset, columnLabelFormats) => {
    const dimensions = selectedDataset.dimensions as string[];
    const xAxisColumn = dimensions[0];
    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    const { mappedData, indexOfTrendlineColumn } = dataMapper(
      trendline,
      selectedDataset,
      columnLabelFormats,
      isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    );

    if (indexOfTrendlineColumn === undefined) return [];

    if (isXAxisNumeric) {
      const regressionResult = regression.polynomial(mappedData, { order: 2, precision: 2 });
      const data = mappedData.map((item) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.polynomialRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    if (isXAxisDate) {
      const firstTimestamp = mappedData[0][0];
      // Convert timestamps to days since first timestamp for better numerical stability
      const regressionResult = regression.polynomial(
        mappedData.map(([timestamp, value]) => [
          (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24),
          value
        ]),
        { order: 2, precision: 2 }
      );

      const data = mappedData.map((item) => {
        const newItem = [...item];
        const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24);
        newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.polynomialRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    // For non-numeric, non-date x-axis, use indices
    const regressionResult = regression.polynomial(
      mappedData.map((item, index) => [index, item[1]]),
      { order: 2, precision: 2 }
    );

    const data = mappedData.map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = regressionResult.predict(index)[1];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.polynomialRegression(trendline.columnId),
        source: data,
        dimensions: dimensions,
        equation: regressionResult.string
      }
    ];
  },

  logarithmic_regression: (trendline, selectedDataset, columnLabelFormats) => {
    const dimensions = selectedDataset.dimensions as string[];
    const xAxisColumn = dimensions[0];
    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    const { mappedData, indexOfTrendlineColumn } = dataMapper(
      trendline,
      selectedDataset,
      columnLabelFormats,
      isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    );

    if (indexOfTrendlineColumn === undefined) return [];

    if (isXAxisNumeric) {
      // For numeric x-axis, ensure all x values are positive
      const minX = Math.min(...mappedData.map(([x]) => x));
      if (minX <= 0) {
        // Shift all x values to be positive
        const shift = Math.abs(minX) + 1;
        mappedData.forEach((item) => (item[0] += shift));
      }

      const regressionResult = regression.logarithmic(mappedData, { precision: 2 });
      const data = mappedData.map((item) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.logarithmicRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    if (isXAxisDate) {
      const firstTimestamp = mappedData[0][0];
      // Start from day 1 instead of day 0 to avoid log(0)
      const regressionResult = regression.logarithmic(
        mappedData.map(([timestamp, value]) => [
          // Convert timestamp to days since first timestamp, starting from 1
          (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24) + 1,
          value
        ]),
        { precision: 2 }
      );

      const data = mappedData.map((item) => {
        const newItem = [...item];
        const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24) + 1;
        newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.logarithmicRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    const regressionResult = regression.logarithmic(
      mappedData.map(([x, y]) => [x + 1, y]),
      {
        precision: 2
      }
    );
    const data = mappedData.map((item) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0] + 1)[1];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.logarithmicRegression(trendline.columnId),
        source: data,
        dimensions: dimensions,
        equation: regressionResult.string
      }
    ];
  },

  exponential_regression: (trendline, selectedDataset, columnLabelFormats) => {
    const dimensions = selectedDataset.dimensions as string[];
    const xAxisColumn = dimensions[0];
    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    const { mappedData, indexOfTrendlineColumn } = dataMapper(
      trendline,
      selectedDataset,
      columnLabelFormats,
      isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    );

    if (indexOfTrendlineColumn === undefined) return [];

    // Ensure all y values are positive for exponential regression
    const minY = Math.min(...mappedData.map(([_, y]) => y));
    if (minY <= 0) {
      // If we have zero or negative values, shift all y values up by |minY| + 1
      const shift = Math.abs(minY) + 1;
      mappedData.forEach((item) => (item[1] += shift));
    }

    if (isXAxisNumeric) {
      // For numeric x-axis, normalize x values to start from 1 to enhance exponential fit
      const minX = Math.min(...mappedData.map(([x]) => x));
      const normalizedData: [number, number][] = mappedData.map(([x, y]) => [x - minX + 1, y]);

      const regressionResult = regression.exponential(normalizedData, { precision: 6 });

      const data = mappedData.map((item, index) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = regressionResult.predict(normalizedData[index][0])[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.exponentialRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    if (isXAxisDate) {
      const firstTimestamp = mappedData[0][0];
      // Convert to days and ensure we start from day 1 (not day 0)
      const normalizedData: [number, number][] = mappedData.map(([timestamp, value]) => [
        (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24) + 1,
        value
      ]);

      const regressionResult = regression.exponential(normalizedData, { precision: 6 });

      const data = mappedData.map((item) => {
        const newItem = [...item];
        const days = (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24) + 1;
        newItem[indexOfTrendlineColumn] = regressionResult.predict(days)[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.exponentialRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    // For non-numeric, non-date x-axis, use indices starting from 1
    const normalizedData: [number, number][] = mappedData.map((item, index) => [
      index + 1,
      item[1]
    ]);
    const regressionResult = regression.exponential(normalizedData, { precision: 6 });

    const data = mappedData.map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = regressionResult.predict(index + 1)[1];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.exponentialRegression(trendline.columnId),
        source: data,
        dimensions,
        equation: regressionResult.string
      }
    ];
  },

  linear_regression: (trendline, selectedDataset, columnLabelFormats) => {
    const dimensions = selectedDataset.dimensions as string[];
    const xAxisColumn = dimensions[0];
    const isXAxisNumeric = isNumericColumnType(
      columnLabelFormats[xAxisColumn]?.columnType || DEFAULT_COLUMN_LABEL_FORMAT.columnType
    );
    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    const { mappedData, indexOfTrendlineColumn } = dataMapper(
      trendline,
      selectedDataset,
      columnLabelFormats,
      isXAxisNumeric ? 'number' : isXAxisDate ? 'date' : 'string'
    );

    if (indexOfTrendlineColumn === undefined) return [];

    if (isXAxisNumeric) {
      if (indexOfTrendlineColumn === undefined) return [];

      const regressionResult = regression.linear(mappedData, { precision: 2 });

      const data = mappedData.map((item) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.linearRegression(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    if (isXAxisDate) {
      const firstTimestamp = mappedData[0][0];
      const regressionResult = regression.linear(
        mappedData.map(([timestamp, value]) => [
          // Convert timestamp to days since first timestamp
          (timestamp - firstTimestamp) / (1000 * 60 * 60 * 24),
          value
        ]),
        { precision: 2 }
      );
      const data = mappedData.map((item) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = regressionResult.predict(
          (item[0] - firstTimestamp) / (1000 * 60 * 60 * 24)
        )[1];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.linearSlope(trendline.columnId),
          source: data,
          dimensions: dimensions,
          equation: regressionResult.string
        }
      ];
    }

    const regressionResult = regression.linear(mappedData, { precision: 2 });
    const data = mappedData.map((item) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = regressionResult.predict(item[0])[1];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.linearSlope(trendline.columnId),
        source: data,
        dimensions,
        equation: regressionResult.string
      }
    ];
  },
  average: (trendline, selectedDataset) => {
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const indexOfTrendlineColumn = selectedDataset.dimensions!.findIndex(
      (dimensionUnDeliminated) => {
        const { key } = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
        return key === trendline.columnId;
      }
    );
    const dataFrame = new DataFrameOperations(source, indexOfTrendlineColumn);
    const average = dataFrame.average();
    return [
      {
        ...trendline,
        id: DATASET_IDS.average(trendline.columnId),
        source: [[average]],
        dimensions: []
      }
    ];
  },
  min: (trendline, selectedDataset) => {
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const indexOfTrendlineColumn = selectedDataset.dimensions!.findIndex(
      (dimensionUnDeliminated) => {
        const { key } = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
        return key === trendline.columnId;
      }
    );
    const dataFrame = new DataFrameOperations(source, indexOfTrendlineColumn);
    const min = dataFrame.min();

    return [
      {
        ...trendline,
        id: DATASET_IDS.min(trendline.columnId),
        source: [[min]],
        dimensions: []
      }
    ];
  },
  max: (trendline, selectedDataset) => {
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const indexOfTrendlineColumn = selectedDataset.dimensions!.findIndex(
      (dimensionUnDeliminated) => {
        const { key } = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
        return key === trendline.columnId;
      }
    );
    const dataFrame = new DataFrameOperations(source, indexOfTrendlineColumn);
    const max = dataFrame.max();
    return [
      {
        ...trendline,
        id: DATASET_IDS.max(trendline.columnId),
        source: [[max]],
        dimensions: []
      }
    ];
  },
  median: (trendline, selectedDataset) => {
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const indexOfTrendlineColumn = selectedDataset.dimensions!.findIndex(
      (dimensionUnDeliminated) => {
        const { key } = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
        return key === trendline.columnId;
      }
    );
    const dataFrame = new DataFrameOperations(source, indexOfTrendlineColumn);
    const median = dataFrame.median();
    return [
      {
        ...trendline,
        id: DATASET_IDS.median(trendline.columnId),
        source: [[median]],
        dimensions: []
      }
    ];
  }
};
