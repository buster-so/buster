'use client';

import React from 'react';
import { cn } from '@/lib/classMerge';

interface ISplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  split: 'vertical' | 'horizontal';
  className?: string;
  hidden?: boolean;
  disabled?: boolean;
}

export const Splitter: React.FC<ISplitterProps> = React.memo(
  ({ onMouseDown, isDragging, split, className, hidden, disabled }) => {
    const isVertical = split === 'vertical';

    return (
      <div
        className={cn(
          'relative flex items-center justify-center transition-colors',
          hidden ? 'bg-transparent' : 'bg-border',
          !disabled ? (hidden ? 'hover:bg-border/80' : 'hover:bg-primary') : undefined,
          isVertical ? 'min-w-[1px] cursor-col-resize' : 'min-h-[1px] cursor-row-resize',
          isDragging ? (hidden ? 'bg-border/80' : 'bg-primary') : undefined,
          disabled && 'cursor-default',
          className
        )}
        onMouseDown={disabled ? undefined : onMouseDown}>
        <div
          className={cn(
            'absolute flex items-center justify-center',
            isVertical ? '-inset-x-1 inset-y-0' : 'inset-x-0 -inset-y-1'
          )}
        />
      </div>
    );
  }
);

Splitter.displayName = 'Splitter';
