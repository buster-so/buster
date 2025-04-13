import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric/charts';
import type { DatasetOption } from '../interfaces';
import type { TrendlineDataset } from './trendlineDataset.types';
import { polyExpoRegressionDataMapper } from './polyExpoRegressionDataMapper';
import {
  calculateExponentialRegression,
  calculateLinearSlope,
  calculateLogarithmicRegression,
  calculatePolynomialRegression
} from '@/lib/regression';
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
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const dimensions = selectedDataset.dimensions as string[];
    const { mappedData, indexOfTrendlineColumn } = polyExpoRegressionDataMapper(
      trendline,
      selectedDataset,
      columnLabelFormats
    );

    if (indexOfTrendlineColumn === undefined) return [];
    const { equation, slopeData } = calculatePolynomialRegression(mappedData);
    const mappedSource = [...source].map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = slopeData![index];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.polynomialRegression(trendline.columnId),
        source: mappedSource,
        dimensions: dimensions,
        equation
      }
    ];
  },
  //done
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

  exponential_regression: (trendline, rawDataset, columnLabelFormats) => {
    const source = rawDataset.source as Array<[string, ...number[]]>;
    const dimensions = rawDataset.dimensions as string[];
    const { mappedData, indexOfTrendlineColumn } = polyExpoRegressionDataMapper(
      trendline,
      rawDataset,
      columnLabelFormats
    );
    if (indexOfTrendlineColumn === undefined || indexOfTrendlineColumn === -1) return [];
    const { equation, slopeData } = calculateExponentialRegression(mappedData);
    const mappedSource = [...source].map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = slopeData[index];
      return newItem;
    });

    return [
      {
        ...trendline,
        id: DATASET_IDS.exponentialRegression(trendline.columnId),
        source: mappedSource,
        dimensions: dimensions,
        equation
      }
    ];
  },
  //done
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
