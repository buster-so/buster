import type { Cell, Column, Row, Table } from '@tanstack/react-table';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CELL_HEIGHT } from '../constants';
import { type HandleTableCopyOptions, handleTableCopy } from './handleTableCopy';

// Mock the global window.getSelection with proper typing
const mockRange = {
  commonAncestorContainer: null as Node | null,
  startContainer: null as Node | null,
  endContainer: null as Node | null,
  intersectsNode: vi.fn(() => true),
};

const mockSelection = {
  rangeCount: 0,
  anchorNode: null as Node | null,
  toString: vi.fn(),
  getRangeAt: vi.fn(() => mockRange),
};

Object.defineProperty(window, 'getSelection', {
  value: vi.fn(() => mockSelection),
  writable: true,
});

// Mock document.createTreeWalker
const mockTreeWalker = {
  nextNode: vi.fn(),
};

Object.defineProperty(document, 'createTreeWalker', {
  value: vi.fn(() => mockTreeWalker),
  writable: true,
});

// Create mock table data
const createMockCell = (value: any, columnId: string): Cell<any, any> =>
  ({
    getValue: vi.fn(() => value),
    column: { id: columnId } as Column<any, any>,
    getContext: vi.fn(),
  }) as any;

const createMockRow = (data: Record<string, any>): Row<any> =>
  ({
    getVisibleCells: vi.fn(() =>
      Object.entries(data).map(([key, value]) => createMockCell(value, key))
    ),
  }) as any;

const createMockTable = (rows: Row<any>[], columns: string[]): Table<any> =>
  ({
    getRowModel: vi.fn(() => ({ rows })),
    getAllColumns: vi.fn(() => columns.map((id) => ({ id }) as Column<any, any>)),
  }) as any;

