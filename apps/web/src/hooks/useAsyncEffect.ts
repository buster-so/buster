'use client';

import { useEffect } from 'react';

type AsyncEffect = () => Promise<undefined | (() => void)>;
type DependencyList = ReadonlyArray<unknown>;

/**
 * A hook for handling async effects in React components.
 * Similar to useEffect, but designed for async operations with proper cleanup handling.
 *
 * @param effect - An async function that contains the effect logic
 * @param deps - Optional dependency array that determines when the effect should re-run
 */
export const useAsyncEffect = (effect: AsyncEffect, deps?: DependencyList) => {
  useEffect(() => {
    let mounted = true;
    let cleanup: undefined | (() => void);

    const runEffect = async () => {
      try {
        cleanup = await effect();
      } catch (err) {
        console.error('Error in async effect:', err);
      }
    };

    runEffect();

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, deps);
};
