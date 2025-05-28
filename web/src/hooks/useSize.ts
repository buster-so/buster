'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

interface Size {
  width: number;
  height: number;
}

/**
 * A hook that tracks the size of an element using ResizeObserver
 * @param ref React ref object containing the element to observe
 * @param debounceDelay Optional delay in milliseconds to debounce size updates (default: 0)
 * @returns The current size (width and height) of the element
 */
export function useSize(
  ref: React.RefObject<HTMLElement | null> | React.RefObject<HTMLDivElement | null> | null,
  debounceDelay = 0
): Size | undefined {
  const [size, setSize] = useState<Size>();

  const handleResize = useMemoizedFn((entries: ResizeObserverEntry[]) => {
    if (!Array.isArray(entries) || !entries.length) {
      return;
    }

    const entry = entries[0];
    const { width, height } = entry.contentRect;

    const updateSize = () => {
      setSize((prevSize) => {
        const hasChanged = !prevSize || prevSize.width !== width || prevSize.height !== height;
        return hasChanged ? { width, height } : prevSize;
      });
    };

    if (debounceDelay > 0) {
      const timeoutId = setTimeout(updateSize, debounceDelay);
      return () => clearTimeout(timeoutId);
    }
    updateSize();
  });

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, handleResize]);

  return size;
}
