import { formatLabel } from '@/utils/columnFormatter';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';
import type { ColumnMetaData } from '@/api/buster_rest';
import { formatChartLabelDelimiter } from './labelHelpers';
import type { ChartEncodes, BusterChartProps, BarAndLineAxis, ScatterAxis } from '../interfaces';
import { ChartType } from '../interfaces';

export const AXIS_TITLE_SEPARATOR = ' | ';

export const formatXAxisLabel = (
  value: string | number,
  selectedAxis: ChartEncodes,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  xAxisColumnMetadata: ColumnMetaData | undefined,
  selectedChartType: ChartType
) => {
  //scatter chart will have a number value
  if (isNumber(value) || selectedChartType === ChartType.Scatter) {
    //we can assumed there is only one x-axis
    const assosciatedColumnFormat = columnLabelFormats[selectedAxis.x[0]];
    const maxValue = xAxisColumnMetadata?.max_value ?? 0;
    const minValue = xAxisColumnMetadata?.min_value ?? 0;

    let shouldCompactNumbers = false;

    if (typeof maxValue === 'number' && typeof minValue === 'number') {
      // For x-axis ticks, use compact numbers if the range is large enough to warrant it
      const range = maxValue - minValue;
      shouldCompactNumbers = range > 1000 || maxValue > 1000;
    }

    return formatLabel(value, { ...assosciatedColumnFormat, compactNumbers: shouldCompactNumbers });
  }

  return formatChartLabelDelimiter(value, columnLabelFormats);
};

export const formatYAxisLabel = (
  value: string | number,
  axisColumnNames: string[],
  canUseSameFormatter: boolean,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  usePercentageModeAxis: boolean,
  compactNumbers: boolean = true
) => {
  if (usePercentageModeAxis) {
    return formatLabel(value, { columnType: 'number', style: 'percent' }, false);
  }

  if (canUseSameFormatter) {
    const firstYAxis = axisColumnNames[0];
    const columnFormat = columnLabelFormats[firstYAxis];
    return formatLabel(value, { ...columnFormat, compactNumbers }, false);
  }

  return formatLabel(
    value,
    {
      columnType: 'number',
      style: 'number',
      compactNumbers
    },
    false
  );
};

export const yAxisSimilar = (
  yAxis: BarAndLineAxis['y'] | ScatterAxis['y'],
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): boolean => {
  const variablesToCheck = yAxis.map((y) => {
    const columnFormat = columnLabelFormats[y];
    return pick(columnFormat, ['style', 'currency']);
  });

  // Check if all variables have the same format by comparing with first item
  return variablesToCheck.every((format) => {
    return isEqual(format, variablesToCheck[0]);
  });
};
