import { describe, expect, it, vi } from 'vitest';
import { createMockDate, createMockFunction, mockConsole } from './mock-helpers';

describe('mock-helpers.ts - Unit Tests', () => {
  describe('createMockFunction', () => {
    it('should create a mock function without implementation', () => {
      const mockFn = createMockFunction();

      expect(vi.isMockFunction(mockFn)).toBe(true);
      expect(mockFn).toHaveBeenCalledTimes(0);
    });

    it('should create a mock function with implementation', () => {
      const implementation = (x: number, y: number) => x + y;
      const mockFn = createMockFunction(implementation);

      expect(vi.isMockFunction(mockFn)).toBe(true);
      expect(mockFn(2, 3)).toBe(5);
      expect(mockFn).toHaveBeenCalledWith(2, 3);
    });

    it('should allow mock function to be configured', () => {
      const mockFn = createMockFunction();
      mockFn.mockReturnValue('test-value');

      expect(mockFn()).toBe('test-value');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('mockConsole', () => {
    it('should mock console methods', () => {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalInfo = console.info;

      const { mocks, restore } = mockConsole();

      expect(vi.isMockFunction(console.log)).toBe(true);
      expect(vi.isMockFunction(console.error)).toBe(true);
      expect(vi.isMockFunction(console.warn)).toBe(true);
      expect(vi.isMockFunction(console.info)).toBe(true);

      expect(mocks.log).toBe(console.log);
      expect(mocks.error).toBe(console.error);
      expect(mocks.warn).toBe(console.warn);
      expect(mocks.info).toBe(console.info);

      restore();
      expect(console.log).toBe(originalLog);
      expect(console.error).toBe(originalError);
      expect(console.warn).toBe(originalWarn);
      expect(console.info).toBe(originalInfo);
    });

    it('should track console method calls', () => {
      const { mocks, restore } = mockConsole();

      console.log('test message');
      console.error('error message');
      console.warn('warning message');
      console.info('info message');

      expect(mocks.log).toHaveBeenCalledWith('test message');
      expect(mocks.error).toHaveBeenCalledWith('error message');
      expect(mocks.warn).toHaveBeenCalledWith('warning message');
      expect(mocks.info).toHaveBeenCalledWith('info message');

      restore();
    });

    it('should restore original console methods', () => {
      const originalLog = console.log;
      const { restore } = mockConsole();

      expect(console.log).not.toBe(originalLog);

      restore();

      expect(console.log).toBe(originalLog);
    });
  });

  describe('createMockDate', () => {
    it('should mock Date constructor with string input', () => {
      const fixedDateString = '2024-01-01T00:00:00.000Z';
      const { restore } = createMockDate(fixedDateString);

      const mockDate = new Date();
      expect(mockDate.toISOString()).toBe(fixedDateString);

      restore();
    });

    it('should mock Date constructor with Date input', () => {
      const fixedDate = new Date('2024-06-15T12:30:00.000Z');
      const { restore } = createMockDate(fixedDate);

      const mockDate = new Date();
      expect(mockDate.getTime()).toBe(fixedDate.getTime());

      restore();
    });

    it('should mock Date.now()', () => {
      const fixedDate = new Date('2024-03-10T08:45:00.000Z');
      const { restore } = createMockDate(fixedDate);

      expect(Date.now()).toBe(fixedDate.getTime());

      restore();
    });

    it('should restore original Date constructor', () => {
      const originalDate = Date;
      const { restore } = createMockDate('2024-01-01');

      expect(Date).not.toBe(originalDate);

      restore();

      expect(Date).toBe(originalDate);
    });

    it('should work with multiple mock dates', () => {
      const date1 = '2024-01-01T00:00:00.000Z';
      const date2 = '2024-12-31T23:59:59.999Z';

      const mock1 = createMockDate(date1);
      expect(new Date().toISOString()).toBe(date1);

      mock1.restore();

      const mock2 = createMockDate(date2);
      expect(new Date().toISOString()).toBe(date2);

      mock2.restore();
    });
  });
});
