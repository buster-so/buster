import {
  type ColumnLabelFormat,
  DEFAULT_DATE_FORMAT_MONTH_OF_YEAR,
  DEFAULT_DATE_FORMAT_QUARTER,
  DEFAULT_DAY_OF_WEEK_FORMAT,
} from '@buster/server-shared/metrics';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isDate from 'lodash/isDate';
import lodashIsNaN from 'lodash/isNaN';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import { isNumeric } from './numbers';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(quarterOfYear);

export const getNow = () => dayjs();
export const createDayjsDate = (date: string | Date) => dayjs(date);

const KEY_DATE_FORMATS = [
  'date',
  'year',
  'month',
  'day',
  'timestamp',
  'time_stamp',
  'created_at',
  '_month',
];
const KEY_DATE_INCLUDE_FORMATS = ['_month', '_year'];
const VALID_DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY-MM',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss.sssZ',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DD HH:mm:ssZ',
  'YYYY-MM-DD HH:mm:ss.sssZ',
  'YYYY-MM-DD HH:mm:ss.sss',
  'YYYY-MM-DDTHH:mm:ss.sss',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DD HH',
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DD HH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'MM DD YYYY',
  'M D YYYY',
  'MMM D, YYYY',
  'MMMM D, YYYY',
];

export const numberDateFallback = (
  date: string | number | Date,
  dateKey?: string,
  convertNumberTo?: ColumnLabelFormat['convertNumberTo']
) => {
  if (convertNumberTo === 'day_of_week' && isNumber(date) && valueIsValidDayOfWeek(date, dateKey)) {
    return dayjs().day(Number(date)).startOf('day');
  }
  if (valueIsValidMonth(date, dateKey) || convertNumberTo === 'month_of_year') {
    return dayjs()
      .month(Number(date) - 1)
      .startOf('month')
      .startOf('day');
  }

  const numericDate = Number(date);
  if (!lodashIsNaN(numericDate)) {
    // Check for 13 digit timestamp (milliseconds)
    if (String(numericDate).length === 13) {
      return dayjs(numericDate);
    }
    // Check for 10 digit timestamp (seconds)
    if (String(numericDate).length === 10) {
      return dayjs.unix(numericDate);
    }
  }

  return String(date);
};

export const extractDateForFormatting = (
  date: string | number | Date,
  dateKey?: string,
  convertNumberTo?: ColumnLabelFormat['convertNumberTo']
) => {
  if (isDate(date)) return new Date(date);
  if (isNumber(date)) return numberDateFallback(date, dateKey, convertNumberTo);
  if (convertNumberTo && convertNumberTo !== 'number') {
    //this will happen when the date is a string and we need to convert it to a number like '1' -> 1
    const parsedInt = parseInt(date as string);
    if (Number.isNaN(parsedInt)) return String(date);
    return numberDateFallback(parsedInt, dateKey, convertNumberTo);
  }
  if (isString(date)) return date;
  return String(date);
};

export const formatDate = ({
  date,
  format,
  isUTC = false,
  dateKey,
  ignoreValidation = true,
  convertNumberTo = null,
}: {
  date: string | number | Date;
  format: string;
  isUTC?: boolean;
  dateKey?: string;
  ignoreValidation?: boolean;
  convertNumberTo?: ColumnLabelFormat['convertNumberTo'];
}): string => {
  try {
    const myDate = extractDateForFormatting(date, dateKey, convertNumberTo);

    const valid = ignoreValidation
      ? true
      : !!(myDate as dayjs.Dayjs)?.toDate ||
        isDateValid({
          date: myDate as string,
        });

    if (convertNumberTo) {
      if (convertNumberTo === 'day_of_week') {
        const validDayFormats = ['dddd', 'ddd', 'dd', 'd'];
        if (!validDayFormats.includes(format)) {
          format = DEFAULT_DAY_OF_WEEK_FORMAT;
        }
      } else if (convertNumberTo === 'month_of_year') {
        const validMonthFormats = ['MMMM', 'MMM', 'MM', 'M'];
        if (!validMonthFormats.includes(format)) {
          format = DEFAULT_DATE_FORMAT_MONTH_OF_YEAR;
        }
      } else if (convertNumberTo === 'quarter') {
        const validQuarterFormats = ['YYYY [Q]Q', 'Q'];
        if (!validQuarterFormats.includes(format)) {
          format = DEFAULT_DATE_FORMAT_QUARTER;
        }
      } else if (convertNumberTo === 'number') {
        return String(date);
      } else {
        const exhaustiveCheck: never = convertNumberTo;
      }
    }

    const theDate = valid
      ? isUTC
        ? dayjs.utc(myDate).format(format)
        : dayjs(myDate).format(format)
      : String(date);

    if (theDate === 'Invalid Date') {
      return String(date);
    }
    return theDate;
  } catch {
    return String(date);
  }
};

export const isDateSame = ({
  date,
  compareDate,
  interval = 'day',
}: {
  date: string | number | dayjs.Dayjs | Date;
  compareDate: string | number | dayjs.Dayjs | Date;
  interval?: dayjs.OpUnitType;
}) => {
  return dayjs(date).isSame(compareDate, interval);
};

export const isDateBefore = ({
  date,
  compareDate,
  interval = 'day',
}: {
  date: string | number | dayjs.Dayjs | Date;
  compareDate: string | number | dayjs.Dayjs | Date;
  interval?: dayjs.OpUnitType;
}) => {
  return dayjs(date).isBefore(compareDate, interval);
};

export const isDateAfter = ({
  date,
  compareDate,
  interval = 'day',
}: {
  date: string | number | dayjs.Dayjs | Date;
  compareDate: string | number | dayjs.Dayjs | Date;
  interval?: dayjs.OpUnitType;
}) => {
  return dayjs(date).isAfter(compareDate, interval);
};

