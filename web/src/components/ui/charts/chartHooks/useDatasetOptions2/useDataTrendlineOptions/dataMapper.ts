import type { BusterChartProps, Trendline } from '@/api/asset_interfaces/metric';
import type { DatasetOption } from '../interfaces';
import { isDateColumnType } from '@/lib/messages';
import { extractFieldsFromChain } from '../groupingHelpers';
import { createDayjsDate } from '@/lib/date';

export const dataMapper = (
  trendline: Trendline,
  rawDataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  convertFrom: 'date' | 'number' | 'string' = 'number'
): {
  mappedData: [number, number][];
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

  const xAxisTransformer = (x: string | number, index: number): number => {
    if (typeof x === 'number') return x; //if there is no category this will be raw?
    const { key, value } = extractFieldsFromChain(x)[0];
    if (xAxisIsADate || convertFrom === 'date') {
      return createDayjsDate(value || (x as string)).valueOf();
    }
    if (convertFrom === 'number') {
      return parseFloat(value);
    }
    if (convertFrom === 'string') {
      return index;
    }
    return parseInt(value);
  };

  return {
    mappedData: source.map<[number, number]>((item, index) => {
      return [
        xAxisTransformer(item[indexOfXAxisColumn], index),
        Number(item[indexOfTrendlineColumn])
      ];
    }),
    indexOfTrendlineColumn
  };
};
