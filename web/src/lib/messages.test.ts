import type { SimplifiedColumnType } from '@/api/asset_interfaces/metric/';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { describe, expect, it } from 'vitest';
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
  it('should return "number" for numeric types', () => {
    NUMBER_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('number');
    });
    expect(simplifyColumnType('number')).toBe('number');
  });
  it('should return "text" for text types', () => {
    TEXT_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('text');
    });
    expect(simplifyColumnType('text')).toBe('text');
  });
  it('should return "date" for date types', () => {
    DATE_TYPES.forEach((type) => {
      expect(simplifyColumnType(type)).toBe('date');
    });
    expect(simplifyColumnType('date')).toBe('date');
  });
  it('should return "text" for unknown types', () => {
    expect(simplifyColumnType('unknown')).toBe('text');
    expect(simplifyColumnType('boolean')).toBe('text');
    expect(simplifyColumnType('')).toBe('text');
  });
});

describe('isNumericColumnType', () => {
  it('should return true for "number" type', () => {
    expect(isNumericColumnType('number')).toBe(true);
  });
  it('should return false for non-number types', () => {
    expect(isNumericColumnType('text')).toBe(false);
    expect(isNumericColumnType('date')).toBe(false);
  });
});

describe('isNumericColumnStyle', () => {
  it('should return true for numeric styles', () => {
    expect(isNumericColumnStyle('number')).toBe(true);
    expect(isNumericColumnStyle('percent')).toBe(true);
    expect(isNumericColumnStyle('currency')).toBe(true);
  });
  it('should return false for non-numeric styles', () => {
    expect(isNumericColumnStyle('string')).toBe(false);
    expect(isNumericColumnStyle('date')).toBe(false);
    expect(isNumericColumnStyle(undefined)).toBe(false);
  });
});

describe('isDateColumnType', () => {
  it('should return true for "date" type', () => {
    expect(isDateColumnType('date')).toBe(true);
  });
  it('should return false for non-date types', () => {
    expect(isDateColumnType('number')).toBe(false);
    expect(isDateColumnType('text')).toBe(false);
  });
  it('should return false for undefined', () => {
    expect(isDateColumnType(undefined)).toBe(false);
  });
});
