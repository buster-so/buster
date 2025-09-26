import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { describe, expect, it, vi } from 'vitest';
import { createTickDates } from './createTickDate';

// Mock dependencies
vi.mock('@/lib/date', () => ({
  createDayjsDate: vi.fn((dateStr) => ({
    toDate: () => new Date(dateStr),
  })),
}));

vi.mock('@/lib/columnFormatter', () => ({
  formatLabel: vi.fn((value, format) => {
    if (format.columnType === 'number' && format.style === 'number') {
      return String(value);
    }
    if (format.columnType === 'date' && format.style === 'date') {
      return String(value);
    }
    return String(value);
  }),
}));

describe('createTickDates', () => {
  const createMockFormat = (overrides: Partial<ColumnLabelFormat>): ColumnLabelFormat => ({
    columnType: 'text',
    style: 'string',
    displayName: '',
    numberSeparatorStyle: ',',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    multiplier: 1,
    prefix: '',
    suffix: '',
    replaceMissingDataWith: 0,
    useRelativeTime: false,
    isUTC: false,
    makeLabelHumanReadable: true,
    compactNumbers: false,
    currency: 'USD',
    dateFormat: 'auto',
    convertNumberTo: null,
    ...overrides,
  });

  it('should return null when no date labels are used (text column)', () => {
    const ticks = [['2023-01-01', '2023-02-01']];
    const xAxisKeys = ['date'];
    const columnLabelFormats = {
      date: createMockFormat({ columnType: 'text', style: 'string' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toBeNull();
  });

  it('should return null when no date labels are used (number column with number style)', () => {
    const ticks = [['100', '200']];
    const xAxisKeys = ['value'];
    const columnLabelFormats = {
      value: createMockFormat({ columnType: 'number', style: 'number' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toBeNull();
  });

  it('should process single date axis with date column type and date style', () => {
    const ticks = [['2023-01-01'], ['2023-02-01'], ['2023-03-01']];
    const xAxisKeys = ['date'];
    const columnLabelFormats = {
      date: createMockFormat({ columnType: 'date', style: 'date' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(3);
    expect(result?.[0]).toBeInstanceOf(Date);
    expect(result?.[1]).toBeInstanceOf(Date);
    expect(result?.[2]).toBeInstanceOf(Date);
  });

  it('should process single date axis with number column type and date style', () => {
    const ticks = [['2023-01-01'], ['2023-02-01']];
    const xAxisKeys = ['timestamp'];
    const columnLabelFormats = {
      timestamp: createMockFormat({ columnType: 'number', style: 'date' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(2);
    expect(result?.[0]).toBeInstanceOf(Date);
    expect(result?.[1]).toBeInstanceOf(Date);
  });

  it('should process single quarter axis correctly', () => {
    const ticks = [
      ['2023', '1'],
      ['2023', '2'],
      ['2023', '3'],
      ['2023', '4'],
    ];
    const xAxisKeys = ['year', 'quarter'];
    const columnLabelFormats = {
      year: createMockFormat({ columnType: 'number', style: 'number' }),
      quarter: createMockFormat({
        columnType: 'number',
        style: 'date',
        convertNumberTo: 'quarter',
      }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(4);
    expect(result?.[0]).toBe('2023 Q1');
    expect(result?.[1]).toBe('2023 Q2');
    expect(result?.[2]).toBe('2023 Q3');
    expect(result?.[3]).toBe('2023 Q4');
  });

  it('should handle single axis with quarter format (single x-axis)', () => {
    const ticks = [['1'], ['2'], ['3'], ['4']];
    const xAxisKeys = ['quarter'];
    const columnLabelFormats = {
      quarter: createMockFormat({
        columnType: 'number',
        convertNumberTo: 'quarter',
        style: 'date', // Need this to trigger useDateLabels condition
      }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(4);
    expect(result?.[0]).toBe('Q1');
    expect(result?.[1]).toBe('Q2');
    expect(result?.[2]).toBe('Q3');
    expect(result?.[3]).toBe('Q4');
  });

  it('should handle double axis with quarter and number combination', () => {
    const ticks = [
      ['2023', '1'],
      ['2023', '2'],
      ['2024', '1'],
    ];
    const xAxisKeys = ['year', 'quarter'];
    const columnLabelFormats = {
      year: createMockFormat({ columnType: 'number', style: 'number' }),
      quarter: createMockFormat({
        columnType: 'number',
        convertNumberTo: 'quarter',
        style: 'date', // Need this to trigger useDateLabels condition
      }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(3);
    expect(result?.[0]).toBe('2023 Q1');
    expect(result?.[1]).toBe('2023 Q2');
    expect(result?.[2]).toBe('2024 Q1');
  });

  it('should return null for double axis without quarter and number combination', () => {
    const ticks = [
      ['A', 'B'],
      ['C', 'D'],
    ];
    const xAxisKeys = ['col1', 'col2'];
    const columnLabelFormats = {
      col1: createMockFormat({ columnType: 'text', style: 'string' }),
      col2: createMockFormat({ columnType: 'text', style: 'string' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toBeNull();
  });

  it('should use default column label format when key is missing', () => {
    const ticks = [['2023-01-01']];
    const xAxisKeys = ['missingKey'];
    const columnLabelFormats = {}; // Empty object

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toBeNull(); // Should return null because default format is text/string
  });

  it('should handle multiple ticks in single axis date scenario', () => {
    const ticks = [
      ['2023-01-01', '2023-01-02'],
      ['2023-02-01', '2023-02-02'],
      ['2023-03-01', '2023-03-02'],
    ];
    const xAxisKeys = ['date'];
    const columnLabelFormats = {
      date: createMockFormat({ columnType: 'date', style: 'date' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(6); // 3 ticks * 2 items each = 6 dates
    expect(result?.[0]).toBeInstanceOf(Date);
    expect(result?.[1]).toBeInstanceOf(Date);
    expect(result?.[2]).toBeInstanceOf(Date);
    expect(result?.[3]).toBeInstanceOf(Date);
    expect(result?.[4]).toBeInstanceOf(Date);
    expect(result?.[5]).toBeInstanceOf(Date);
  });

  it('should handle quarter format with correct index positioning', () => {
    const ticks = [
      ['1', '2023'],
      ['2', '2023'],
    ];
    const xAxisKeys = ['quarter', 'year'];
    const columnLabelFormats = {
      quarter: createMockFormat({
        columnType: 'number',
        convertNumberTo: 'quarter',
        style: 'date', // Need this to trigger useDateLabels condition
      }),
      year: createMockFormat({ columnType: 'number', style: 'number' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toHaveLength(2);
    expect(result?.[0]).toBe('Q1 2023'); // Quarter is at index 0
    expect(result?.[1]).toBe('Q2 2023');
  });

  it('should return null for more than 2 x-axis keys', () => {
    const ticks = [['A', 'B', 'C']];
    const xAxisKeys = ['col1', 'col2', 'col3'];
    const columnLabelFormats = {
      col1: createMockFormat({ columnType: 'date', style: 'date' }),
      col2: createMockFormat({ columnType: 'date', style: 'date' }),
      col3: createMockFormat({ columnType: 'date', style: 'date' }),
    };

    const result = createTickDates(ticks, xAxisKeys, columnLabelFormats);

    expect(result).toBeNull();
  });
});
