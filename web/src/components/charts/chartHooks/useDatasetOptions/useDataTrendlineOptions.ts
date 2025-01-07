import {
  ChartEncodes,
  ChartType,
  IColumnLabelFormat,
  Trendline
} from '@/components/charts/interfaces';
import { useMemo } from 'react';
import { DATASET_IDS } from './config';
import {
  calculateExponentialRegression,
  calculateLinearSlope,
  calculateLogarithmicRegression,
  calculatePolynomialRegression,
  calculateLinearRegression,
  isDateColumnType,
  isNumericColumnType,
  createDayjsDate,
  DataFrameOperations,
  calculateLinearSlopeByDate
} from '@/utils';
import { extractFieldsFromChain } from './groupingHelpers';
import last from 'lodash/last';
import { DatasetOption } from './interfaces';

export const useDataTrendlineOptions = ({
  datasetOptions,
  trendlines,
  selectedAxis,
  selectedChartType,
  columnLabelFormats
}: {
  datasetOptions: DatasetOption[] | undefined;
  trendlines: Trendline[] | undefined;
  selectedChartType: ChartType;
  selectedAxis: ChartEncodes;
  columnLabelFormats: Record<string, IColumnLabelFormat>;
}) => {
  const hasTrendlines = trendlines && trendlines.length > 0;

  const canSupportTrendlines: boolean = useMemo(() => {
    if (!hasTrendlines) return false;
    const isValidChartType =
      selectedChartType === ChartType.Line ||
      selectedChartType === ChartType.Bar ||
      selectedChartType === ChartType.Scatter ||
      selectedChartType === ChartType.Combo;

    return isValidChartType;
  }, [selectedChartType, hasTrendlines, selectedAxis, trendlines?.length]);

  const lastDataset = useMemo(() => {
    if (!datasetOptions || !canSupportTrendlines) return undefined;
    return last(datasetOptions);
  }, [datasetOptions, canSupportTrendlines]);

  const selectedDataset = useMemo(() => {
    if (!lastDataset) return undefined;
    const newDataset = { ...lastDataset };

    //we need to convert all dates to numbers
    let newSource = [...(newDataset.source as Array<[string | number, ...number[]]>)];

    const sorted = newSource.sort((a, b) => {
      const aValue = a[0];
      const bValue = b[0];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      return 0;
    });
    return { ...newDataset, source: sorted };
  }, [lastDataset]);

  const datasetTrendlineOptions: TrendlineDataset[] = useMemo(() => {
    if (!hasTrendlines || !datasetOptions || !selectedDataset) return [] as TrendlineDataset[];

    const trendlineDatasets: TrendlineDataset[] = [];

    trendlines?.forEach((trendline) => {
      try {
        if (!canSupportTrendlineRecord[trendline.type](columnLabelFormats, trendline)) return;
        const trendlineDataset = trendlineDatasetCreator[trendline.type](
          trendline,
          selectedDataset,
          columnLabelFormats
        );

        trendlineDatasets.push(...trendlineDataset);
      } catch (error) {
        console.error(error);
      }
    });

    return trendlineDatasets;
  }, [selectedDataset, trendlines, hasTrendlines]);

  return datasetTrendlineOptions;
};

const trendlineDatasetCreator: Record<
  Trendline['type'],
  (
    trendline: Trendline,
    rawDataset: DatasetOption,
    columnLabelFormats: Record<string, IColumnLabelFormat>
  ) => TrendlineDataset[]
