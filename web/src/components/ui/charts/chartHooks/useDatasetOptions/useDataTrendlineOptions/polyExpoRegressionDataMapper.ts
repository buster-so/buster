import type { Trendline, BusterChartProps } from '@/api/asset_interfaces/metric';
import { createDayjsDate } from '@/lib/date';
import { calculateExponentialRegression } from '@/lib/regression';
import { extractFieldsFromChain } from '../groupingHelpers';
import type { DatasetOption } from '../interfaces';
import { isDateColumnType } from '@/lib/messages';

export const polyExpoRegressionDataMapper = (
  trendline: Trendline,
  rawDataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): {
  mappedData: Parameters<typeof calculateExponentialRegression>[0];
  indexOfTrendlineColumn: number | undefined;
} => {
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
