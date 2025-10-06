import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { describe, expect, it } from 'vitest';
import { formatLabel } from './columnFormatter';

describe('formatLabel', () => {
  describe('number formatting', () => {
    it('should format numbers with default settings', () => {
      expect(formatLabel(1234.567, { columnType: 'number', style: 'number' })).toBe('1,234.57');
    });

    it('should format numbers with custom fraction digits', () => {
      expect(
        formatLabel(1234.567, {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })
      ).toBe('1,234.567');
    });

    it('should format should pad the digits', () => {
      expect(
        formatLabel(1234, {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 2,
          maximumFractionDigits: 3,
        })
      ).toBe('1,234.00');

      expect(
        formatLabel(1234.49, {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })
      ).toBe('1,234.4900');

      expect(
        formatLabel(1234.49, {
          columnType: 'number',
          style: 'number',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      ).toBe('1,234.5');
    });

    it('should format currency values', () => {
      expect(
        formatLabel(1234.56, {
          columnType: 'number',
          style: 'currency',
          currency: 'USD',
        })
      ).toBe('$1,234.56');

      expect(
        formatLabel(1234.56, {
          columnType: 'number',
          style: 'currency',
          currency: 'EUR',
        })
      ).toBe('€1,234.56');
    });

    it('should handle prefix and suffix', () => {
      expect(
        formatLabel(1234, {
          columnType: 'number',
          style: 'number',
          prefix: 'Pre-',
          suffix: '-Post',
        })
      ).toBe('Pre-1,234-Post');
    });

    it('should handle missing values', () => {
      expect(
        formatLabel(null, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');

      expect(
        formatLabel(undefined, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: null,
        })
      ).toBe('null');
    });

    it('should format percentages', () => {
      expect(
        formatLabel(0.1234, {
          columnType: 'number',
          style: 'percent',
        })
      ).toBe('0.12%');
    });

    it('should apply multiplier', () => {
      expect(
        formatLabel(100, {
          columnType: 'number',
          style: 'number',
          multiplier: 2,
        })
      ).toBe('200');
    });

    it('should handle replaceMissingDataWith with custom string value', () => {
      expect(
        formatLabel(null, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 'N/A',
        })
      ).toBe('N/A');
    });

    it('should handle replaceMissingDataWith with custom string value', () => {
      expect(
        formatLabel(null, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: '',
        })
      ).toBe('');
    });

    it('should handle replaceMissingDataWith with custom number value', () => {
      expect(
        formatLabel(undefined, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: '-999',
        })
      ).toBe('-999');
    });

    it('should apply formatting when using replaceMissingDataWith', () => {
      expect(
        formatLabel(null, {
          columnType: 'number',
          style: 'currency',
          currency: 'USD',
          replaceMissingDataWith: null,
        })
      ).toBe('null');
    });

    it('should handle replaceMissingDataWith with empty string', () => {
      expect(
        formatLabel(undefined, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: '',
        })
      ).toBe('');
    });

    it('should handle complex dollar formatting', () => {
      const rawValue = 3363690.3966666665;
      const config = {
        style: 'currency',
        compactNumbers: false,
        columnType: 'number',
        displayName: '',
        numberSeparatorStyle: ',',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currency: 'USD',
        convertNumberTo: null,
        dateFormat: 'auto',
        useRelativeTime: false,
        isUTC: false,
        multiplier: 1,
        prefix: '',
        suffix: '',
        replaceMissingDataWith: 0,
        makeLabelHumanReadable: true,
      } satisfies ColumnLabelFormat;

      const result = formatLabel(rawValue, config);
      expect(result).toBe('$3,363,690.40');
    });
  });

  describe('string formatting', () => {
    it('should format strings', () => {
      expect(formatLabel('test_string', { columnType: 'text', style: 'string' })).toBe(
        'test_string'
      );
    });
    it('should handle null/undefined strings', () => {
      expect(formatLabel(null, { columnType: 'text', style: 'string' })).toBe('null');
      expect(formatLabel(undefined, { columnType: 'text', style: 'string' })).toBe('null');
    });
    it('should make labels human readable when specified', () => {
      expect(
        formatLabel(
          'test_string',
          {
            columnType: 'text',
            style: 'string',
            makeLabelHumanReadable: true,
          },
          true
        )
      ).toBe('Test String');
    });

    it('should handle undefined strings', () => {
      expect(formatLabel(undefined, { columnType: 'text', style: 'string' })).toBe('null');
    });

    it('should handle null strings', () => {
      expect(formatLabel(null, { columnType: 'text', style: 'string' })).toBe('null');
    });

    it('should handle empty strings', () => {
      expect(formatLabel('', { columnType: 'text', style: 'string' })).toBe('');
    });

    it('should handle null strings', () => {
      expect(formatLabel(null, { columnType: 'text', style: 'number' })).toBe('null');
    });

    it('should handle empty strings', () => {
      expect(formatLabel('', { columnType: 'text', style: 'number' })).toBe('');
    });

    it('should handle replaceMissingDataWith for null values with number', () => {
      expect(
        formatLabel(null, {
          columnType: 'text',
          style: 'string',
          replaceMissingDataWith: 0,
        })
      ).toBe('null');
    });

    it('should handle replaceMissingDataWith for undefined values with string', () => {
      expect(
        formatLabel(undefined, {
          columnType: 'text',
          style: 'string',
          replaceMissingDataWith: 'N/A',
        })
      ).toBe('N/A');
    });

    it('should handle replaceMissingDataWith for null values with empty string', () => {
      expect(
        formatLabel(null, {
          columnType: 'text',
          style: 'string',
          replaceMissingDataWith: '',
        })
      ).toBe('');
    });

    it('should handle replaceMissingDataWith for null values with null', () => {
      expect(
        formatLabel(null, {
          columnType: 'text',
          style: 'string',
          replaceMissingDataWith: null,
        })
      ).toBe('null');
    });
  });

  describe('date formatting', () => {
    const testDate = new Date('2024-03-14T12:00:00Z');
    it('should format dates with default format', () => {
      expect(
        formatLabel(testDate, {
          columnType: 'date',
          style: 'date',
        })
      ).toMatch(/Mar(ch)? 14, 2024/);
    });
    it('should format dates with custom format', () => {
      expect(
        formatLabel(testDate, {
          columnType: 'date',
          style: 'date',
          dateFormat: 'YYYY-MM-DD',
        })
      ).toBe('2024-03-14');
    });
    it('should handle UTC dates', () => {
      expect(
        formatLabel(testDate, {
          columnType: 'date',
          style: 'date',
          dateFormat: 'YYYY-MM-DD HH:mm',
          isUTC: true,
        })
      ).toBe('2024-03-14 12:00');
    });
    it('should convert numbers to date units when specified', () => {
      const currentYear = new Date().getFullYear();
      expect(
        formatLabel(1, {
          columnType: 'date',
          style: 'date',
          convertNumberTo: 'month_of_year',
        })
      ).toMatch(/January/);
      expect(
        formatLabel(1, {
          columnType: 'date',
          style: 'date',
          convertNumberTo: 'day_of_week',
        })
      ).toMatch(/Monday/);
    });

    it('should handle null/undefined dates', () => {
      expect(formatLabel(null, { columnType: 'date', style: 'date' })).toBe('null');
      expect(formatLabel(undefined, { columnType: 'date', style: 'date' })).toBe('null');
    });

    it('should handle empty dates', () => {
      expect(formatLabel('', { columnType: 'date', style: 'date' })).toBe('');
    });

    it('should handle invalid dates', () => {
      expect(formatLabel('invalid date', { columnType: 'date', style: 'date' })).toBe(
        'invalid date'
      );
    });

    it('should handle replaceMissingDataWith', () => {
      expect(
        formatLabel(null, { columnType: 'date', style: 'date', replaceMissingDataWith: 'N/A' })
      ).toBe('N/A');
    });

    it('should not allow replaceMissingDataWith to be a number when columnType is text', () => {
      expect(
        formatLabel(null, { columnType: 'text', style: 'string', replaceMissingDataWith: 0 })
      ).toBe('null');
    });
  });

  describe('percent formatter', () => {
    it('should format percentages', () => {
      expect(formatLabel(0.1234, { columnType: 'number', style: 'percent' })).toBe('0.12%');
    });

    it('should format percentages with custom format', () => {
      expect(
        formatLabel(0.1234, { columnType: 'number', style: 'percent', dateFormat: 'YYYY-MM-DD' })
      ).toBe('0.12%');
    });

    it('should put suffix after the percentage', () => {
      expect(formatLabel(0.1234, { columnType: 'number', style: 'percent', suffix: ' WOW!' })).toBe(
        '0.12% WOW!'
      );
    });
  });

  describe('textProp to Number conversion logic', () => {
    it('should convert string numbers to Number when all conditions are met', () => {
      // All conditions met: textProp not null/undefined, columnType='number',
      // useKeyFormatter=false, replaceMissingDataWith=0, textProp is not object
      expect(
        formatLabel('123.45', {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('123.45');
    });

    it('should convert boolean true to Number when all conditions are met', () => {
      expect(
        formatLabel(true, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('1');
    });

    it('should convert boolean false to Number when all conditions are met', () => {
      expect(
        formatLabel(false, {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');
    });

    it('should NOT convert when textProp is null', () => {
      expect(
        formatLabel(null, {
          columnType: 'number',
          style: 'string',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');
    });

    it('should NOT convert when textProp is undefined', () => {
      expect(
        formatLabel(undefined, {
          columnType: 'number',
          style: 'string',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');
    });

    it('should NOT convert when columnType is not "number"', () => {
      expect(
        formatLabel('123', {
          columnType: 'text',
          style: 'string',
          replaceMissingDataWith: 0,
        })
      ).toBe('123');
    });

    it('should NOT convert when useKeyFormatter is true', () => {
      expect(
        formatLabel(
          '123',
          {
            columnType: 'number',
            style: 'string',
            replaceMissingDataWith: 0,
          },
          true
        )
      ).toBe('123');
    });

    it('should NOT convert when replaceMissingDataWith is not 0', () => {
      expect(
        formatLabel('123', {
          columnType: 'number',
          style: 'string',
          replaceMissingDataWith: null,
        })
      ).toBe('123');

      expect(
        formatLabel('123', {
          columnType: 'number',
          style: 'string',
          replaceMissingDataWith: 'N/A',
        })
      ).toBe('123');

      expect(
        formatLabel('123', {
          columnType: 'number',
          style: 'string',
          replaceMissingDataWith: 1 as 0,
        })
      ).toBe('123');
    });

    it('should NOT convert when textProp is an object (Date)', () => {
      const testDate = new Date('2024-03-14T12:00:00Z');
      const result = formatLabel(testDate, {
        columnType: 'number',
        style: 'string',
        replaceMissingDataWith: 0,
      });
      // Date objects bypass Number conversion and get converted to string
      expect(result).toMatch(/Thu Mar 14 2024/);
    });

    it('should NOT convert when textProp is an object (general object)', () => {
      const testObject = { value: 123 };
      const result = formatLabel(testObject as any, {
        columnType: 'number',
        style: 'string',
        replaceMissingDataWith: 0,
      });
      // Objects bypass Number conversion and get converted to string representation
      expect(result).toBe('[object Object]');
    });

    it('should handle edge case with string "0" when all conditions are met', () => {
      expect(
        formatLabel('0', {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');
    });

    it('should handle edge case with empty string when all conditions are met', () => {
      expect(
        formatLabel('', {
          columnType: 'number',
          style: 'number',
          replaceMissingDataWith: 0,
        })
      ).toBe('0');
    });
  });
});
