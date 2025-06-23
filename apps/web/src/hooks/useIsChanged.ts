'use client';

import isEqual from 'lodash/isEqual';
import { useRef } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

export const useIsChanged = <T = unknown>() => {
  const previousValue = useRef<T | null>(null);

  const onCheckIsChanged = useMemoizedFn((value: T) => {
    const isChanged = !isEqual(previousValue.current, value);
    previousValue.current = value;
    return isChanged;
  });

  return { onCheckIsChanged, previousValue };
};