describe('handleTableCopy', () => {
  let mockEvent: ClipboardEvent;
  let mockContainer: HTMLDivElement;
  let mockParentRef: React.RefObject<HTMLDivElement>;
  let options: HandleTableCopyOptions;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContainer = document.createElement('div');
    mockParentRef = { current: mockContainer };

    mockEvent = {
      clipboardData: {
        setData: vi.fn(),
      },
      preventDefault: vi.fn(),
    } as any;

    // Reset mocks with proper types and defaults
    mockSelection.rangeCount = 1;
    mockSelection.anchorNode = mockContainer;
    mockSelection.toString = vi.fn(() => 'selected text');

    // Ensure mockRange has all required properties
    mockRange.commonAncestorContainer = mockContainer;
    mockRange.startContainer = mockContainer;
    mockRange.endContainer = mockContainer;
    mockRange.intersectsNode = vi.fn(() => true);

    // Reset tree walker
    mockTreeWalker.nextNode = vi.fn(() => null);
  });

  it('should handle basic table data with mixed types', () => {
    const rows = [
      createMockRow({ name: 'John', age: 25, active: true }),
      createMockRow({ name: 'Jane', age: 30, active: false }),
    ];
    const table = createMockTable(rows, ['name', 'age', 'active']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      'John\t25\ttrue\nJane\t30\tfalse'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>John</td><td>25</td><td>true</td></tr><tr><td>Jane</td><td>30</td><td>false</td></tr></tbody></table>'
    );
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should preserve zero values and not replace them with empty strings', () => {
    const rows = [
      createMockRow({ count: 0, percentage: 0.0, balance: 0 }),
      createMockRow({ count: 1, percentage: 5.5, balance: 100 }),
    ];
    const table = createMockTable(rows, ['count', 'percentage', 'balance']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      '0\t0\t0\n1\t5.5\t100'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>1</td><td>5.5</td><td>100</td></tr></tbody></table>'
    );
  });

  it('should handle null and undefined values correctly', () => {
    const rows = [
      createMockRow({ name: 'John', score: null, notes: undefined }),
      createMockRow({ name: 'Jane', score: 95, notes: 'Great work' }),
    ];
    const table = createMockTable(rows, ['name', 'score', 'notes']);

    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/plain',
      'John\t\t\nJane\t95\tGreat work'
    );
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>John</td><td></td><td></td></tr><tr><td>Jane</td><td>95</td><td>Great work</td></tr></tbody></table>'
    );
  });

  it('should return early when no selection exists', () => {
    mockSelection.rangeCount = 0;

    const table = createMockTable([], []);
    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should return early when selection is not within the table container', () => {
    const outsideElement = document.createElement('div');
    mockSelection.anchorNode = outsideElement as any;

    const table = createMockTable([], []);
    options = { table, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    expect(mockEvent.clipboardData!.setData).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle selective copying when DOM elements are found', () => {
    // Create mock DOM structure
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    // Create first row with 3 cells
    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');
    const cell1_1 = document.createElement('td');
    cell1_1.textContent = 'John';
    const cell1_2 = document.createElement('td');
    cell1_2.textContent = '25';
    const cell1_3 = document.createElement('td');
    cell1_3.textContent = 'true';
    row1.appendChild(cell1_1);
    row1.appendChild(cell1_2);
    row1.appendChild(cell1_3);

    // Create second row with 3 cells
    const row2 = document.createElement('tr');
    row2.setAttribute('style', `transform: translateY(${CELL_HEIGHT}px);`);
    const cell2_1 = document.createElement('td');
    cell2_1.textContent = 'Jane';
    const cell2_2 = document.createElement('td');
    cell2_2.textContent = '30';
    const cell2_3 = document.createElement('td');
    cell2_3.textContent = 'false';
    row2.appendChild(cell2_1);
    row2.appendChild(cell2_2);
    row2.appendChild(cell2_3);

    tbody.appendChild(row1);
    tbody.appendChild(row2);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    // Setup mocks to simulate selecting first cell only
    const selectedTdElements = [cell1_1];
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [
      createMockRow({ name: 'John', age: 25, active: true }),
      createMockRow({ name: 'Jane', age: 30, active: false }),
    ];
    const tableData = createMockTable(rows, ['name', 'age', 'active']);
    options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Should only copy the selected cell as plain text (uses selected text from toString())
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'selected text');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledTimes(1); // Only plain text, no HTML
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should return only plain text for single cell, table format for multiple cells', () => {
    // Test single cell - should be plain text only
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');
    const cell1_1 = document.createElement('td');
    cell1_1.textContent = 'SingleCell';
    row1.appendChild(cell1_1);
    tbody.appendChild(row1);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    // Mock selecting single cell
    const selectedTdElements = [cell1_1];
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [createMockRow({ name: 'SingleCell' })];
    const tableData = createMockTable(rows, ['name']);
    const options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Single cell should only set plain text (uses selected text from toString())
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'selected text');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledTimes(1);
  });

  it('should handle partial text selection within a single cell', () => {
    // Test selecting part of a cell's content
    mockSelection.toString = vi.fn(() => 'gle'); // Partial selection of "SingleCell"

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');
    const cell1_1 = document.createElement('td');
    cell1_1.textContent = 'SingleCell';
    row1.appendChild(cell1_1);
    tbody.appendChild(row1);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    const selectedTdElements = [cell1_1];
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [createMockRow({ name: 'SingleCell' })];
    const tableData = createMockTable(rows, ['name']);
    const options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Should copy only the selected portion of text
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'gle');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledTimes(1);
  });

  it('should handle double-click text selection within a single cell', () => {
    // Simulate double-clicking to select text within a cell, which might
    // initially detect multiple cells but should be filtered down to one
    mockSelection.toString = vi.fn(() => 'John'); // Selected text within the cell

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');

    // Create adjacent cells that might be detected by intersectsNode
    const cell1_1 = document.createElement('td');
    cell1_1.textContent = 'John Doe'; // This cell contains the selected text
    const cell1_2 = document.createElement('td');
    cell1_2.textContent = 'Engineer'; // Adjacent cell that should NOT be included

    row1.appendChild(cell1_1);
    row1.appendChild(cell1_2);
    tbody.appendChild(row1);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    // Mock tree walker returning both cells initially (simulating intersectsNode issue)
    const selectedTdElements = [cell1_1, cell1_2]; // Both cells detected initially
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [createMockRow({ name: 'John Doe', role: 'Engineer' })];
    const tableData = createMockTable(rows, ['name', 'role']);
    const options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Should only copy the selected text from the matching cell, not both cells
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'John');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledTimes(1);
  });

  it('should prevent adjacent cell inclusion when double-clicking in cell', () => {
    // Specific test for the reported issue: double-click in cell should not grab next cell
    mockSelection.toString = vi.fn(() => 'Developer'); // Partial text selection

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');

    // Three adjacent cells - should only select middle one
    const cell1_1 = document.createElement('td');
    cell1_1.textContent = 'Jane Smith';
    const cell1_2 = document.createElement('td');
    cell1_2.textContent = 'Senior Developer'; // This one contains our selected text
    const cell1_3 = document.createElement('td');
    cell1_3.textContent = '2024-01-15';

    row1.appendChild(cell1_1);
    row1.appendChild(cell1_2);
    row1.appendChild(cell1_3);
    tbody.appendChild(row1);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    // Simulate intersectsNode finding multiple cells (the bug scenario)
    const selectedTdElements = [cell1_1, cell1_2, cell1_3]; // All three detected initially
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [
      createMockRow({ name: 'Jane Smith', role: 'Senior Developer', date: '2024-01-15' }),
    ];
    const tableData = createMockTable(rows, ['name', 'role', 'date']);
    const options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Should only copy the selected text "Developer", not content from adjacent cells
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'Developer');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledTimes(1);
  });

  it('should handle multi-cell selection maintaining column order', () => {
    // Create mock DOM structure
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    const row1 = document.createElement('tr');
    row1.setAttribute('style', 'transform: translateY(0px);');
    const cell1_1 = document.createElement('td'); // name
    cell1_1.textContent = 'John';
    const cell1_2 = document.createElement('td'); // age
    cell1_2.textContent = '25';
    const cell1_3 = document.createElement('td'); // active
    cell1_3.textContent = 'true';
    row1.appendChild(cell1_1);
    row1.appendChild(cell1_2);
    row1.appendChild(cell1_3);

    tbody.appendChild(row1);
    table.appendChild(tbody);
    mockContainer.appendChild(table);

    // Simulate selecting age and name cells (out of order)
    const selectedTdElements = [cell1_2, cell1_1]; // age, then name
    let callCount = 0;
    mockTreeWalker.nextNode = vi.fn(() => {
      if (callCount < selectedTdElements.length) {
        return selectedTdElements[callCount++];
      }
      return null;
    });

    const rows = [createMockRow({ name: 'John', age: 25, active: true })];
    const tableData = createMockTable(rows, ['name', 'age', 'active']);
    options = { table: tableData, parentRef: mockParentRef };

    handleTableCopy(mockEvent, options);

    // Should maintain column order: name first, then age
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith('text/plain', 'John\t25');
    expect(mockEvent.clipboardData!.setData).toHaveBeenCalledWith(
      'text/html',
      '<table><tbody><tr><td>John</td><td>25</td></tr></tbody></table>'
    );
  });
});
