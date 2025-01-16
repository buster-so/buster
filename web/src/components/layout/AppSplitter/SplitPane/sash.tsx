import React, { useRef, useState } from 'react';
import { classNames, sashClassName } from './base';
import { ISashProps } from './types';
import { useMemoizedFn } from 'ahooks';

export default function Sash({
  className,
  render,
  onDragStart,
  onDragging,
  onDragEnd,
  ...others
}: ISashProps) {
  const timeout = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [draging, setDrag] = useState(false);

  const handleMouseMove = function (e: any) {
    onDragging(e);
  };

  const handleMouseUp = function (e: any) {
    setDrag(false);
    onDragEnd(e);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const onMouseEnter = useMemoizedFn(() => {
    //@ts-ignore
    timeout.current = setTimeout(() => {
      setActive(true);
    }, 150);
  });

  const onMouseDown = useMemoizedFn((e: any) => {
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
      role="Resizer"
      className={classNames(sashClassName, className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      {...others}>
      {render(draging || active)}
    </div>
  );
}
