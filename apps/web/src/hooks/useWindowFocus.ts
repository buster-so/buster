'use client';

import { useEffect } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

export function useWindowFocus(callback: () => void) {
  const memoizedCallback = useMemoizedFn(callback);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        memoizedCallback();
      }
    };

    const handleFocus = () => {
      memoizedCallback();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [memoizedCallback]);
}
