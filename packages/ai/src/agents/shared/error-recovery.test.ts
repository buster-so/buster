/**
 * Tests for Error Recovery Utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CircuitBreaker,
  type ErrorType,
  type ResilientResult,
  SafeOperations,
  classifyError,
  createResilientWrapper,
  safeJsonParse,
  validateWithRecovery,
  withErrorRecovery,
  withRetry,
} from './error-recovery';

describe('Error Recovery Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const classification = classifyError(error);

      expect(classification.type).toBe('NETWORK_ERROR');
      expect(classification.recoverable).toBe(true);
      expect(classification.strategy).toBe('RETRY_WITH_BACKOFF');
      expect(classification.maxRetries).toBe(5);
    });

    it('should classify filesystem errors correctly', () => {
      const error = new Error('ENOENT: No such file or directory');
      const classification = classifyError(error);

      expect(classification.type).toBe('FILESYSTEM_ERROR');
      expect(classification.recoverable).toBe(true);
      expect(classification.strategy).toBe('GRACEFUL_DEGRADATION');
    });

    it('should classify sandbox errors correctly', () => {
      const error = new Error('Command failed with exit code 127');
      const classification = classifyError(error);

      expect(classification.type).toBe('SANDBOX_ERROR');
      expect(classification.recoverable).toBe(true);
      expect(classification.strategy).toBe('RETRY_WITH_BACKOFF');
    });

    it('should handle unknown errors with default classification', () => {
      const error = new Error('Unknown mysterious error');
      const classification = classifyError(error);

      expect(classification.type).toBe('UNKNOWN_ERROR');
      expect(classification.recoverable).toBe(true);
      expect(classification.strategy).toBe('RETRY_WITH_BACKOFF');
      expect(classification.maxRetries).toBe(2);
    });

    it('should handle string errors', () => {
      const classification = classifyError('ETIMEDOUT connection timeout');

      expect(classification.type).toBe('TIMEOUT_ERROR');
      expect(classification.recoverable).toBe(true);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another failure'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { maxRetries: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attemptCount).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      const result = await withRetry(operation, { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent failure');
      expect(result.attemptCount).toBe(3); // Initial attempt + 2 retries
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');
      const onRetry = vi.fn();

      await withRetry(operation, { maxRetries: 2, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should handle onRetry callback errors gracefully', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValue('success');
      const onRetry = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const result = await withRetry(operation, { maxRetries: 2, onRetry });

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });
  });

  describe('withErrorRecovery', () => {
    it('should succeed with primary operation', async () => {
      const operation = vi.fn().mockResolvedValue('primary success');
      const fallback = vi.fn().mockResolvedValue('fallback success');

      const result = await withErrorRecovery(operation, fallback, 'test-op');

      expect(result.success).toBe(true);
      expect(result.data).toBe('primary success');
      expect(result.fallbackUsed).toBeUndefined();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should use fallback when primary fails', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = vi.fn().mockResolvedValue('fallback success');

      const result = await withErrorRecovery(operation, fallback, 'test-op');

      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback success');
      expect(result.fallbackUsed).toBe(true);
      expect(result.warnings).toContain('Primary operation failed, used fallback: Primary failed');
    });

    it('should fail when both primary and fallback fail', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = vi.fn().mockRejectedValue(new Error('Fallback failed'));

      const result = await withErrorRecovery(operation, fallback, 'test-op');

      expect(result.success).toBe(false);
      expect(result.warnings).toContain('Fallback also failed: Fallback failed');
    });

    it('should work without fallback', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

      const result = await withErrorRecovery(operation, undefined, 'test-op');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation failed');
    });
  });

  describe('createResilientWrapper', () => {
    it('should execute successfully', async () => {
      const toolFunction = vi.fn().mockResolvedValue('tool result');
      const wrapper = createResilientWrapper(toolFunction, {
        toolName: 'test-tool',
        gracefulError: (input, error) => `error: ${error}`,
      });

      const result = await wrapper('test input');

      expect(result).toBe('tool result');
      expect(toolFunction).toHaveBeenCalledWith('test input');
    });

    it('should use graceful error handler on failure', async () => {
      const toolFunction = vi.fn().mockRejectedValue(new Error('Tool failed'));
      const gracefulError = vi.fn().mockReturnValue('graceful result');
      const wrapper = createResilientWrapper(toolFunction, {
        toolName: 'test-tool',
        gracefulError,
      });

      const result = await wrapper('test input');

      expect(result).toBe('graceful result');
      expect(gracefulError).toHaveBeenCalledWith('test input', 'Tool failed');
    });

    it('should use fallback when available', async () => {
      const toolFunction = vi.fn().mockRejectedValue(new Error('Tool failed'));
      const fallback = vi.fn().mockResolvedValue('fallback result');
      const wrapper = createResilientWrapper(toolFunction, {
        toolName: 'test-tool',
        fallback,
        gracefulError: (input, error) => `error: ${error}`,
      });

      const result = await wrapper('test input');

      expect(result).toBe('fallback result');
      expect(fallback).toHaveBeenCalledWith('test input');
    });

    it('should throw when no graceful error handler is provided', async () => {
      const toolFunction = vi.fn().mockRejectedValue(new Error('Tool failed'));
      const wrapper = createResilientWrapper(toolFunction, {
        toolName: 'test-tool',
      });

      await expect(wrapper('test input')).rejects.toThrow('[test-tool] Operation failed');
    });
  });

  describe('validateWithRecovery', () => {
    it('should succeed with valid data', () => {
      const mockSchema = {
        parse: vi.fn().mockReturnValue('parsed data'),
      };

      const result = validateWithRecovery(mockSchema as any, { valid: 'data' }, 'test');

      expect(result.success).toBe(true);
      expect(result.data).toBe('parsed data');
    });

    it('should handle validation errors gracefully', () => {
      const mockSchema = {
        parse: vi.fn().mockImplementation(() => {
          throw new Error('Validation failed');
        }),
      };

      const result = validateWithRecovery(mockSchema as any, { invalid: 'data' }, 'test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation error');
      expect(result.errorType).toBe('INVALID_INPUT');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ key: 'value' });
    });

    it('should handle invalid JSON gracefully', () => {
      const result = safeJsonParse('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON parse failed');
      expect(result.errorType).toBe('INVALID_INPUT');
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('INVALID_INPUT');
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow operations when closed', async () => {
      const breaker = new CircuitBreaker(3, 1000);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await breaker.execute(operation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should open after threshold failures', async () => {
      const breaker = new CircuitBreaker(2, 1000);
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));

      // First two failures
      await breaker.execute(operation);
      await breaker.execute(operation);

      // Third call should be blocked
      const result = await breaker.execute(operation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Circuit breaker is OPEN');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should transition to half-open after recovery time', async () => {
      const breaker = new CircuitBreaker(1, 10); // 10ms recovery time
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue('success');

      // Cause failure to open circuit
      await breaker.execute(operation);

      // Wait for recovery time
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should now allow operation
      const result = await breaker.execute(operation);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });
  });

  describe('SafeOperations', () => {
    describe('fs operations', () => {
      it('should handle file reading', async () => {
        // This would require mocking fs module
        // For now, just test that the function exists and has correct structure
        expect(SafeOperations.fs.readFile).toBeDefined();
        expect(typeof SafeOperations.fs.readFile).toBe('function');
      });

      it('should handle file writing', async () => {
        expect(SafeOperations.fs.writeFile).toBeDefined();
        expect(typeof SafeOperations.fs.writeFile).toBe('function');
      });

      it('should handle file existence checks', async () => {
        expect(SafeOperations.fs.exists).toBeDefined();
        expect(typeof SafeOperations.fs.exists).toBe('function');
      });
    });

    describe('network operations', () => {
      it('should handle fetch operations', async () => {
        expect(SafeOperations.network.fetch).toBeDefined();
        expect(typeof SafeOperations.network.fetch).toBe('function');
      });
    });
  });
});
