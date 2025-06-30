import { describe, it, expect } from 'vitest';
import { LineChartPropsSchema, type LineChartProps } from './lineChartProps';

describe('LineChartPropsSchema', () => {
  describe('valid inputs', () => {
    it('should accept "stack" as lineGroupType', () => {
      const input = { lineGroupType: 'stack' };
      const result = LineChartPropsSchema.parse(input);
      expect(result.lineGroupType).toBe('stack');
    });

    it('should accept "percentage-stack" as lineGroupType', () => {
      const input = { lineGroupType: 'percentage-stack' };
      const result = LineChartPropsSchema.parse(input);
      expect(result.lineGroupType).toBe('percentage-stack');
    });

    it('should accept null as lineGroupType', () => {
      const input = { lineGroupType: null };
      const result = LineChartPropsSchema.parse(input);
      expect(result.lineGroupType).toBe(null);
    });

    it('should accept empty object and use default null value', () => {
      const input = {};
      const result = LineChartPropsSchema.parse(input);
      expect(result.lineGroupType).toBe(null);
    });

    it('should accept undefined and use default null value', () => {
      const input = { lineGroupType: null };
      const result = LineChartPropsSchema.parse(input);
      expect(result.lineGroupType).toBe(null);
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid string values', () => {
      const input = { lineGroupType: 'invalid-value' };
      expect(() => LineChartPropsSchema.parse(input)).toThrow();
    });

    it('should reject numeric values', () => {
      const input = { lineGroupType: 123 };
      expect(() => LineChartPropsSchema.parse(input)).toThrow();
    });

    it('should reject boolean values', () => {
      const input = { lineGroupType: true };
      expect(() => LineChartPropsSchema.parse(input)).toThrow();
    });

    it('should reject array values', () => {
      const input = { lineGroupType: ['stack'] };
      expect(() => LineChartPropsSchema.parse(input)).toThrow();
    });

    it('should reject object values', () => {
      const input = { lineGroupType: { type: 'stack' } };
      expect(() => LineChartPropsSchema.parse(input)).toThrow();
    });
  });

  describe('safe parsing', () => {
    it('should return success for valid input', () => {
      const input = { lineGroupType: 'stack' };
      const result = LineChartPropsSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lineGroupType).toBe('stack');
      }
    });

    it('should return error for invalid input', () => {
      const input = { lineGroupType: 'invalid' };
      const result = LineChartPropsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer LineChartProps type', () => {
      const validData: LineChartProps = {
        lineGroupType: 'stack'
      };
      expect(LineChartPropsSchema.parse(validData)).toEqual(validData);

      const validDataWithNull: LineChartProps = {
        lineGroupType: null
      };
      expect(LineChartPropsSchema.parse(validDataWithNull)).toEqual(validDataWithNull);

      const validDataWithPercentage: LineChartProps = {
        lineGroupType: 'percentage-stack'
      };
      expect(LineChartPropsSchema.parse(validDataWithPercentage)).toEqual(validDataWithPercentage);
    });
  });

  describe('default behavior', () => {
    it('should use null as default when property is omitted', () => {
      const result = LineChartPropsSchema.parse({});
      expect(result).toEqual({ lineGroupType: null });
    });

    it('should preserve explicitly set null values', () => {
      const input = { lineGroupType: null };
      const result = LineChartPropsSchema.parse(input);
      expect(result).toEqual({ lineGroupType: null });
    });
  });
});
