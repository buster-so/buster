import { describe, it, expect } from 'vitest';
import { formatNumber } from './numbers';

describe('formatNumber', () => {
  it('handles null and undefined values', () => {
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(undefined)).toBe('');
  });
  it('formats basic numbers', () => {
    expect(formatNumber(1234.5678)).toBe('1,234.568');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(0)).toBe('0');
  });
  it('respects decimal places settings', () => {
    expect(formatNumber(1234.5678, { minDecimals: 3 })).toBe('1,234.568');
    expect(formatNumber(1234.5, { minDecimals: 3 })).toBe('1,234.500');
    expect(formatNumber(1234.5678, { maximumDecimals: 1 })).toBe('1,234.6');
  });
  it('handles compact notation', () => {
    expect(formatNumber(1_000_000, { compact: true })).toBe('1M');
    expect(formatNumber(1_500_000, { compact: true })).toBe('1.5M');
    expect(formatNumber(1_000, { compact: true })).toBe('1K');
  });
  it('handles different locales', () => {
    expect(formatNumber(1234.56, { locale: 'de-DE' })).toBe('1.234,56');
    expect(formatNumber(1234.56, { locale: 'fr-FR' })).toBe('1 234,56');
  });
  it('handles currency formatting', () => {
    expect(formatNumber(1234.56, { currency: 'USD' })).toBe('$1,234.56');
    expect(formatNumber(1234.56, { currency: 'EUR' })).toBe('€1,234.56');
  });
  it('handles string inputs', () => {
    expect(formatNumber('1234.56')).toBe('1,234.56');
    expect(formatNumber('1000')).toBe('1,000');
  });
  it('handles non-numeric strings', () => {
    expect(formatNumber('not a number')).toBe('not a number');
    expect(formatNumber('')).toBe('');
  });
  it('handles grouping options', () => {
    expect(formatNumber(1234567, { useGrouping: false })).toBe('1234567');
    expect(formatNumber(1234567, { useGrouping: true })).toBe('1,234,567');
  });
  it('handles compact dollar', () => {
    const roundedNumber = 3363690.4;
    const currency = 'USD';
    const compactNumbers = false;
    expect(formatNumber(roundedNumber, { currency, compact: compactNumbers })).toBe(
      '$3,363,690.40'
    );
  });
  it('handles padding, should add zeros to the right', () => {
    // formattedText = formatNumber(roundedNumber, {
    //   minimumFractionDigits: Math.min(minimumFractionDigits, maximumFractionDigits),
    //   maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
    //   useGrouping: numberSeparatorStyle !== null,
    //   compact: compactNumbers
    // });

    expect(formatNumber(1234, { minDecimals: 2 })).toBe('1,234.00');
  });
});
