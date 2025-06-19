import type { SelectAxisContainerId } from '../config';

export interface SelectAxisItemProps {
  id: string;
  originalId: string;
}

export interface SelectAxisDraggableItemProps {
  item: SelectAxisItemProps;
  zoneId: SelectAxisContainerId;
  isPlaceholder?: boolean;
}

//DROPZONES

//THIS IS EXTERNALs
export interface DropZone {
  id: SelectAxisContainerId;
  title: string;
  items: SelectAxisItem[]; //needs to be ids
}

export interface DropZoneInternal {
  id: SelectAxisContainerId;
  title: string;
  items: SelectAxisItemProps[];
}

//DRAGGING
export interface DraggedItem {
  id: string;
  originalId: string;
  sourceZone: SelectAxisContainerId | null;
  targetZone: SelectAxisContainerId | null;
}

export type SelectAxisItem = string;
