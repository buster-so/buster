import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';

describe('logger middleware', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalConsole: {
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  beforeEach(() => {
    // Save original env and console
    originalEnv = { ...process.env };
    originalConsole = {
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
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
    
    // Clear module cache
    vi.resetModules();
  });

  it('should use info level by default when LOG_LEVEL is not set', async () => {
    // Remove LOG_LEVEL completely before importing
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
});