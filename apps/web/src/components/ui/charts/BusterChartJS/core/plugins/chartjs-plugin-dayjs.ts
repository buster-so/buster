import type { TimeUnit } from 'chart.js';
import { _adapters } from 'chart.js';
import dayjs, { type QUnitType } from 'dayjs';
// Needed to handle quarter format
import AdvancedFormat from 'dayjs/plugin/advancedFormat.js';
// Needed to handle the custom parsing
import CustomParseFormat from 'dayjs/plugin/customParseFormat.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';

// Needed to handle localization format
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js';
// Needed to handle adding/subtracting quarter
import QuarterOfYear from 'dayjs/plugin/quarterOfYear.js';

dayjs.extend(AdvancedFormat);

dayjs.extend(QuarterOfYear);

dayjs.extend(LocalizedFormat);

dayjs.extend(CustomParseFormat);

dayjs.extend(isoWeek);

const FORMATS = {
  datetime: 'MMM D, YYYY, h:mm:ss a',
  millisecond: 'h:mm:ss.SSS a',
  second: 'h:mm:ss a',
  minute: 'h:mm a',
  hour: 'hA',
  day: 'MMM D',
  week: 'll',
  month: 'MMM YYYY',
  quarter: '[Q]Q YYYY',
  year: 'YYYY',
};

_adapters._date.override({
  //_id: 'dayjs', //DEBUG,
  formats: () => FORMATS,
  parse: (value: unknown, format?: TimeUnit) => {
    const valueType = typeof value;

    if (value === null || valueType === 'undefined') {
      return null;
    }

    if (valueType === 'string' && typeof format === 'string') {
      const parsedDate = dayjs(value as string, format);
      return parsedDate.isValid() ? parsedDate.valueOf() : null;
    }

    if (value instanceof Date || typeof value === 'number') {
      const parsedDate = dayjs(value);
      return parsedDate.isValid() ? parsedDate.valueOf() : null;
    }

    return null;
  },
  format: (time: number | string | Date, format: TimeUnit): string => dayjs(time).format(format),
  add: (time: number | string | Date, amount: number, unit: QUnitType & TimeUnit) =>
    dayjs(time).add(amount, unit).valueOf(),
  diff: (max: number | string | Date, min: number | string | Date, unit: TimeUnit) =>
    dayjs(max).diff(dayjs(min), unit),
  startOf: (
    time: number | string | Date,
    unit: (TimeUnit & QUnitType) | 'isoWeek',
    weekday?: number
  ) => {
    if (unit === 'isoWeek') {
      // Ensure that weekday has a valid format
      //const formattedWeekday

      const validatedWeekday: number =
        typeof weekday === 'number' && weekday > 0 && weekday < 7 ? weekday : 1;

      return dayjs(time).isoWeekday(validatedWeekday).startOf('day').valueOf();
    }

    return dayjs(time).startOf(unit).valueOf();
  },
  endOf: (time: number | string | Date, unit: TimeUnit & QUnitType) =>
    dayjs(time).endOf(unit).valueOf(),
});
