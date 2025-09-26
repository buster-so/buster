import type { Table } from '@tanstack/react-table';
import { CELL_HEIGHT } from '../constants';

export interface HandleTableCopyOptions {
  table: Table<Record<string, string | number | Date | null>>;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Handles clipboard copy events to preserve table structure
 * @param event - The clipboard event
 * @param options - Table and container reference
 */
export function handleTableCopy(event: ClipboardEvent, options: HandleTableCopyOptions): void {
  const { table, parentRef } = options;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const container = parentRef.current;
  if (!container || !container.contains(selection.anchorNode)) {
    return;
  }

  // Check if selection is within our table
  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  // Get the selected range
  const range = selection.getRangeAt(0);

  // Find all selected cells by checking which td elements intersect with the selection
  const selectedCells: { rowIndex: number; columnId: string; value: string }[] = [];

  // First, try to determine if selection is within a single cell
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // Find the TD elements that contain the start and end of the selection
  const startTd =
    startContainer && startContainer.nodeType === Node.ELEMENT_NODE
      ? (startContainer as Element).closest('td')
      : startContainer?.parentElement?.closest('td');
  const endTd =
    endContainer && endContainer.nodeType === Node.ELEMENT_NODE
      ? (endContainer as Element).closest('td')
      : endContainer?.parentElement?.closest('td');

  const visibleRows = table.getRowModel().rows;
  let selectedTdElements: HTMLTableCellElement[] = [];

  // If selection is clearly within a single cell, only include that cell
  if (startTd && endTd && startTd === endTd) {
    selectedTdElements = [startTd as HTMLTableCellElement];
  } else {
    // Multi-cell selection or fallback - use tree walker to find all intersecting cells
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeName === 'TD' && range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let node = walker.nextNode();
    while (node) {
      selectedTdElements.push(node as HTMLTableCellElement);
      node = walker.nextNode();
    }

    // Additional check: if we found multiple cells but the selection text suggests single cell,
    // filter to just the one that actually contains the selection
    if (selectedTdElements.length > 1) {
      const selectedText = selection.toString().trim();

      // If there's meaningful selected text, find the cell that contains it
      if (selectedText.length > 0) {
        const matchingCell = selectedTdElements.find((cell) => {
          const cellText = cell.textContent || '';
          // Check if this cell contains the selected text and the selected text
          // represents a meaningful portion of the cell content
          return (
            cellText.includes(selectedText) &&
            selectedText.length >= Math.min(3, cellText.length * 0.3)
          );
        });

        // If we found a matching cell, use only that one
        if (matchingCell) {
          selectedTdElements = [matchingCell];
        }
      }

      // Alternative check: if selection range is completely contained within one cell's bounds
      if (selectedTdElements.length > 1) {
        const fullyContainedCell = selectedTdElements.find((cell) => {
          try {
            // Create a range that spans the entire cell content
            const cellRange = document.createRange();
            cellRange.selectNodeContents(cell);

            // Check if the selection range is completely contained within this cell
            return (
              cellRange.isPointInRange(range.startContainer, range.startOffset) &&
              cellRange.isPointInRange(range.endContainer, range.endOffset)
            );
          } catch {
            return false;
          }
        });

        if (fullyContainedCell) {
          selectedTdElements = [fullyContainedCell];
        }
      }
    }
  }

  // Map selected TD elements to their row and column data
  for (const tdElement of selectedTdElements) {
    // Find the row element (tr) that contains this td
    const trElement = tdElement.closest('tr');
    if (!trElement) continue;

    // Find the row index by checking the transform translateY value
    const style = trElement.getAttribute('style');
    const translateYMatch = style?.match(/translateY\((\d+(?:\.\d+)?)px\)/);
    if (!translateYMatch) continue;

    const translateY = parseFloat(translateYMatch[1]);
    const rowIndex = Math.floor(translateY / CELL_HEIGHT);

    const row = visibleRows[rowIndex];
    if (!row) continue;

    // Find the column index by checking the position of this td within its row
    const tdElements = Array.from(trElement.children).filter((child) => child.tagName === 'TD');
    const columnIndex = tdElements.indexOf(tdElement);

    const visibleCells = row.getVisibleCells();
    const cell = visibleCells[columnIndex];

    if (cell) {
      const value = cell.getValue();
      const stringValue = value !== null && value !== undefined ? String(value) : '';

      selectedCells.push({
        rowIndex,
        columnId: cell.column.id,
        value: stringValue,
      });
    }
  }

  // Handle single cell selection
  if (selectedCells.length === 1) {
    const singleCell = selectedCells[0];

    // If selection is within a single cell, use the actual selected text
    // rather than the entire cell value
    const selectedText = selection.toString().trim();
    const textToCopy = selectedText || singleCell.value;

    event.clipboardData?.setData('text/plain', textToCopy);
    event.preventDefault();
    return;
  }

  // If no cells were found, fall back to copying all visible table data
  // This can happen in test environments or when DOM selection fails
  if (selectedCells.length === 0) {
    const visibleRows = table.getRowModel().rows;
    const columnOrder = table.getAllColumns().map((col) => col.id);

    // Create tab-separated values for the entire visible data
    const tsvData = visibleRows
      .map((row) =>
        columnOrder
          .map((colId) => {
            const cell = row.getVisibleCells().find((cell) => cell.column.id === colId);
            if (!cell) return '';
            const value = cell.getValue();
            return value !== null && value !== undefined ? String(value) : '';
          })
          .join('\t')
      )
      .join('\n');

    // Create HTML table structure
    const htmlTable = `<table><tbody>${visibleRows
      .map(
        (row) =>
          `<tr>${columnOrder
            .map((colId) => {
              const cell = row.getVisibleCells().find((cell) => cell.column.id === colId);
              if (!cell) return '<td></td>';
              const value = cell.getValue();
              const stringValue = value !== null && value !== undefined ? String(value) : '';
              return `<td>${stringValue}</td>`;
            })
            .join('')}</tr>`
      )
      .join('')}</tbody></table>`;

    // Set clipboard data with both formats
    event.clipboardData?.setData('text/plain', tsvData);
    event.clipboardData?.setData('text/html', htmlTable);
    event.preventDefault();
    return;
  }

  // Group cells by row and sort by column order
  const cellsByRow = new Map<number, Map<string, string>>();
  const columnOrder = table.getAllColumns().map((col) => col.id);

  for (const cell of selectedCells) {
    if (!cellsByRow.has(cell.rowIndex)) {
      cellsByRow.set(cell.rowIndex, new Map());
    }
    const rowMap = cellsByRow.get(cell.rowIndex);
    if (rowMap) {
      rowMap.set(cell.columnId, cell.value);
    }
  }

  // Build TSV data respecting column order
  const sortedRowIndices = Array.from(cellsByRow.keys()).sort((a, b) => a - b);
  const tsvData = sortedRowIndices
    .map((rowIndex) => {
      const rowCells = cellsByRow.get(rowIndex);
      if (!rowCells) return '';

      const selectedColumnIds = Array.from(rowCells.keys());

      // Maintain column order for multi-column selections
      const orderedColumns = columnOrder.filter((colId) => selectedColumnIds.includes(colId));

      return orderedColumns.map((colId) => rowCells.get(colId) || '').join('\t');
    })
    .join('\n');

  // Build HTML table structure
  const htmlTable = `<table><tbody>${sortedRowIndices
    .map((rowIndex) => {
      const rowCells = cellsByRow.get(rowIndex);
      if (!rowCells) return '';

      const selectedColumnIds = Array.from(rowCells.keys());
      const orderedColumns = columnOrder.filter((colId) => selectedColumnIds.includes(colId));

      return `<tr>${orderedColumns
        .map((colId) => `<td>${rowCells.get(colId) || ''}</td>`)
        .join('')}</tr>`;
    })
    .join('')}</tbody></table>`;

  // Set clipboard data with both formats
  event.clipboardData?.setData('text/plain', tsvData);
  event.clipboardData?.setData('text/html', htmlTable);
  event.preventDefault();
}
