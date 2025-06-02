'use client';

import type React from 'react';
import { useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks';
import { sashClassName } from './base';
import type { ISashProps } from './types';
import { cn } from '@/lib/classMerge';

export default function Sash({
  className,
  render,
  onDragStart,
  onDragging,
  onDragEnd,
  ...others
}: ISashProps) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(false);
  const [draging, setDrag] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    onDragging(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>);
  };

  const handleMouseUp = (e: MouseEvent) => {
    setDrag(false);
    onDragEnd(e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const onMouseEnter = useMemoizedFn(() => {
    timeout.current = setTimeout(() => {
      setActive(true);
    }, 150);
  });

  const onMouseDown = useMemoizedFn((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setDrag(true);
    onDragStart(e);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  });

  const onMouseLeave = useMemoizedFn(() => {
    if (timeout.current) {
      setActive(false);
      clearTimeout(timeout.current);
    }
  });

  return (
    <div
      className={cn(sashClassName, className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      {...others}>
      {render(draging || active)}
    </div>
  );
}
