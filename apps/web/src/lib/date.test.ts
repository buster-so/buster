import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractDateForFormatting,
  formatDate,
  numberDateFallback,
  valueIsValidMonth,
} from './date';

describe('formatDate', () => {
  // Test 1: Basic date string formatting
  it('should format a valid date string correctly', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'YYYY-MM-DD',
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 2: UTC conversion
  it('should handle UTC conversion correctly', () => {
    const result = formatDate({
      date: '2024-03-20T12:00:00Z',
      format: 'YYYY-MM-DD HH:mm',
      isUTC: true,
    });
    expect(result).toBe('2024-03-20 12:00');
  });

  // Test 3: Number to day of week conversion
  it('should convert number to day of week', () => {
    const result = formatDate({
      date: 1,
      format: 'dddd',
      convertNumberTo: 'day_of_week',
    });
    expect(result).toBe('Monday');
  });

  // Test 4: Number to month of year conversion
  it('should convert number to month of year', () => {
    const result = formatDate({
      date: 3,
      format: 'MMMM',
      convertNumberTo: 'month_of_year',
    });
    expect(result).toBe('March');
  });

  // Test 5: Quarter conversion
  it.skip('should format quarter correctly', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'YYYY [Q]Q',
      convertNumberTo: 'quarter',
    });
    expect(result).toBe('2024 Q1');
  });

  // Test 6: Invalid date handling
  it('should handle invalid date by returning string representation', () => {
    const result = formatDate({
      date: 'invalid-date',
      format: 'YYYY-MM-DD',
    });
    expect(result).toBe('invalid-date');
  });

  // Test 7: Date object input
  it('should handle Date object input', () => {
    const dateObj = new Date('2024-03-20T00:00:00Z');
    const result = formatDate({
      date: dateObj,
      format: 'YYYY-MM-DD',
      isUTC: true,
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 8: Unix timestamp (10 digits)
  it('should handle 10-digit unix timestamp', () => {
    const result = formatDate({
      date: 1710921600, // 2024-03-20 00:00:00
      format: 'YYYY-MM-DD',
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 9: Millisecond timestamp (13 digits)
  it('should handle 13-digit millisecond timestamp', () => {
    const result = formatDate({
      date: 1710921600000, // 2024-03-20 00:00:00
      format: 'YYYY-MM-DD',
    });
    expect(result).toBe('2024-03-20');
  });

  // Test 10: Custom date format
  it('should format date with custom format', () => {
    const result = formatDate({
      date: '2024-03-20',
      format: 'MMM ddd, YYYY',
    });
    expect(result).toBe('Mar Wed, 2024');
  });

  // Test 11: Month number with dateKey
  it('should handle month number with dateKey', () => {
    const result = formatDate({
      date: 3,
      format: 'MM',
      dateKey: 'month',
    });
    expect(result).toBe('03');
  });

  // Test 12: Strict validation
  it('should respect ignoreValidation flag', () => {
    const result = formatDate({
      date: 'not-a-date',
      format: 'YYYY-MM-DD',
      ignoreValidation: false,
    });
    expect(result).toBe('not-a-date');
  });

  // Test 13: Number conversion fallback
  it('should handle number conversion fallback', () => {
    const result = formatDate({
      date: '123',
      format: 'YYYY-MM-DD',
      convertNumberTo: 'number',
    });
    expect(result).toBe('123');
  });

  // Test 14: Empty input handling
  it('should handle empty input gracefully', () => {
    const result = formatDate({
      date: '',
      format: 'YYYY-MM-DD',
    });
    expect(result).toBe('');
  });
});

describe('numberDateFallback', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should convert day of week number correctly', () => {
    const result = numberDateFallback(1, undefined, 'day_of_week');
    expect(dayjs.isDayjs(result) ? result.format('YYYY-MM-DD') : result).toBe('2024-01-15');
  });

  it('should convert month number correctly', () => {
    const result = numberDateFallback(3, undefined, 'month_of_year');
    expect(dayjs.isDayjs(result) ? result.format('YYYY-MM') : result).toBe('2024-03');
  });

  it('should handle month number with _month key', () => {
    const result = numberDateFallback(3, 'some_month');
    expect(dayjs.isDayjs(result) ? result.format('YYYY-MM') : result).toBe('2024-03');
  });

  it('should return string for non-timestamp numbers', () => {
    const result = numberDateFallback(123);
    expect(result).toBe('123');
  });

  it('should handle string input', () => {
    const result = numberDateFallback('2024-01-15');
    expect(result).toBe('2024-01-15');
  });

  it('should convert month number 12 correctly', () => {
    const result = numberDateFallback(12, undefined, 'month_of_year');
    expect(dayjs.isDayjs(result) ? result.format('YYYY-MM') : result).toBe('2024-12');
  });

  it('should handle month 1 with month key', () => {
    const result = numberDateFallback(1, 'month');
    expect(dayjs.isDayjs(result) ? result.format('YYYY-MM') : result).toBe('2024-01');
  });

  it('should handle 13-digit millisecond timestamp', () => {
    const timestamp = 1710921600000; // 2024-03-20 00:00:00 in milliseconds
    const result = numberDateFallback(timestamp);

    expect(dayjs.isDayjs(result)).toBe(true);
    expect((result as dayjs.Dayjs).format('YYYY-MM-DD')).toBe('2024-03-20');
  });

  it('should return string for quarter convertNumberTo with non-timestamp number', () => {
    const result = numberDateFallback(15, undefined, 'quarter');

    // Since there's no specific quarter logic in numberDateFallback,
    // 15 is not a valid month (>12), and not a valid timestamp, it should return as string
    expect(result).toBe('15');
    expect(typeof result).toBe('string');
  });
});

describe('valueIsValidMonth', () => {
  it('should return true for valid numeric month 1', () => {
    expect(valueIsValidMonth(1)).toBe(true);
  });

  it('should return true for valid numeric month 12', () => {
    expect(valueIsValidMonth(12)).toBe(true);
  });

  it('should return false for numeric month 0', () => {
    expect(valueIsValidMonth(0)).toBe(false);
  });

  it('should return false for numeric month 13', () => {
    expect(valueIsValidMonth(13)).toBe(false);
  });

  it('should return true for string month "1"', () => {
    expect(valueIsValidMonth('1')).toBe(true);
  });

  it('should return false for invalid string value', () => {
    expect(valueIsValidMonth('invalid')).toBe(false);
  });

  it('should return true when key is "month"', () => {
    expect(valueIsValidMonth(15, 'month')).toBe(true);
  });

  it('should return true when key ends with "_month"', () => {
    expect(valueIsValidMonth(15, 'created_month')).toBe(true);
  });

  it('should return false for undefined value', () => {
    expect(valueIsValidMonth(undefined)).toBe(false);
  });

  it('should return true for valid string month "12"', () => {
    expect(valueIsValidMonth('12')).toBe(true);
  });
});

describe('extractDateForFormatting', () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Test 1: Date object input should return new Date(date)
  it('should return new Date when input is a Date object', () => {
    const inputDate = new Date('2024-03-20T10:30:00Z');
    const result = extractDateForFormatting(inputDate);

    expect(result).toBeInstanceOf(Date);
    expect(result).toEqual(new Date(inputDate));
  });

  // Test 2: Number input should call numberDateFallback
  it('should call numberDateFallback when input is a number', () => {
    const result = extractDateForFormatting(1710921600); // 10-digit timestamp

    // Should return a dayjs object from numberDateFallback for timestamps
    expect(dayjs.isDayjs(result)).toBe(true);
    expect((result as dayjs.Dayjs).format('YYYY-MM-DD')).toBe('2024-03-20');
  });

  // Test 3: String input with convertNumberTo set (non-'number') should parse and call numberDateFallback
  it('should parse string to int and call numberDateFallback when convertNumberTo is set', () => {
    const result = extractDateForFormatting('3', undefined, 'month_of_year');

    expect(dayjs.isDayjs(result)).toBe(true);
    expect((result as dayjs.Dayjs).format('YYYY-MM')).toBe('2024-03');
  });

  // Test 4: String input with convertNumberTo set to 'number' should return string as-is
  it('should return string as-is when convertNumberTo is "number"', () => {
    const result = extractDateForFormatting('123', undefined, 'number');

    expect(result).toBe('123');
    expect(typeof result).toBe('string');
  });

  // Test 5: String input without convertNumberTo should return string as-is
  it('should return string as-is when convertNumberTo is not set', () => {
    const testString = '2024-03-20';
    const result = extractDateForFormatting(testString);

    expect(result).toBe(testString);
    expect(typeof result).toBe('string');
  });

  // Test 6: String input that can't be parsed to int with convertNumberTo should return string
  it('should return string when input cannot be parsed as integer with convertNumberTo', () => {
    const result = extractDateForFormatting('not-a-number', undefined, 'day_of_week');

    expect(result).toBe('not-a-number');
    expect(typeof result).toBe('string');
  });

  // Test 7: Non-string, non-number, non-date input should convert to string
  it('should convert non-string, non-number, non-date input to string', () => {
    const objectInput = { test: 'value' };
    const result = extractDateForFormatting(objectInput as any);

    expect(typeof result).toBe('string');
    expect(result).toBe('[object Object]');
  });

  // Test 8: String input with convertNumberTo 'day_of_week' should parse and call numberDateFallback
  it('should handle day_of_week conversion from string number', () => {
    const result = extractDateForFormatting('1', undefined, 'day_of_week');

    expect(dayjs.isDayjs(result)).toBe(true);
    // Day 1 (Monday) starting from current mock date (2024-01-15 which is Monday)
    expect((result as dayjs.Dayjs).format('YYYY-MM-DD')).toBe('2024-01-15');
  });
});
