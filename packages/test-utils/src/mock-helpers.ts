/** biome-ignore-all lint/correctness/noConstructorReturn: for tests it seems fine */
import { vi } from 'vitest';

// biome-ignore lint/suspicious/noExplicitAny: because this is for testing it seems fine
export function createMockFunction<T extends (...args: any[]) => any>(implementation?: T) {
  return vi.fn(implementation);
}

export function mockConsole() {
  const originalMethods = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const mockedMethods = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  console.log = mockedMethods.log;
  console.error = mockedMethods.error;
  console.warn = mockedMethods.warn;
  console.info = mockedMethods.info;

  return {
    restore: () => {
      console.log = originalMethods.log;
      console.error = originalMethods.error;
      console.warn = originalMethods.warn;
      console.info = originalMethods.info;
    },
    mocks: mockedMethods,
  };
}

export function createMockDate(fixedDate: string | Date) {
  const mockDate = new Date(fixedDate);
  const originalDate = Date;

  // Create a constructor function that returns the mock date
  global.Date = class extends Date {
    constructor() {
      super(mockDate);
      // Return the fixed mock date
      return mockDate;
    }
  } as DateConstructor;

  global.Date.now = vi.fn(() => mockDate.getTime()) as typeof Date.now;

  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
}
