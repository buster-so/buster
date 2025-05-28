import type React from 'react';

export type ResizeableGridDragItem = {
  id: string;
  children: React.ReactNode;
};

export type BusterResizeableGridRow = {
  items: ResizeableGridDragItem[];
  columnSizes?: number[]; //columns sizes 1 - 12. MUST add up to 12
  rowHeight?: number; //pixel based!
  id: string;
};
