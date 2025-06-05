import { describe, expect, it } from 'vitest';
import { regression } from './regression';

describe('regression', () => {
  describe('linear', () => {
    it('should calculate linear regression correctly', () => {
      const test = [
        [0, 1],
        [32, 67],
        [12, 79]
      ] as [number, number][];

      const result = regression.linear(test, { precision: 2 });

      // Check structure of result
      expect(result).toHaveProperty('points');
      expect(result).toHaveProperty('predict');
      expect(result).toHaveProperty('equation');
      expect(result).toHaveProperty('r2');
      expect(result).toHaveProperty('string');

      // Check equation coefficients (gradient and intercept)
      expect(result.equation).toHaveLength(2);
      expect(typeof result.equation[0]).toBe('number');
      expect(typeof result.equation[1]).toBe('number');

      // Test prediction function
      const prediction = result.predict(20);
      expect(Array.isArray(prediction)).toBe(true);
      expect(prediction).toHaveLength(2);
      expect(typeof prediction[0]).toBe('number');
      expect(typeof prediction[1]).toBe('number');

      // Test points array
      expect(Array.isArray(result.points)).toBe(true);
      expect(result.points).toHaveLength(3);
      result.points.forEach((point: number[]) => {
        expect(Array.isArray(point)).toBe(true);
        expect(point).toHaveLength(2);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
      });

      // Test r2 value
      expect(typeof result.r2).toBe('number');
      expect(result.r2).toBeGreaterThanOrEqual(0);
      expect(result.r2).toBeLessThanOrEqual(1);

      // Test string format
      expect(typeof result.string).toBe('string');
      expect(result.string).toMatch(/^y = [-\d.]+x( [+-] [-\d.]+)?$/);
    });
  });
});
