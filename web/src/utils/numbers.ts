import isNumber from 'lodash/isNumber';
import round from 'lodash/round';
import max from 'lodash/max';
import isString from 'lodash/isString';
import isDate from 'lodash/isDate';

export const roundNumber = (
  input: string | number | undefined,
  minDecimals = 0,
  maximumDecimals = 2
): number => {
  if ((!minDecimals && !maximumDecimals) || !input) return Number(input);
  if (isString(input)) {
    const hasDecimal = String(input).includes('.');
    const digits = hasDecimal ? maximumDecimals : minDecimals;
    //this hack allows us to round numbers to 2 decimal places without using toLocaleString which can accidentally round number
    const fixedNumber = Number(Math.floor(Number(input) * 100) / 100).toFixed(digits);
    return Number(fixedNumber);
  }
  return round(Number(input), max([minDecimals, maximumDecimals]));
};

export const isNumeric = (str: string | undefined | number | Date | null) => {
  if (str === undefined || str === null) return false;
  if (isNumber(str)) return true;
  if (typeof str === 'object') return false;
  if (typeof str === 'boolean') return false;
  if (str === '') return false;
  if (isDate(str)) return false;
  return !isNaN(+str) && !isNaN(parseFloat(str)); // Ensure the entire string is parsed
};

export const formatNumber = (
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions & {
    locale?: string;
    compact?: boolean;
    minDecimals?: number;
    maximumDecimals?: number;
    useGrouping?: boolean;
    currency?: string;
  }
) => {
  const locale = options?.locale || 'en-US';

  if (value === undefined || value === null) return '';
  if (!isNumeric(value)) return String(value);

  if (options?.minDecimals || options?.maximumDecimals) {
    value = roundNumber(value, options?.minDecimals, options?.maximumDecimals);
  }

  const maxFractionDigits = max(
    [
      options?.minDecimals,
      options?.maximumFractionDigits,
      options?.maximumDecimals,
      options?.maximumSignificantDigits
    ].filter(isNumber)
  );

  const formatter = new Intl.NumberFormat(locale, {
    ...options,
    minimumFractionDigits: options?.minDecimals || options?.minimumFractionDigits || 0,
    maximumFractionDigits: maxFractionDigits,
    notation: options?.compact ? 'compact' : undefined,
    compactDisplay: 'short',
    style: options?.currency ? 'currency' : undefined
  });

  return formatter.format(Number(value));

  /*
  300000000
  300M
  {
  notation: 'compact',
  compactDisplay: 'short' // or 'long'
  }

  300000000
  300,000,000
  {
  style: 'decimal'
  }
  */
};
