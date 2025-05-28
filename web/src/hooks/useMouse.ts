'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

interface MouseState {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  elementX: number;
  elementY: number;
}

interface UseMouseOptions {
  target?: React.RefObject<HTMLElement>;
  moveThrottleMs?: number;
  disabled?: boolean;
}

export function useMouse(options: UseMouseOptions = {}) {
  const { target, moveThrottleMs = 0, disabled = false } = options;

  const [state, setState] = useState<MouseState>({
    x: 0,
    y: 0,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    elementX: 0,
    elementY: 0
  });

  const moveTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const updateMouseState = useMemoizedFn((event: MouseEvent) => {
    const element = target?.current ?? document.documentElement;
    const rect = element.getBoundingClientRect();

    setState((prev) => ({
      x: event.x,
      y: event.y,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      elementX: event.clientX - rect.left,
      elementY: event.clientY - rect.top
    }));

    // Reset isMoving after the specified throttle time
    if (moveThrottleMs > 0) {
      if (moveTimer[0]) {
        clearTimeout(moveTimer[0]);
      }
      moveTimer[1](
        setTimeout(() => {
          setState((prev) => ({ ...prev, isMoving: false }));
        }, moveThrottleMs)
      );
    }
  });

  useEffect(() => {
    if (disabled) return;

    const element = target?.current ?? document;

    element.addEventListener('mousemove', updateMouseState as any);

    return () => {
      element.removeEventListener('mousemove', updateMouseState as any);

      // Clear any pending timers
      if (moveTimer[0]) {
        clearTimeout(moveTimer[0]);
      }
    };
  }, [target, updateMouseState, disabled]);

  return state;
}
