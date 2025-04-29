import { type BusterChartProps, type ScatterAxis } from '@/api/asset_interfaces/metric/charts';
import { createDimension } from './datasetHelpers_BarLinePie';
import { appendToKeyValueChain } from './groupingHelpers';
import { DatasetOption } from './interfaces';
import { randomSampling } from '@/lib/downsample';
import { DOWNSIZE_SAMPLE_THRESHOLD } from '../../config';

type DataItem = NonNullable<BusterChartProps['data']>[number];

export const downsampleScatterData = (data: NonNullable<BusterChartProps['data']>) => {
  return randomSampling(data, DOWNSIZE_SAMPLE_THRESHOLD);
};

export const mapScatterData = (
  sortedData: NonNullable<BusterChartProps['data']>,
  categoryFields: string[]
) => {
  const xValuesSet = new Set<string>(); // Stores unique X-axis values
  const categoriesSet = new Set<string>(); // Stores unique category values
  const dataMap = new Map<string | number, Record<string, string | number | Date>>(); // Stores data points in format: "xValue|category" => measures

  if (categoryFields.length === 0) {
    return sortedData.map((item) => ({
      x: item[0],
      y: item[1]
    }));
  }

  return { dataMap, xValuesSet, categoriesSet };
};

export const processScatterData = (
  data: NonNullable<BusterChartProps['data']>,
  xAxisField: string,
  measureFields: string[],
  categoryFields: string[],
  sizeFieldArray: ScatterAxis['size'],
  tooltipFields: string[],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): (string | number | null)[][] => {
  const processedData: (string | number | null)[][] = [];
  const sizeField = sizeFieldArray?.[0];
  const dedupedTooltipFields = [
    ...new Set(
      [xAxisField, ...measureFields, ...categoryFields, sizeField, ...tooltipFields].filter(
        Boolean
      ) as string[]
    )
  ];

  console.log('dedupedTooltipFields', dedupedTooltipFields);

  const defaultReplaceMissingDataWith = null; //null is the default for scatter charts

  data.forEach((item) => {
    const row: (string | number | null)[] = [];

    dedupedTooltipFields.forEach((measure) => {
      const replaceMissingDataWith = defaultReplaceMissingDataWith;

      const value = item[measure] || replaceMissingDataWith;
      row.push(value as string | number);
    });

    processedData.push(row);
  });

  return processedData;
};

export const getScatterDimensions = (
  categoryFields: string[],
  xAxisField: string,
  measureFields: string[],
  sizeField: ScatterAxis['size'] = []
): string[] => {
  const categories = Array.from(categoryFields);
  const xField = appendToKeyValueChain({ key: xAxisField, value: '' });
  const dimensions = [
    xField,
    ...measureFields.map((field) => appendToKeyValueChain({ key: field, value: '' }))
  ];
  if (sizeField && sizeField.length) {
    const sizeFieldDimension = appendToKeyValueChain({ key: sizeField[0], value: '' });
    dimensions.push(sizeFieldDimension);
  }
  if (categories.length) {
    dimensions.push(...categories.map((field) => appendToKeyValueChain({ key: field, value: '' })));
  }
  return dimensions;
};

export const getScatterTooltipKeys = (
  tooltipFields: string[],
  xAxisField: string,
  categoryFields: string[],
  measureFields: string[],
  sizeFieldArray: ScatterAxis['size']
) => {
  console.log('getScatterTooltipKeys', {
    tooltipFields,
    xAxisField,
    categoryFields,
    measureFields,
    sizeFieldArray
  });
  const hasTooltipFields = tooltipFields.length > 0;
  const fieldsToUse = [...(hasTooltipFields ? tooltipFields : measureFields)];
  if (!hasTooltipFields) {
    fieldsToUse.push(xAxisField);

    const sizeField = sizeFieldArray?.[0];
    if (sizeField) fieldsToUse.push(sizeField);
  }

  return fieldsToUse;
};

export const getScatterDatasetOptions = (
  processedData: (string | number | Date | null)[][],
  dimensions: string[]
): DatasetOption[] => {
  return [
    {
      id: 'scatter-dataset',
      dimensions,
      source: processedData
    }
  ];
};
