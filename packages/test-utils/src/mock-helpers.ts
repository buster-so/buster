import { vi } from 'vitest';

export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T
) {
  return vi.fn(implementation);
}

export function mockConsole() {
  const originalConsole = console;
  const mockedMethods = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
  
  Object.assign(console, mockedMethods);
  
  return {
    restore: () => {
      Object.assign(console, originalConsole);
    },
    mocks: mockedMethods,
  };
}

export function createMockDate(fixedDate: string | Date) {
  const mockDate = new Date(fixedDate);
  const originalDate = Date;
  
  // @ts-ignore
  global.Date = vi.fn(() => mockDate);
  global.Date.now = vi.fn(() => mockDate.getTime());
  
  return {
    restore: () => {
      global.Date = originalDate;
    },
  };
} 