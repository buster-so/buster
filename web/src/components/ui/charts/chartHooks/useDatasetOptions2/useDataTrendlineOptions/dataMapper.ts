import type { BusterChartProps } from '@/api/asset_interfaces/metric';
import type { DatasetOption } from '../interfaces';
import { isDateColumnType } from '@/lib/messages';
import { extractFieldsFromChain } from '../groupingHelpers';
import { createDayjsDate } from '@/lib/date';

export const dataMapper = (
  rawDataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  convertFrom: 'date' | 'number' | 'string' = 'number'
): {
  mappedData: [number, number][];
} => {
  const xAxisColumn = rawDataset.dataKey;
  const xAxisIsADate = isDateColumnType(columnLabelFormats[xAxisColumn]?.columnType);

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

  const mappedData: [number, number][] = rawDataset.data.map((datapoint, index) => {
    const label = rawDataset.label[index];
    const labelValue = label[0].value;
    const xAxisValue = xAxisTransformer(labelValue || '', index);

    return [xAxisValue, Number(datapoint || 0)];
  });

  return {
    mappedData
  };
};
