import { measureTextWidth } from '@/lib';
import sampleSize from 'lodash/sampleSize';
import clamp from 'lodash/clamp';

export const MIN_COLUMN_WIDTH = 80;
export const MAX_COLUMN_WIDTH = 370;

export const createDefaultTableColumnWidths = (
  fields: string[],
  rows: Record<string, string | number | null | Date>[],
  columnWidthsProp: Record<string, number> | undefined,
  cellFormat: (value: string | number | null | Date, field: string) => string,
  headerFormat: (value: string | number | Date | null, columnName: string) => string
) => {
  const sampleOfRows = sampleSize(rows, 15);
  const initial: Record<string, number> = {};
  for (const field of fields) {
    initial[field] =
      columnWidthsProp?.[field] ||
      getDefaultColumnWidth(sampleOfRows, field, cellFormat, headerFormat);
  }
  return initial;
};

const OFFSET = 32; //there are 16px of x padding

const getDefaultColumnWidth = (
  rows: Record<string, string | number | null | Date>[],
  field: string,
  cellFormat: (value: string | number | null | Date, field: string) => string,
  headerFormat: (value: string | number | Date | null, columnName: string) => string
) => {
  const headerString = headerFormat(field, field);
  const longestString = rows.reduce((acc, curr) => {
    const currString = cellFormat(curr[field], field);
    if (!currString) return acc;
    return String(acc).length > String(currString).length ? acc : currString;
  }, headerString);
  const longestWidth = measureTextWidth(longestString).width + OFFSET;
  return clamp(longestWidth, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
};
