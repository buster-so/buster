export const NUMBER_OF_COLUMNS = 12;
export const MIN_NUMBER_OF_COLUMNS = 3;
export const MAX_NUMBER_OF_COLUMNS = 12;
export const MAX_NUMBER_OF_ITEMS = 4;
export const MIN_ROW_HEIGHT = 320;
export const MAX_ROW_HEIGHT = 550;
export const HEIGHT_OF_DROPZONE = 100;
export const SASH_SIZE = 12;

export const NEW_ROW_ID = 'new-row-that-is-super-cool';
export const TOP_SASH_ID = 'top-sash-id';

export const calculateColumnSpan = (layout: number[]) => {
  const columnSpans: number[] = [];
  const totalColumns = layout.reduce((sum, ratio) => sum + ratio, 0);
  layout.forEach((ratio) => {
    const columnSpan = Math.round((ratio / totalColumns) * NUMBER_OF_COLUMNS);
    columnSpans.push(columnSpan);
  });
  return columnSpans;
};

export const columnSpanToPercent = (columnSpan: number): string => {
  return `${(columnSpan / NUMBER_OF_COLUMNS) * 100}%`;
};

export const columnSpansToPercent = (columnSpans: number[] | undefined) => {
  if (!columnSpans) return ['100%'];
  return columnSpans.map((columnSpan) => columnSpanToPercent(columnSpan));
};
