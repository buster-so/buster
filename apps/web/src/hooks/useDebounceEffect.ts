'use client';

import { type DependencyList, type EffectCallback, useEffect } from 'react';

interface DebounceEffectOptions {
  wait?: number;
}

/**
 * A hook that combines useEffect with debouncing functionality.
 * The effect will only be executed after the specified wait time has passed since the last dependency change.
 *
 * @param effect - The effect callback to be debounced
 * @param deps - The dependency array for the effect
 * @param options - Debounce options including wait time
 */
export const useDebounceEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
  options: DebounceEffectOptions = {}
) => {
  const { wait = 1000 } = options;

  useEffect(() => {
    const timeout = setTimeout(() => {
      effect();
    }, wait);

    return () => {
      clearTimeout(timeout);
    };
  }, deps);
};
