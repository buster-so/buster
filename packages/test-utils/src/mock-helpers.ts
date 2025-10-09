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

  // @ts-expect-error
  global.Date = vi.fn(() => mockDate);
  global.Date.now = vi.fn(() => mockDate.getTime());

  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
}
