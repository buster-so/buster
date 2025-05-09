import {
  createDefaultTableColumnWidths,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH
} from './createDefaultTableColumnWidths';
import { measureTextWidth } from '@/lib';

// Mock the measureTextWidth function
jest.mock('@/lib', () => ({
  measureTextWidth: jest.fn().mockImplementation((text) => ({
    width: Math.min(Math.max(text.toString().length * 10, MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH),
    height: 20
  }))
}));

describe('createDefaultTableColumnWidths', () => {
  const mockMeasureTextWidth = measureTextWidth as jest.MockedFunction<typeof measureTextWidth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultCellFormat = (value: string | number | null | Date, field: string) =>
    value?.toString() || '';

  const defaultHeaderFormat = (value: string | number | Date | null, columnName: string) =>
    columnName;

  test('should return default column widths based on content', () => {
    const fields = ['name', 'age'];
    const rows = [
      { name: 'John', age: 30 },
      { name: 'Elizabeth', age: 25 }
    ];

    // Elizabeth is the longest string (9 chars * 10 + OFFSET)
    mockMeasureTextWidth.mockImplementation((text) => {
      if (text === 'Elizabeth') return { width: 90, height: 20 };
      if (text === 'name') return { width: 40, height: 20 };
      if (text === 'age') return { width: 30, height: 20 };
      if (text === '30') return { width: 20, height: 20 };
      if (text === '25') return { width: 20, height: 20 };
      return { width: text.toString().length * 10, height: 20 };
    });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      defaultCellFormat,
      defaultHeaderFormat
    );

    expect(result).toEqual({
      name: 90 + 32 / 1.5, // Elizabeth's width + OFFSET
      age: MIN_COLUMN_WIDTH // MIN_COLUMN_WIDTH since calculated width is less than minimum
    });
  });

  test('should use columnWidthsProp when provided', () => {
    const fields = ['name', 'age'];
    const rows = [
      { name: 'John', age: 30 },
      { name: 'Elizabeth', age: 25 }
    ];
    const columnWidthsProp = {
      name: 200,
      age: 150
    };

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      columnWidthsProp,
      defaultCellFormat,
      defaultHeaderFormat
    );

    expect(result).toEqual(columnWidthsProp);
  });

  test('should respect MIN_COLUMN_WIDTH', () => {
    const fields = ['id'];
    const rows = [{ id: 1 }, { id: 2 }];

    // Mock all text widths to be very small
    mockMeasureTextWidth.mockReturnValue({ width: 10, height: 20 });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      defaultCellFormat,
      defaultHeaderFormat
    );

    expect(result).toEqual({
      id: MIN_COLUMN_WIDTH
    });
  });

  test('should respect MAX_COLUMN_WIDTH', () => {
    const fields = ['description'];
    const rows = [
      {
        description:
          'This is an extremely long description that should exceed the maximum width allowed for a column'
      }
    ];

    // Mock text width to be very large
    mockMeasureTextWidth.mockReturnValue({ width: 500, height: 20 });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      defaultCellFormat,
      defaultHeaderFormat
    );

    expect(result).toEqual({
      description: MAX_COLUMN_WIDTH
    });
  });

  test('should handle empty rows', () => {
    const fields = ['name', 'age'];
    const rows: Record<string, string | number | null | Date>[] = [];

    // Mock header widths
    mockMeasureTextWidth.mockImplementation((text) => {
      if (text === 'name') return { width: 40, height: 20 };
      if (text === 'age') return { width: 30, height: 20 };
      return { width: text.toString().length * 10, height: 20 };
    });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      defaultCellFormat,
      defaultHeaderFormat
    );

    expect(result).toEqual({
      name: 40 + 32 / 1.5, // Header width + OFFSET, but will be clamped to MIN
      age: 30 + 32 / 1.5 // Header width + OFFSET, but will be clamped to MIN
    });

    // Since both calculated widths would be below MIN_COLUMN_WIDTH
    expect(result.name).toBe(MIN_COLUMN_WIDTH);
    expect(result.age).toBe(MIN_COLUMN_WIDTH);
  });

  test('should use custom formatters', () => {
    const fields = ['name'];
    const rows = [{ name: 'John' }];

    const customCellFormat = jest.fn().mockImplementation(() => 'FORMATTED_CELL');
    const customHeaderFormat = jest.fn().mockImplementation(() => 'FORMATTED_HEADER');

    mockMeasureTextWidth.mockImplementation((text) => {
      if (text === 'FORMATTED_CELL') return { width: 120, height: 20 };
      if (text === 'FORMATTED_HEADER') return { width: 160, height: 20 };
      return { width: text.toString().length * 10, height: 20 };
    });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      customCellFormat,
      customHeaderFormat
    );

    expect(customCellFormat).toHaveBeenCalledWith('John', 'name');
    expect(customHeaderFormat).toHaveBeenCalledWith('name', 'name');
    expect(result).toEqual({
      name: 160 + 32 / 1.5 // FORMATTED_HEADER width + OFFSET
    });
  });

  test('should handle null and undefined values', () => {
    const fields = ['name', 'age'];
    const rows = [
      { name: null, age: null },
      { name: 'John', age: 30 }
    ];

    mockMeasureTextWidth.mockImplementation((text) => {
      if (text === 'John') return { width: 40, height: 20 };
      if (text === 'name') return { width: 40, height: 20 };
      if (text === 'age') return { width: 30, height: 20 };
      if (text === '30') return { width: 20, height: 20 };
      if (text === '') return { width: 0, height: 20 };
      return { width: text.toString().length * 10, height: 20 };
    });

    const result = createDefaultTableColumnWidths(
      fields,
      rows,
      undefined,
      defaultCellFormat,
      defaultHeaderFormat
    );

    // Should use John's width for name column, and header width for age column
    expect(result).toEqual({
      name: 40 + 32 / 1.5, // John's width + OFFSET, clamped to MIN
      age: 30 + 32 / 1.5 // age header width + OFFSET, clamped to MIN
    });

    // Since both calculated widths would be below MIN_COLUMN_WIDTH
    expect(result.name).toBe(MIN_COLUMN_WIDTH);
    expect(result.age).toBe(MIN_COLUMN_WIDTH);
  });
});
