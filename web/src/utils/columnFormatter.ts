import {
  DEFAULT_COLUMN_LABEL_FORMAT,
  DEFAULT_DATE_FORMAT_DAY_OF_WEEK,
  DEFAULT_DATE_FORMAT_MONTH_OF_YEAR,
  DEFAULT_DATE_FORMAT_QUARTER
} from '@/api/buster-rest';
import { ColumnLabelFormat, IColumnLabelFormat } from '@/components/charts';
import { formatDate, makeHumanReadble, formatNumber, roundNumber } from '@/utils';

const DEFAULT_DATE_FORMAT = 'll';

export const formatLabel = (
  textProp: string | number | Date | null,
  props: ColumnLabelFormat = {
    columnType: 'string',
    style: 'string'
  },
  useKeyFormatter: boolean = false
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
    replaceMissingDataWith = DEFAULT_COLUMN_LABEL_FORMAT.replaceMissingDataWith,
    convertNumberTo,
    currency = DEFAULT_COLUMN_LABEL_FORMAT.currency,
    displayName = DEFAULT_COLUMN_LABEL_FORMAT.displayName,
    //date stuff
    dateFormat = DEFAULT_COLUMN_LABEL_FORMAT.dateFormat,
    useRelativeTime = DEFAULT_COLUMN_LABEL_FORMAT.useRelativeTime,
    isUTC = DEFAULT_COLUMN_LABEL_FORMAT.isUTC,
    makeLabelHumanReadable = DEFAULT_COLUMN_LABEL_FORMAT.makeLabelHumanReadable,
    compactNumbers = DEFAULT_COLUMN_LABEL_FORMAT.compactNumbers
  } = props;

  const text = columnType === 'number' && !useKeyFormatter ? Number(textProp) : textProp;
  let formattedText = text;

  if (text === null || text === undefined) {
    formattedText = String(replaceMissingDataWith);
  } else if (style === 'date' && !useKeyFormatter) {
    formattedText = formatLabelDate(text, {
      dateFormat,
      convertNumberTo,
      isUTC,
      useRelativeTime
    });
  } else if (makeLabelHumanReadable && useKeyFormatter) {
    formattedText = displayName || makeHumanReadble(formattedText as string);
  } else if (
    (columnType === 'number' && style !== 'string') ||
    style === 'currency' ||
    style === 'percent'
  ) {
    let newNumber = Number(text) * multiplier;
    let roundedNumber = roundNumber(newNumber, minimumFractionDigits, maximumFractionDigits);
    if (style === 'currency') {
      formattedText = formatNumber(roundedNumber, {
        currency,
        compact: compactNumbers
      });
    } else {
      formattedText = formatNumber(roundedNumber, {
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits,
        useGrouping: numberSeparatorStyle !== null,
        compact: compactNumbers
      });
    }
  }

  return prefixSuffixHandler(
    formattedText as string,
    prefix,
    suffix,
    replaceMissingDataWith,
    style,
    useKeyFormatter
  );
};

const autoFormats = (convertNumberTo: ColumnLabelFormat['convertNumberTo']) => {
  if (!convertNumberTo) return DEFAULT_DATE_FORMAT;
  if (convertNumberTo === 'day_of_week') return DEFAULT_DATE_FORMAT_DAY_OF_WEEK;
  if (convertNumberTo === 'month_of_year') return DEFAULT_DATE_FORMAT_MONTH_OF_YEAR;
  if (convertNumberTo === 'quarter') return DEFAULT_DATE_FORMAT_QUARTER;
  return DEFAULT_DATE_FORMAT;
};

const formatLabelDate = (
  text: string | number | Date,
  props: Pick<ColumnLabelFormat, 'dateFormat' | 'useRelativeTime' | 'isUTC' | 'convertNumberTo'>
): string => {
  const {
    dateFormat: dateFormatProp = DEFAULT_DATE_FORMAT,
    useRelativeTime = false,
    isUTC = true,
    convertNumberTo
  } = props;

  const dateFormat = dateFormatProp === 'auto' ? autoFormats(convertNumberTo) : dateFormatProp;

  return formatDate({
    ignoreValidation: true,
    date: text,
    format: dateFormat,
    isUTC,
    convertNumberTo
  });
};

const prefixSuffixHandler = (
  text: string | number | null,
  prefix: string | undefined,
  suffix: string | undefined,
  replaceMissingDataWith: ColumnLabelFormat['replaceMissingDataWith'],
  style: IColumnLabelFormat['style'],
  useKeyFormatter: boolean
): string => {
  if (useKeyFormatter) return String(text);
  if (replaceMissingDataWith === null && !text) return String(text);
  if (prefix) text = prefix + text;
  if (suffix) text = text + suffix;
  if (style === 'percent' && suffix !== '%') text = `${text}%`;

  return String(text);
};
