import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { SlackIntegrationError } from '../types/errors';
import { generateSecureState, isExpired, validateWithSchema } from './validation-helpers';

describe('validation-helpers', () => {
  describe('validateWithSchema', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().min(0),
      email: z.string().email(),
    });

    it('should return parsed data when validation succeeds', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = validateWithSchema(testSchema, validData, 'Validation failed');

      expect(result).toEqual(validData);
    });

    it('should throw SlackIntegrationError when validation fails', () => {
      const invalidData = {
        name: 'John Doe',
        age: -5, // Invalid: negative age
        email: 'not-an-email', // Invalid email
      };

      expect(() => {
        validateWithSchema(testSchema, invalidData, 'Custom error message');
      }).toThrow(SlackIntegrationError);

      try {
        validateWithSchema(testSchema, invalidData, 'Custom error message');
      } catch (error) {
        expect(error).toBeInstanceOf(SlackIntegrationError);
        if (error instanceof SlackIntegrationError) {
          expect(error.code).toBe('UNKNOWN_ERROR');
          expect(error.message).toBe('Custom error message');
          expect(error.retryable).toBe(false);
          expect(error.details).toHaveProperty('zodError');
        }
      }
    });

    it('should handle missing required fields', () => {
      const incompleteData = {
        name: 'John Doe',
        // Missing age and email
      };

      expect(() => {
        validateWithSchema(testSchema, incompleteData, 'Missing required fields');
      }).toThrow(SlackIntegrationError);
    });

    it('should handle completely invalid data types', () => {
      const wrongTypeData = 'not an object';

      expect(() => {
        validateWithSchema(testSchema, wrongTypeData, 'Invalid data type');
      }).toThrow(SlackIntegrationError);
    });

    it('should handle null and undefined', () => {
      expect(() => {
        validateWithSchema(testSchema, null, 'Null data');
      }).toThrow(SlackIntegrationError);

      expect(() => {
        validateWithSchema(testSchema, undefined, 'Undefined data');
      }).toThrow(SlackIntegrationError);
    });
  });

  describe('generateSecureState', () => {
    it('should generate a 64-character hex string', () => {
      const state = generateSecureState();

      expect(state).toHaveLength(64);
      expect(state).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique states', () => {
      const states = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        states.add(generateSecureState());
      }

      // All generated states should be unique
      expect(states.size).toBe(iterations);
    });

    it('should use crypto.getRandomValues', () => {
      const mockGetRandomValues = vi.spyOn(crypto, 'getRandomValues');

      generateSecureState();

      expect(mockGetRandomValues).toHaveBeenCalledTimes(1);
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));

      mockGetRandomValues.mockRestore();
    });
  });

  describe('isExpired', () => {
    it('should return true when timestamp is in the past', () => {
      const pastTimestamp = Date.now() - 1000; // 1 second ago

      expect(isExpired(pastTimestamp)).toBe(true);
    });

    it('should return false when timestamp is in the future', () => {
      const futureTimestamp = Date.now() + 1000; // 1 second from now

      expect(isExpired(futureTimestamp)).toBe(false);
    });

    it('should return true when timestamp equals current time', () => {
      const now = Date.now();

      // Mock Date.now to return a slightly later time
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => now + 1);

      expect(isExpired(now)).toBe(true);

      Date.now = originalDateNow;
    });

    it('should handle edge cases', () => {
      expect(isExpired(0)).toBe(true); // Unix epoch
      expect(isExpired(Number.MAX_SAFE_INTEGER)).toBe(false); // Far future
    });
  });
});
