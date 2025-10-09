import { describe, expect, it, vi } from 'vitest';
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
  withTestEnv,
} from './env-helpers';

describe('env-helpers.ts - Unit Tests', () => {
  describe('setupTestEnvironment', () => {
    it('should return TestEnvironment object with cleanup and reset functions', async () => {
      const env = await setupTestEnvironment();

      expect(env).toHaveProperty('cleanup');
      expect(env).toHaveProperty('reset');
      expect(typeof env.cleanup).toBe('function');
      expect(typeof env.reset).toBe('function');
    });

    it('should set NODE_ENV to test', async () => {
      const originalEnv = process.env.NODE_ENV;

      await setupTestEnvironment();

      expect(process.env.NODE_ENV).toBe('test');

      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should store original environment variables', async () => {
      const originalValue = process.env.TEST_VAR;
      process.env.TEST_VAR = 'original-value';

      const env = await setupTestEnvironment();
      process.env.TEST_VAR = 'modified-value';

      await env.cleanup();

      expect(process.env.TEST_VAR).toBe('original-value');

      if (originalValue === undefined) {
        delete process.env.TEST_VAR;
      } else {
        process.env.TEST_VAR = originalValue;
      }
    });

    it('should restore environment on cleanup', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCustomVar = process.env.CUSTOM_TEST_VAR;

      process.env.CUSTOM_TEST_VAR = 'initial-value';

      const env = await setupTestEnvironment();

      process.env.NODE_ENV = 'production';
      process.env.CUSTOM_TEST_VAR = 'changed-value';

      await env.cleanup();

      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
      expect(process.env.CUSTOM_TEST_VAR).toBe('initial-value');

      if (originalCustomVar === undefined) {
        delete process.env.CUSTOM_TEST_VAR;
      }
    });

    it('should reset to test state on reset', async () => {
      const env = await setupTestEnvironment();

      process.env.NODE_ENV = 'production';

      await env.reset();

      expect(process.env.NODE_ENV).toBe('test');

      await env.cleanup();
    });
  });

  describe('withTestEnv', () => {
    it('should wrap test function with environment setup and cleanup', async () => {
      const testFn = vi.fn().mockResolvedValue('test-result');
      const wrappedFn = withTestEnv(testFn);

      const result = await wrappedFn();

      expect(result).toBe('test-result');
      expect(testFn).toHaveBeenCalledTimes(1);
    });

    it('should set up test environment before running test', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testFn = vi.fn().mockImplementation(() => {
        expect(process.env.NODE_ENV).toBe('test');
        return Promise.resolve();
      });

      const wrappedFn = withTestEnv(testFn);
      await wrappedFn();

      expect(testFn).toHaveBeenCalled();

      if (originalNodeEnv !== undefined) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should clean up environment after test completion', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalCustomVar = process.env.CUSTOM_VAR;

      process.env.NODE_ENV = 'production';
      process.env.CUSTOM_VAR = 'original';

      const testFn = vi.fn().mockImplementation(() => {
        process.env.CUSTOM_VAR = 'modified';
        return Promise.resolve();
      });

      const wrappedFn = withTestEnv(testFn);
      await wrappedFn();

      expect(process.env.NODE_ENV).toBe('production');
      expect(process.env.CUSTOM_VAR).toBe('original');

      if (originalNodeEnv !== undefined) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }

      if (originalCustomVar === undefined) {
        process.env.CUSTOM_VAR = undefined;
      }
    });

    it('should clean up environment even if test throws', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFn = withTestEnv(testFn);

      await expect(wrappedFn()).rejects.toThrow('Test error');

      expect(process.env.NODE_ENV).toBe('production');

      if (originalNodeEnv !== undefined) {
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    it('should return the same result as the wrapped function', async () => {
      const expectedResult = { data: 'test', count: 42 };
      const testFn = vi.fn().mockResolvedValue(expectedResult);
      const wrappedFn = withTestEnv(testFn);

      const result = await wrappedFn();

      expect(result).toEqual(expectedResult);
    });
  });

  describe('cleanupTestEnvironment', () => {
    it('should be a function that returns a Promise', () => {
      expect(typeof cleanupTestEnvironment).toBe('function');

      const result = cleanupTestEnvironment();

      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve without error', async () => {
      await expect(cleanupTestEnvironment()).resolves.toBeUndefined();
    });

    it('should be a no-op function', async () => {
      const originalEnv = { ...process.env };

      await cleanupTestEnvironment();

      expect(process.env).toEqual(originalEnv);
    });
  });

  describe('TestEnvironment interface', () => {
    it('should have correct structure', async () => {
      const env: TestEnvironment = await setupTestEnvironment();

      expect(env).toHaveProperty('cleanup');
      expect(env).toHaveProperty('reset');

      expect(typeof env.cleanup).toBe('function');
      expect(typeof env.reset).toBe('function');

      const cleanupResult = env.cleanup();
      const resetResult = env.reset();

      expect(cleanupResult).toBeInstanceOf(Promise);
      expect(resetResult).toBeInstanceOf(Promise);

      await cleanupResult;
      await resetResult;
    });
  });
});
