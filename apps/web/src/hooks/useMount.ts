'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that executes a callback when a component mounts.
 * @param callback Function to be called on mount
 */
export const useMount = (callback: () => void): void => {
  useEffect(() => {
    callback();
  }, []); // Empty dependency array means this runs once on mount
};

export const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
};
