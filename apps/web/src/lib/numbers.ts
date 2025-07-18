import isDate from 'lodash/isDate';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import max from 'lodash/max';
import round from 'lodash/round';

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
  return !Number.isNaN(+str) && !Number.isNaN(Number.parseFloat(str)); // Ensure the entire string is parsed
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

  let processedValue = value;
  if (options?.minDecimals || options?.maximumDecimals) {
    processedValue = roundNumber(value, options?.minDecimals, options?.maximumDecimals);
  }

  const maxFractionDigits = max(
    [
      options?.minDecimals,
      options?.maximumFractionDigits,
      options?.maximumDecimals,
      options?.maximumSignificantDigits
    ].filter(isNumber)
  );

  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.minDecimals,
      maximumFractionDigits: maxFractionDigits,
      notation: options?.compact ? 'compact' : 'standard',
      compactDisplay: 'short',
      style: options?.currency ? 'currency' : 'decimal',
      currency: options?.currency,
      useGrouping: options?.useGrouping !== false
    });

    return formatter.format(Number(processedValue));
  } catch (error) {
    console.error('error', error, { value: processedValue, options });
    return String(processedValue);
  }

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

/**
 * Counts the total number of digits in a number, including digits after the decimal point
 * The number is first rounded to the specified number of decimal places before counting
 * @param num - The number to count digits for
 * @param roundToDecimals - Number of decimal places to round to before counting (default: 2)
 * @returns The total count of digits (excluding the decimal point itself)
 * @example
 * countTotalDigits(123.456) // returns 5 (rounds to 123.46, counts 5 digits)
 * countTotalDigits(123.456, 1) // returns 4 (rounds to 123.5, counts 4 digits)
 * countTotalDigits(1000000) // returns 7
 * countTotalDigits(-123.4) // returns 4 (ignores sign)
 */
export const countTotalDigits = (num: number, roundToDecimals: number = 2): number => {
  const roundedNum = roundNumber(num, 0, roundToDecimals);
  const str = Math.abs(roundedNum).toString();
  return str.replace('.', '').length;
};
