import { useDroppable } from '@dnd-kit/core';
import type React from 'react';
import { cn } from '@/lib/utils';
import { HEIGHT_OF_DROPZONE, NEW_ROW_ID } from './helpers';

export const BusterNewItemDropzone: React.FC = () => {
  const { setNodeRef, isOver } = useDroppable({
    id: NEW_ROW_ID
  });

  return (
    <div
      ref={setNodeRef}
      style={{ maxHeight: HEIGHT_OF_DROPZONE, minHeight: HEIGHT_OF_DROPZONE }}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-sm border-dashed',
        'transition-colors duration-200 ease-in-out',
        'text-base',
        'text-gray-dark border',
        isOver && 'bg-primary-light text-background border-solid'
      )}>
      Drag here to create a new row
    </div>
  );
};
