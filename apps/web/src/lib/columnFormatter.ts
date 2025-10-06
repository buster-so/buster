import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_DATE_FORMAT_DAY_OF_WEEK,
  DEFAULT_DATE_FORMAT_MONTH_OF_YEAR,
  DEFAULT_DATE_FORMAT_QUARTER,
} from '@buster/server-shared/metrics';
import { formatDate } from './date';
import { formatNumber, roundNumber } from './numbers';
import { makeHumanReadble } from './text';

const DEFAULT_DATE_FORMAT = 'll';

export const formatLabel = (
  textProp: string | number | Date | null | undefined | boolean,
  props: Partial<ColumnLabelFormat> = DEFAULT_COLUMN_LABEL_FORMAT,
  useKeyFormatter = false
): string => {
  const {
    columnType = DEFAULT_COLUMN_LABEL_FORMAT.columnType,
    style = DEFAULT_COLUMN_LABEL_FORMAT.style,
    minimumFractionDigits = DEFAULT_COLUMN_LABEL_FORMAT.minimumFractionDigits,
    maximumFractionDigits = DEFAULT_COLUMN_LABEL_FORMAT.maximumFractionDigits,
    multiplier = DEFAULT_COLUMN_LABEL_FORMAT.multiplier,
    prefix = DEFAULT_COLUMN_LABEL_FORMAT.prefix,
    suffix = DEFAULT_COLUMN_LABEL_FORMAT.suffix,
    numberSeparatorStyle = DEFAULT_COLUMN_LABEL_FORMAT.numberSeparatorStyle,
    replaceMissingDataWith, //DO NOT USE THE DEFAULT
    convertNumberTo,
    currency = DEFAULT_COLUMN_LABEL_FORMAT.currency,
    displayName = DEFAULT_COLUMN_LABEL_FORMAT.displayName,
    //date stuff
    dateFormat = DEFAULT_COLUMN_LABEL_FORMAT.dateFormat,
    useRelativeTime = DEFAULT_COLUMN_LABEL_FORMAT.useRelativeTime,
    isUTC = DEFAULT_COLUMN_LABEL_FORMAT.isUTC,
    makeLabelHumanReadable = DEFAULT_COLUMN_LABEL_FORMAT.makeLabelHumanReadable,
    compactNumbers = DEFAULT_COLUMN_LABEL_FORMAT.compactNumbers,
  } = props;

  const textIsNotNullOrUndefined = textProp !== null && textProp !== undefined;

  const text =
    textIsNotNullOrUndefined &&
    columnType === 'number' &&
    !useKeyFormatter &&
    replaceMissingDataWith === 0 &&
    typeof textProp !== 'object' //object is a date
      ? Number(textProp)
      : textProp;

  let formattedText = text;

  if (text === null || text === undefined) {
    if (columnType === 'number') {
      if (replaceMissingDataWith === null) {
        formattedText = 'null';
      } else {
        formattedText = String(
          replaceMissingDataWith ?? DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith
        );
      }
    }
    // I removed this because it was causing issues with null values and strings...
    else if (replaceMissingDataWith !== undefined) {
      if (columnType === 'text' && typeof replaceMissingDataWith !== 'number') {
        formattedText = String(replaceMissingDataWith);
      } else if (columnType !== 'text') {
        formattedText = String(replaceMissingDataWith);
      }
    } else {
      formattedText = String('null');
    }
  } else if (style === 'date' && !useKeyFormatter) {
    formattedText = formatLabelDate(text as string | number | Date, {
      dateFormat,
      convertNumberTo,
      isUTC,
      useRelativeTime,
    });
  } else if (makeLabelHumanReadable && useKeyFormatter) {
    formattedText = displayName || makeHumanReadble(formattedText as string);
  } else if (
    (columnType === 'number' && style !== 'string') ||
    style === 'currency' ||
    style === 'percent'
  ) {
    const newNumber = Number(text) * multiplier;
    const roundedNumber = roundNumber(newNumber, minimumFractionDigits, maximumFractionDigits);

    if (style === 'currency') {
      formattedText = formatNumber(roundedNumber, {
        currency,
        compact: compactNumbers,
        minimumFractionDigits: Math.min(minimumFractionDigits, maximumFractionDigits),
        maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
      });
    } else {
      formattedText = formatNumber(roundedNumber, {
        minDecimals: minimumFractionDigits,
        minimumFractionDigits: Math.min(minimumFractionDigits, maximumFractionDigits),
        maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
        useGrouping: numberSeparatorStyle !== null,
        compact: compactNumbers,
      });
    }
  }

  return prefixSuffixHandler(
    formattedText as string,
    prefix,
    suffix,
    style,
    useKeyFormatter,
    replaceMissingDataWith
  );
};

const autoFormats = (convertNumberTo: Partial<ColumnLabelFormat>['convertNumberTo']) => {
  if (!convertNumberTo) return DEFAULT_DATE_FORMAT;
  if (convertNumberTo === 'day_of_week') return DEFAULT_DATE_FORMAT_DAY_OF_WEEK;
  if (convertNumberTo === 'month_of_year') return DEFAULT_DATE_FORMAT_MONTH_OF_YEAR;
  if (convertNumberTo === 'quarter') return DEFAULT_DATE_FORMAT_QUARTER;
  return DEFAULT_DATE_FORMAT;
};

const formatLabelDate = (
  text: string | number | Date,
  props: Partial<
    Pick<ColumnLabelFormat, 'dateFormat' | 'useRelativeTime' | 'isUTC' | 'convertNumberTo'>
  >
): string => {
  const {
    dateFormat: dateFormatProp = DEFAULT_DATE_FORMAT,
    useRelativeTime = false,
    isUTC = false,
    convertNumberTo,
  } = props;
  const dateFormat = dateFormatProp === 'auto' ? autoFormats(convertNumberTo) : dateFormatProp;

  return formatDate({
    ignoreValidation: true,
    date: text,
    format: dateFormat,
    isUTC,
    convertNumberTo,
  });
};

const prefixSuffixHandler = (
  text: string | number | null,
  prefix: string | undefined,
  suffix: string | undefined,
  style: string | undefined,
  useKeyFormatter: boolean,
  replaceMissingDataWith: string | null | undefined | 0
): string => {
  if (useKeyFormatter) return String(text);
  if (replaceMissingDataWith === null && !text) return String(text);

  let result = String(text);
  if (style === 'percent' && suffix !== '%') result = `${result}%`;
  if (prefix) result = prefix + result;
  if (suffix) result = result + suffix;

  return result;
};
