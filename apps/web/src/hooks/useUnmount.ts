'use client';

import { useEffect } from 'react';

/**
 * Hook that executes a callback when a component unmounts.
 * @param callback Function to be called on unmount
 */
export const useUnmount = (callback: () => void): void => {
  useEffect(() => {
    return () => {
      callback();
    };
  }, []); // Empty dependency array means this runs once on mount
};
