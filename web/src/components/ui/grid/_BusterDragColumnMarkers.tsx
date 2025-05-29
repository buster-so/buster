import { cn } from '@/lib/utils';
import type React from 'react';
import { NUMBER_OF_COLUMNS } from './helpers';

export const BusterDragColumnMarkers: React.FC<{
  isDraggingIndex: number | null;
  itemsLength: number;
  stagedLayoutColumns: number[];
  disabled?: boolean;
}> = ({ disabled = false, stagedLayoutColumns, isDraggingIndex, itemsLength }) => {
  const isDragging = isDraggingIndex !== null;
  const snappedDot = getSnappedDot(isDraggingIndex, stagedLayoutColumns);

  return (
    <div
      className="buster-column-markers pointer-events-none absolute mx-0! flex h-2 w-full items-center justify-between"
      style={{
        top: -2,
        transform: 'translateY(-100%)'
      }}>
      <div
        className="relative h-full w-full transition duration-500"
        style={{
          margin: '0px 5px'
        }}>
        {Array.from({ length: NUMBER_OF_COLUMNS + 1 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-border',
              snappedDot === index && 'bg-primary shadow-primary-light',
              `snap-dot-${index} absolute h-2 w-2 rounded-full transition duration-500`
            )}
            style={{
              opacity:
                !isDragging || geHideSnappedDot(isDraggingIndex, index, disabled, itemsLength)
                  ? 0
                  : 1,
              ...hackForTesting(index, itemsLength, isDraggingIndex)
            }}
          />
        ))}
      </div>
    </div>
  );
};

const geHideSnappedDot = (
  isDraggingIndex: number | null,
  index: number,
  disabled: boolean | undefined,
  itemsLength: number
) => {
  if (disabled || index < 3 || index > 9) return true;
  if (itemsLength === 2) return false;
  if (itemsLength === 3) {
    if (isDraggingIndex === 1) return index > NUMBER_OF_COLUMNS / 2;
    if (isDraggingIndex === 2) return index < NUMBER_OF_COLUMNS / 2;
  }
  return true;
};

const getSnappedDot = (isDraggingIndex: number | null, stagedLayoutColumns: number[]) => {
  if (typeof isDraggingIndex === 'number' && stagedLayoutColumns) {
    const adjustDraggingId = isDraggingIndex - 1;
    const column = stagedLayoutColumns.reduce((acc, span, index) => {
      if (index <= adjustDraggingId) {
        return acc + span;
      }
      return acc;
    }, 0);
    return column;
  }
};

//TODO actually figure out why this is happening
const hackForTesting = (
  dotIndex: number,
  numberOfItems: number,
  isDraggingIndex: number | null
): React.CSSProperties => {
  if (numberOfItems === 2) {
    const offsetRecord = {
      4: 4,
      5: 4,
      6: 4,
      7: 5,
      8: 4,
      9: 5,
      DEFAULT: 4
    };

    return {
      left: `calc(${((dotIndex + 0) / NUMBER_OF_COLUMNS) * 100}% - ${offsetRecord[dotIndex as 4] || offsetRecord.DEFAULT}px)`
    };
  }

  if (numberOfItems === 3) {
    const dragIndexRecord = {
      1: {
        3: 7,
        4: 7.5,
        5: 8.7,
        6: 9,
        DEFAULT: 0
      },
      2: {
        6: -1.5,
        7: -1.25,
        8: 0.3,
        9: 2.0,
        DEFAULT: 0
      }
    };
    const offsetRecord = dragIndexRecord[isDraggingIndex as 1];
    if (!offsetRecord) {
      return {};
    }

    return {
      left: `calc(${((dotIndex + 0) / NUMBER_OF_COLUMNS) * 100}% - ${offsetRecord?.[dotIndex as 4] || offsetRecord?.DEFAULT}px)`
    };
  }

  return {
    left: `calc(${((dotIndex + 0) / NUMBER_OF_COLUMNS) * 100}% - 4px)`
  };
};
