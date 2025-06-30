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
          hidden ? 'border-transparent' : 'border-border',
          !disabled ? (hidden ? 'hover:border-border/80' : 'hover:border-primary') : undefined,
          isVertical ? 'cursor-col-resize border-l' : 'cursor-row-resize border-t',
          isDragging ? (hidden ? 'border-border/80' : 'border-primary') : undefined,
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
