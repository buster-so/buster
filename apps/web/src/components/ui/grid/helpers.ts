import {
  MAX_NUMBER_OF_COLUMNS as SERVER_MAX_NUMBER_OF_COLUMNS,
  MAX_NUMBER_OF_ITEMS as SERVER_MAX_NUMBER_OF_ITEMS,
  MAX_ROW_HEIGHT as SERVER_MAX_ROW_HEIGHT,
  MIN_NUMBER_OF_COLUMNS as SERVER_MIN_NUMBER_OF_COLUMNS,
  MIN_ROW_HEIGHT as SERVER_MIN_ROW_HEIGHT,
  NUMBER_OF_COLUMNS as SERVER_NUMBER_OF_COLUMNS,
} from '@buster/server-shared/dashboards';

export const NUMBER_OF_COLUMNS = SERVER_NUMBER_OF_COLUMNS;
export const MIN_NUMBER_OF_COLUMNS = SERVER_MIN_NUMBER_OF_COLUMNS;
export const MAX_NUMBER_OF_COLUMNS = SERVER_MAX_NUMBER_OF_COLUMNS;
export const MAX_NUMBER_OF_ITEMS = SERVER_MAX_NUMBER_OF_ITEMS;
export const MIN_ROW_HEIGHT = SERVER_MIN_ROW_HEIGHT;
export const MAX_ROW_HEIGHT = SERVER_MAX_ROW_HEIGHT;

export const HEIGHT_OF_DROPZONE = 100;
export const SASH_SIZE = 12;

export const NEW_ROW_ID = 'new-row-that-is-super-cool';
export const TOP_SASH_ID = 'top-sash-id';

export const calculateColumnSpan = (layout: number[]) => {
  const columnSpans: number[] = [];
  const totalColumns = layout.reduce((sum, ratio) => sum + ratio, 0);
  for (const ratio of layout) {
    const columnSpan = Math.round((ratio / totalColumns) * NUMBER_OF_COLUMNS);
    columnSpans.push(columnSpan);
  }
  return columnSpans;
};

export const columnSpanToPercent = (columnSpan: number): string => {
  return `${(columnSpan / NUMBER_OF_COLUMNS) * 100}%`;
};

export const columnSpansToPercent = (columnSpans: number[] | undefined) => {
  if (!columnSpans) return ['100%'];
  return columnSpans.map((columnSpan) => columnSpanToPercent(columnSpan));
};
