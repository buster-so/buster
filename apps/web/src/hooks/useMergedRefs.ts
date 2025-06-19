import { useCallback } from 'react';

type ReactRef<T> = React.RefCallback<T> | React.MutableRefObject<T> | null;

/**
 * Merges multiple React refs into a single ref callback.
 * Useful when you need to use multiple refs on a single element.
 *
 * @param refs - Array of refs to merge
 * @returns A callback ref that updates all provided refs
 *
 * @example
 * ```tsx
 * const Component = React.forwardRef((props, ref) => {
 *   const localRef = useRef(null);
 *   const mergedRef = useMergedRefs([ref, localRef]);
 *
 *   return <div ref={mergedRef} />;
 * });
 * ```
 */
export function useMergedRefs<T = unknown>(refs: ReactRef<T>[]): React.RefCallback<T> {
  return useCallback(
    (element: T | null) => {
      for (const ref of refs) {
        if (!ref) continue;

        // Handle callback refs
        if (typeof ref === 'function') {
          ref(element);
          continue;
        }

        // Handle object refs
        (ref as React.MutableRefObject<T | null>).current = element;
      }
    },
    [refs]
  );
}
