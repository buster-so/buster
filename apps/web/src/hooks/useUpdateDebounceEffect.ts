'use client';

import { type DependencyList, type EffectCallback, useEffect, useRef } from 'react';

interface UpdateDebounceEffectOptions {
  wait?: number;
}

/**
 * A hook that combines useUpdateEffect and useDebounceEffect functionality.
 * The effect will only be executed:
 * 1. After the first render is skipped
 * 2. After the specified wait time has passed since the last dependency change
 *
 * @param effect - The effect callback to be debounced
 * @param deps - The dependency array for the effect
 * @param options - Debounce options including wait time
 */
export const useUpdateDebounceEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
  options: UpdateDebounceEffectOptions = {}
) => {
  const { wait = 1000 } = options;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      effect();
    }, wait);

    return () => {
      clearTimeout(timeout);
    };
  }, deps);
};
