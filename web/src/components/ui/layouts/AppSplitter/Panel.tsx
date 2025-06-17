'use client';

import React from 'react';
import { cn } from '@/lib/classMerge';

interface IPanelProps {
  children: React.ReactNode;
  width?: number | 'auto';
  height?: number | 'auto';
  minSize?: number;
  maxSize?: number;
  className?: string;
  hidden?: boolean;
  style?: React.CSSProperties;
}

export const Panel: React.FC<IPanelProps> = React.memo(
  ({ children, width, height, minSize, maxSize, className, hidden, style }) => {
    if (hidden) return null;

    const panelStyle: React.CSSProperties = {
      ...style,
      ...(width !== 'auto' && width !== undefined && { width: `${width}px` }),
      ...(height !== 'auto' && height !== undefined && { height: `${height}px` }),
      ...(minSize !== undefined && { minWidth: `${minSize}px`, minHeight: `${minSize}px` }),
      ...(maxSize !== undefined && { maxWidth: `${maxSize}px`, maxHeight: `${maxSize}px` })
    };

    return (
      <div
        className={cn(
          // 'overflow-auto',
          // When we have a specific width or height, we should not grow/shrink
          width !== 'auto' || height !== 'auto' ? 'flex-shrink-0 flex-grow-0' : 'flex-1',
          className
        )}
        style={panelStyle}>
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