> = {
  logarithmic_regression: (trendline, rawDataset, columnLabelFormats) => {
    const source = rawDataset.source as Array<[string, ...number[]]>;
    const dimensions = rawDataset.dimensions as string[];
    const { mappedData, indexOfTrendlineColumn } = polyExpoRegressionDataMapper(
      trendline,
      rawDataset,
      columnLabelFormats
    );
    if (indexOfTrendlineColumn === undefined) return [];
    const { equation, slopeData } = calculateLogarithmicRegression(mappedData);
    const mappedSource = [...source].map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = slopeData[index];
      return newItem;
    });
    return [
      {
        ...trendline,
        id: DATASET_IDS.logarithmicRegression(trendline.columnId),
        source: mappedSource,
        dimensions: dimensions,
        equation
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
  linear_regression: (trendline, selectedDataset, columnLabelFormats) => {
    const source = selectedDataset.source as Array<[string, ...number[]]>;
    const dimensions = selectedDataset.dimensions as string[];
    const xAxisColumn = dimensions[0];
    const isXAxisNumeric = isNumericColumnType(columnLabelFormats[xAxisColumn]?.columnType);

    if (isXAxisNumeric) {
      const { mappedData, indexOfTrendlineColumn } = polyExpoRegressionDataMapper(
        trendline,
        selectedDataset,
        columnLabelFormats
      );

      if (indexOfTrendlineColumn === undefined) return [];

      const { slopeData, equation } = calculateLinearRegression(mappedData);
      const mappedSource = [...source].map((item, index) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = slopeData[index];
        return newItem;
      });

      return [
        {
          ...trendline,
          id: DATASET_IDS.linearRegression(trendline.columnId),
          source: mappedSource,
          dimensions: dimensions,
          equation
        }
      ];
    }

    const isXAxisDate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
    const indexOfTrendlineColumn = selectedDataset.dimensions!.findIndex(
      (dimensionUnDeliminated) => {
        const { key } = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
        return key === trendline.columnId;
      }
    );
    const mappedData = source.map((item) => item[indexOfTrendlineColumn] as number);

    if (isXAxisDate) {
      const dates = source.map((item) => item[0] as string);
      const { slopeData, equation } = calculateLinearSlopeByDate(mappedData, dates);
      const mappedSource = [...source].map((item, index) => {
        const newItem = [...item];
        newItem[indexOfTrendlineColumn] = slopeData[index];
        return newItem;
      });
      return [
        {
          ...trendline,
          id: DATASET_IDS.linearSlope(trendline.columnId),
          source: mappedSource,
          dimensions: dimensions,
          equation
        }
      ];
    }

    //if the x axis is not numeric, then we need to use the linear trendline
    const { slopeData, equation } = calculateLinearSlope(mappedData);
    const mappedSource = [...source].map((item, index) => {
      const newItem = [...item];
      newItem[indexOfTrendlineColumn] = slopeData[index];
      return newItem;
    });
    return [
      {
        ...trendline,
        id: DATASET_IDS.linearSlope(trendline.columnId),
        source: mappedSource,
        dimensions,
        equation
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

const canSupportTrendlineRecord: Record<
  Trendline['type'],
  (columnLabelFormats: Record<string, IColumnLabelFormat>, trendline: Trendline) => boolean
> = {
  linear_regression: (columnLabelFormats, trendline) => {
    return isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType);
  },
  logarithmic_regression: (columnLabelFormats, trendline) => {
    return isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType);
  },
  exponential_regression: (columnLabelFormats, trendline) => {
    return isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType);
  },
  polynomial_regression: (columnLabelFormats, trendline) => {
    return isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType);
  },
  min: (columnLabelFormats, trendline) =>
    isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType),
  max: (columnLabelFormats, trendline) =>
    isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType),
  median: (columnLabelFormats, trendline) =>
    isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType),
  average: (columnLabelFormats, trendline) =>
    isNumericColumnType(columnLabelFormats[trendline.columnId]?.columnType)
};

const polyExpoRegressionDataMapper = (
  trendline: Trendline,
  rawDataset: DatasetOption,
  columnLabelFormats: Record<string, IColumnLabelFormat>
) => {
  const source = rawDataset.source as Array<[string | number, ...number[]]>;
  const dimensions = rawDataset.dimensions as string[];
  const xAxisColumn = dimensions[0];
  const xAxisIsADate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);
  const indexOfTrendlineColumn = rawDataset.dimensions?.findIndex((dimensionUnDeliminated) => {
    const extracted = extractFieldsFromChain(dimensionUnDeliminated as string)[0];
    const key = extracted?.key || dimensionUnDeliminated; //if there is not category, then we use the dimensionUnDeliminated
    return key === trendline.columnId;
  });

  const indexOfXAxisColumn = 0;

  if (indexOfTrendlineColumn === undefined || indexOfTrendlineColumn === -1) {
    return {
      mappedData: [],
      indexOfTrendlineColumn: undefined
    };
  }

  //WE CAN ONLY SUPPORT ONE FIELD FOR THE X AXIS

  const xAxisTransformer = (x: string | number) => {
    if (typeof x === 'number') return x; //if there is no category this will be raw?
    const { key, value } = extractFieldsFromChain(x)[0];
    if (xAxisIsADate) {
      return createDayjsDate(value || (x as string)).valueOf();
    }
    return parseInt(value);
  };
  const mappedData: Parameters<typeof calculateExponentialRegression>[0] = source.map((item) => {
    return {
      x: xAxisTransformer(item[indexOfXAxisColumn]),
      y: Number(item[indexOfTrendlineColumn])
    };
  });

  return { mappedData, indexOfTrendlineColumn };
};

export type TrendlineDataset = DatasetOption & {
  equation?: string;
} & Trendline;
