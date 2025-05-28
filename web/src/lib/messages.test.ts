import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric/';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import {
  DATE_TYPES,
  NUMBER_TYPES,
  TEXT_TYPES,
  isDateColumnType,
  isNumericColumnStyle,
  isNumericColumnType,
  simplifyColumnType
} from './messages';

describe('simplifyColumnType', () => {
  test('should return "number" for numeric types', () => {
    NUMBER_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('number');
    });
    expect(simplifyColumnType('number')).toBe('number');
  });

  test('should return "text" for text types', () => {
    TEXT_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('text');
    });
    expect(simplifyColumnType('text')).toBe('text');
  });

  test('should return "date" for date types', () => {
    DATE_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('date');
    });
    expect(simplifyColumnType('date')).toBe('date');
  });

  test('should return "text" for unknown types', () => {
    expect(simplifyColumnType('unknown')).toBe('text');
    expect(simplifyColumnType('boolean')).toBe('text');
    expect(simplifyColumnType('')).toBe('text');
  });
});

describe('isNumericColumnType', () => {
  test('should return true for "number" type', () => {
    expect(isNumericColumnType('number')).toBe(true);
  });

  test('should return false for non-number types', () => {
    expect(isNumericColumnType('text')).toBe(false);
    expect(isNumericColumnType('date')).toBe(false);
  });
});

describe('isNumericColumnStyle', () => {
  test('should return true for numeric styles', () => {
    expect(isNumericColumnStyle('number')).toBe(true);
    expect(isNumericColumnStyle('percent')).toBe(true);
    expect(isNumericColumnStyle('currency')).toBe(true);
  });

  test('should return false for non-numeric styles', () => {
    expect(isNumericColumnStyle('string')).toBe(false);
    expect(isNumericColumnStyle('date')).toBe(false);
    expect(isNumericColumnStyle(undefined)).toBe(false);
  });
});

describe('isDateColumnType', () => {
  test('should return true for "date" type', () => {
    expect(isDateColumnType('date')).toBe(true);
  });

  test('should return false for non-date types', () => {
    expect(isDateColumnType('number')).toBe(false);
    expect(isDateColumnType('text')).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isDateColumnType(undefined)).toBe(false);
  });
});
