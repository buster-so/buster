import { formatLabel } from '@/lib/columnFormatter';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import { JOIN_CHARACTER } from './labelHelpers';
import {
  type BusterChartProps,
  type BarAndLineAxis,
  type ScatterAxis
} from '@/api/asset_interfaces/metric/charts';

export const AXIS_TITLE_SEPARATOR = JOIN_CHARACTER;

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