export const timeFromNow = (date: string | Date, relative = false) => {
  return dayjs(new Date(date)).fromNow(relative);
};

export const valueIsValidMonth = (value: string | number | Date | undefined, key?: string) => {
  if (value === undefined || value === null) return false;
  const month = Number(value);
  return (month > 0 && month <= 12) || isKeyLikelyDate(key);
};

const valueIsValidDayOfWeek = (value: string | number | Date | undefined, key?: string) => {
  if (value === undefined || value === null) return false;
  const day = Number(value);
  return (day >= 0 && day <= 7) || isKeyLikelyDate(key);
};

const isKeyLikelyDate = (dateKey?: string) => {
  return (
    KEY_DATE_FORMATS.some((v) => v === dateKey) ||
    KEY_DATE_INCLUDE_FORMATS.some((v) => dateKey?.toLowerCase().endsWith(v))
  );
};

export const isDateValid = ({
  date,
  dateKey,
  useNumbersAsDateKey = true,
}: {
  date: string | number | Date | undefined;
  dateKey?: string;
  useNumbersAsDateKey?: boolean;
}) => {
  if (isDate(date)) return true;
  if (useNumbersAsDateKey && dateKey && isNumeric(date as string) && isKeyLikelyDate(dateKey)) {
    return valueIsValidMonth(date || '', dateKey);
  }
  if (!date || isNumber(date)) return false;
  const hyphenCount = (date.match(/-/g) || []).length;
  const twoHyphens = hyphenCount === 2;

  let filter = false;
  if (date.includes('T') && twoHyphens)
    filter = true; //2023-10-17T01:33:45 , YYYY-MM-DD HH:mm:ss.
  else if (date.includes('Z') && twoHyphens)
    filter = true; //YYYY-MM-DDTHH:mm:ss.sssZ
  else if (twoHyphens && date.length === 10)
    filter = true; //2023-10-17
  else if (date.length === 13 && lodashIsNaN(Number(date)))
    filter = true; // 1634468020000
  else if (date.length === 10 && lodashIsNaN(Number(date))) filter = true; // 1634468020

  if (filter) return filter && dayjs(date).isValid();

  return VALID_DATE_FORMATS.some((format) => dayjs(date, format, true).isValid());
};

export const keysWithDate = (
  data: Record<string, string | number | null>[] = [],
  params?: {
    parseable?: boolean;
    includeFormats?: boolean;
    absoluteFormats?: boolean;
  }
): string[] => {
  const uniqueKeys = Object.keys(data[0] || {});
  const { parseable, includeFormats = true, absoluteFormats = true } = params || {};

  if (parseable) {
    return uniqueKeys.filter((key) => {
      const value = data?.[0]?.[key];
      return isDateValid({
        date: String(value),
        dateKey: key,
      });
    });
  }

  return uniqueKeys
    .filter((key) => {
      const value = data?.[0]?.[key];

      return (
        (absoluteFormats && KEY_DATE_FORMATS.some((keyDate) => keyDate === key.toLowerCase())) ||
        isDateValid({
          date: String(value),
          dateKey: key,
        }) ||
        (includeFormats &&
          KEY_DATE_INCLUDE_FORMATS.some((format) => key.toLowerCase().endsWith(format)))
      );
    })
    .sort((v) => {
      if (v.toLowerCase().includes('year')) return 1;
      return -1;
    });
};

export const formatTime = (date: string | Date, format: string, isUTC: boolean) => {
  return isUTC ? dayjs.utc(date).format(format) : dayjs(date).format(format || 'h:mm A');
};

export enum DEFAULT_TIME_ENCODE_FORMATS {
  MONTHS = 'month',
  YEARS = 'year',
  DAYS = 'day',
  SECONDS = 'second',
  HOURS = 'hour',
  MONTHS_ONLY = 'month_only',
  NO_FORMAT = 'no_format',
  MILLISECONDS = 'millisecond',
  WEEK = 'week',
  MINUTES = 'minute',
}

//const loadedLocales: string[] = [];

// export const setNewDateLocale = async (locale: SupportedLanguages) => {
//   if (!locale) return;
//   let _locale: string = locale;

//   const loadAndSet = async (_dlocale: string) => {
//     try {
//       await import(`dayjs/locale/${_locale}.js`);
//       loadedLocales = [...loadedLocales, _locale as SupportedLanguages];
//     } catch (error) {
//       //
//     }
//   };

//   try {
//     if (!loadedLocales.includes(_locale as SupportedLanguages)) {
//       if (_locale === SupportedLanguages.EN) _locale = getBrowserLanguage(true).toLocaleLowerCase();
//       loadAndSet(_locale);
//     }
//   } catch {
//     try {
//       _locale = locale;
//       loadAndSet(_locale);
//     } catch (error) {
//       console.error(`Error loading locale ${_locale}:`, error);
//     }
//   }

//   dayjs.locale(_locale);
// };

export const getBestDateFormat = (minDate: dayjs.Dayjs, maxDate: dayjs.Dayjs) => {
  const diffInDays = maxDate.diff(minDate, 'days');
  const diffInMonths = maxDate.diff(minDate, 'months');
  const diffInYears = maxDate.diff(minDate, 'years');

  if (diffInDays <= 1) {
    return 'h:mmA'; // 1/1 2:30 PM
  }
  if (diffInDays <= 31) {
    return 'MMM D'; // Jan 1
  }
  if (diffInMonths <= 12) {
    return 'MMM YYYY'; // Jan 2024
  }
  if (diffInYears <= 1) {
    return 'MMM YYYY'; // Jan 2024
  }
  return 'YYYY'; // 2024
};
