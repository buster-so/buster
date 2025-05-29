import { describe, it, expect } from 'vitest';
import { calculateColumnSpan, columnSpanToPercent, columnSpansToPercent } from './helpers';

describe('Grid Helpers', () => {
  describe('calculateColumnSpan', () => {
    it('should calculate column spans correctly for equal ratios', () => {
      const layout = [1, 1];
      const result = calculateColumnSpan(layout);
      expect(result).toEqual([6, 6]);
    });

    it('should calculate column spans correctly for unequal ratios', () => {
      const layout = [2, 1];
      const result = calculateColumnSpan(layout);
      expect(result).toEqual([8, 4]);
    });

    it('should handle multiple columns', () => {
      const layout = [1, 1, 1, 1];
      const result = calculateColumnSpan(layout);
      expect(result).toEqual([3, 3, 3, 3]);
    });

    it('should handle uneven ratios and round appropriately', () => {
      const layout = [3, 2, 1];
      const result = calculateColumnSpan(layout);
      expect(result).toEqual([6, 4, 2]);
    });
  });

  describe('columnSpanToPercent', () => {
    it('should convert column span to percentage string', () => {
      expect(columnSpanToPercent(6)).toBe('50%');
      expect(columnSpanToPercent(3)).toBe('25%');
      expect(columnSpanToPercent(12)).toBe('100%');
    });

    it('should handle decimal percentages', () => {
      expect(columnSpanToPercent(5)).toBe((5 / 12) * 100 + '%');
    });
  });

  describe('columnSpansToPercent', () => {
    it('should convert array of column spans to percentage strings', () => {
      const spans = [6, 6];
      expect(columnSpansToPercent(spans)).toEqual(['50%', '50%']);
    });

    it('should handle undefined input by returning 100%', () => {
      expect(columnSpansToPercent(undefined)).toEqual(['100%']);
    });

    it('should handle various column span combinations', () => {
      const spans = [3, 6, 3];
      expect(columnSpansToPercent(spans)).toEqual(['25%', '50%', '25%']);
    });
  });
});
