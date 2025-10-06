import {
  type ColumnLabelFormat,
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_DATE_FORMAT_QUARTER,
} from '@buster/server-shared/metrics';
import { JOIN_CHARACTER_DATE } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import { createDayjsDate } from '@/lib/date';

export const createTickDates = (
  ticks: (string | number)[][],
  xAxisKeys: string[],
  columnLabelFormats: Record<string, ColumnLabelFormat>
): (Date | string)[] | null => {
  const xColumnLabelFormats = xAxisKeys.map(
    (key) => columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT
  );
  const useDateLabels = xColumnLabelFormats.some(
    (format) =>
      (format.columnType === 'date' && format.style === 'date') ||
      (format.columnType === 'number' && format.style === 'date')
  );

  if (!useDateLabels) {
    return null;
  }

  const isSingleXAxis = xAxisKeys.length === 1;

  //most common case
  if (isSingleXAxis) {
    const isAQuarter = xColumnLabelFormats.findIndex(
      (format) => format.convertNumberTo === 'quarter' && format.columnType === 'number'
    );
    if (isAQuarter !== -1) {
      return createQuarterTickDates(ticks, xColumnLabelFormats, isAQuarter);
    }

    const dateTicks = ticks.flatMap((item) => {
      return item.map<Date>((item) => {
        return createDayjsDate(item as string).toDate(); //do not join because it will turn into a string
      });
    });
    return dateTicks;
  }

  const isDoubleXAxis = xAxisKeys.length === 2;
  console.log('isDoubleXAxis', isDoubleXAxis);
  if (isDoubleXAxis) {
    const oneIsAQuarter = xColumnLabelFormats.findIndex(
      (format) => format.convertNumberTo === 'quarter' && format.columnType === 'number'
    );
    const oneIsANumber = xColumnLabelFormats.findIndex(
      (format) => format.columnType === 'number' && format.style === 'number'
    );
    console.log('oneIsAQuarter', oneIsAQuarter);
    console.log('oneIsANumber', oneIsANumber);
    if (oneIsAQuarter !== -1 && oneIsANumber !== -1) {
      return createQuarterTickDates(ticks, xColumnLabelFormats, oneIsAQuarter);
    }
  }

  return null;
};

const createQuarterTickDates = (
  ticks: (string | number)[][],
  xColumnLabelFormats: ColumnLabelFormat[],
  indexOfQuarter: number
) => {
  return ticks.flatMap((tickItem) => {
    return tickItem
      .map((item, index) => {
        if (index === indexOfQuarter) {
          // Replace the Q that's not in brackets with the quarter number
          // Format is '[Q]Q' - keep [Q] literal, replace the second Q
          // Then remove the brackets to get clean output like Q1, Q2, etc.
          return DEFAULT_DATE_FORMAT_QUARTER.replace(/(?<!\[)Q(?!\])/g, String(item)).replace(
            /[[\]]/g,
            ''
          );
        }
        return formatLabel(item, xColumnLabelFormats[index]);
      })
      .join(JOIN_CHARACTER_DATE);
  });
};
