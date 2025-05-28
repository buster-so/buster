'use client';

import { type DependencyList, useLayoutEffect, useRef } from 'react';

/**
 * A hook that executes a function on the second update and subsequent updates.
 * Similar to useLayoutEffect but skips the first render.
 * @param effect The effect function to run
 * @param deps The dependencies array
 */
export const useUpdateLayoutEffect = (effect: () => void, deps?: DependencyList) => {
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
  }, deps);
};
