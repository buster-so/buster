'use client';

import { type RefObject, useEffect, useState } from 'react';

interface ScrollState {
  left: number;
  top: number;
  direction: 'up' | 'down' | null;
  isScrolling: boolean;
}

export const useScroll = (
  element?: HTMLElement | RefObject<HTMLDivElement> | null | RefObject<HTMLDivElement | null>,
  shouldUpdate?: () => boolean
): ScrollState => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    left: 0,
    top: 0,
    direction: null,
    isScrolling: false
  });

  useEffect(() => {
    const getElement = () => {
      if (!element) return window;
      if ('current' in element) return element.current;
      return element;
    };

    const target = getElement();
    let lastScrollY = target === window ? window.scrollY : (target as HTMLElement)?.scrollTop || 0;
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      // Check if we should update based on the shouldUpdate function
      if (shouldUpdate && !shouldUpdate()) {
        return;
      }

      const currentScrollY =
        target === window ? window.scrollY : (target as HTMLElement)?.scrollTop || 0;
      const currentScrollX =
        target === window ? window.scrollX : (target as HTMLElement)?.scrollLeft || 0;

      setScrollState({
        left: currentScrollX,
        top: currentScrollY,
        direction:
          currentScrollY > lastScrollY ? 'down' : currentScrollY < lastScrollY ? 'up' : null,
        isScrolling: true
      });

      lastScrollY = currentScrollY;

      // Clear the previous timeout
      clearTimeout(scrollTimeout);

      // Set a new timeout to indicate scrolling has stopped
      scrollTimeout = setTimeout(() => {
        setScrollState((prev) => ({
          ...prev,
          isScrolling: false
        }));
      }, 150);
    };

    if (target) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (target) {
        target.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(scrollTimeout);
    };
  }, [element, shouldUpdate]);

  return scrollState;
};
