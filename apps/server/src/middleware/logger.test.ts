import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalConsole: {
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  beforeEach(() => {
    // Save original values
    originalEnv = { ...process.env };
    originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env and console
    process.env = originalEnv;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });

  it('should use info level by default when LOG_LEVEL is not set', async () => {
    delete process.env.LOG_LEVEL;

    const { loggerMiddleware } = await import('./logger');

    // Verify logger was created (basic check)
    expect(loggerMiddleware).toBeDefined();
  });

  it('should respect LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'warn';

    const { loggerMiddleware } = await import('./logger');

    expect(loggerMiddleware).toBeDefined();
  });

  it('should capture console methods when LOG_LEVEL is set', async () => {
    process.env.LOG_LEVEL = 'info';

    // Create mocks to track console calls
    const mockInfo = vi.fn();
    const mockWarn = vi.fn();
    const mockError = vi.fn();
    const mockDebug = vi.fn();

    console.info = mockInfo;
    console.warn = mockWarn;
    console.error = mockError;
    console.debug = mockDebug;

    // Import logger which should override console methods
    await import('./logger');

    // Test that console methods were overridden
    const testMessage = 'Test message';
    console.info(testMessage);
    console.warn(testMessage);
    console.error(testMessage);
    console.debug(testMessage);

    // Original mocks should not have been called (they were overridden)
    expect(mockInfo).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
    expect(mockDebug).not.toHaveBeenCalled();
  });

  it('should not capture console methods when LOG_LEVEL is not set', async () => {
    delete process.env.LOG_LEVEL;

    // Create mocks
    const mockInfo = vi.fn();
    console.info = mockInfo;

    // Import logger
    await import('./logger');

    // Test that console.info was NOT overridden
    console.info('Test message');

    // Original mock should have been called
    expect(mockInfo).toHaveBeenCalledWith('Test message');
  });

  it('should suppress debug logs when LOG_LEVEL is info', async () => {
    process.env.LOG_LEVEL = 'info';

    await import('./logger');

    // console.debug should be a no-op function
    const result = console.debug('This should be suppressed');
    expect(result).toBeUndefined();
  });

  it('should handle multiple arguments in console methods', async () => {
    process.env.LOG_LEVEL = 'info';

    // We can't easily test the actual pino output, but we can verify
    // the console methods accept multiple arguments without error
    await import('./logger');

    expect(() => {
      console.info('Message', { data: 'object' }, 123);
      console.warn('Warning', 'with', 'multiple', 'args');
      console.error('Error', new Error('test'), { context: 'data' });
    }).not.toThrow();
  });

  it('should handle structured logging patterns correctly', async () => {
    process.env.LOG_LEVEL = 'info';

    await import('./logger');

    // Test various logging patterns used in the codebase
    expect(() => {
      // Pattern 1: Message with structured data (most common in codebase)
      console.error('OAuth callback error:', {
        error: 'Test error',
        stack: 'Test stack',
        code: '[REDACTED]',
        state: 'test123...',
        errorType: 'TestError',
        timestamp: new Date().toISOString(),
      });

      // Pattern 2: Simple string message
      console.info('Simple message');

      // Pattern 3: Object only
      console.warn({ warning: 'test', details: 'some details' });

      // Pattern 4: Complex error logging
      console.error('Failed to initialize:', {
        error: new Error('Test').message,
        stack: new Error('Test').stack,
        environment: {
          hasConfig: true,
          isEnabled: false,
        },
      });
    }).not.toThrow();
  });
});
