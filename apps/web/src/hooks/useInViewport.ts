import type React from 'react';
import { type RefObject, useEffect, useRef, useState } from 'react';

interface UseInViewportOptions {
  /** The percentage of the element that needs to be visible (0 to 1) */
  threshold?: number;
  /** Margin around the root element (viewport) */
  rootMargin?: string;
  root?: Element;
}

/**
 * A hook that detects when an element enters or leaves the viewport
 * @param ref - A React ref to the element to observe
 * @param options - Configuration options for the intersection observer
 * @param options.threshold - The percentage of the element that needs to be visible (0 to 1)
 * @param options.rootMargin - Margin around the root element (viewport)
 * @returns A tuple containing a boolean indicating whether the element is in viewport
 * @example
 * ```tsx
 * const [inViewport] = useInViewport(containerRef, {
 *   threshold: 0.33
 * });
 * ```
 */
export const useInViewport = (
  ref: React.RefObject<HTMLElement | null>,
  options: UseInViewportOptions = {}
) => {
  const [inViewport, setInViewport] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(entry.isIntersecting);
      },
      {
        threshold: options.threshold ?? 0,
        rootMargin: options.rootMargin ?? '0px',
        root: options.root,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options.threshold, options.rootMargin, options.root]);

  return [inViewport] as const;
};

export const useHasBeenInViewport = (
  ref: React.RefObject<HTMLElement | null>,
  options: UseInViewportOptions = {}
) => {
  const hasBeenInViewport = useRef(false);

  const [inViewport] = useInViewport(ref, options);
  if (inViewport && !hasBeenInViewport.current) {
    hasBeenInViewport.current = true;
  }

  return hasBeenInViewport.current;
};
