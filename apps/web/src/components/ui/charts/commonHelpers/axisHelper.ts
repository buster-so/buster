import { formatLabel } from '@/lib/columnFormatter';
import type { BarAndLineAxis, ScatterAxis } from '@buster/server-shared/metrics';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import type { BusterChartProps } from '../BusterChart.types';

export const formatYAxisLabel = (
  value: string | number,
  axisColumnNames: string[],
  canUseSameFormatter: boolean,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  usePercentageModeAxis: boolean,
  compactNumbers = true
) => {
  if (usePercentageModeAxis) {
    return formatLabel(value, { columnType: 'number', style: 'percent' }, false);
  }

  if (canUseSameFormatter) {
    const firstYAxis = axisColumnNames[0] || '';
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
