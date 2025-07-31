'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that detects if the current device supports touch input.
 * Uses multiple detection methods for better accuracy across different devices and browsers.
 * @returns boolean indicating whether the device supports touch
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    const detectTouchDevice = (): boolean => {
      // Multiple detection methods for better accuracy
      const hasTouchStart = 'ontouchstart' in window;
      const hasMaxTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
      const hasMsMaxTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;

      // Match media query for touch devices
      const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

      return hasTouchStart || hasMaxTouchPoints || hasMsMaxTouchPoints || hasCoarsePointer;
    };

    setIsTouchDevice(detectTouchDevice());

    // Optional: Listen for changes (though this is rare, it can happen with hybrid devices)
    const handleResize = () => {
      setIsTouchDevice(detectTouchDevice());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isTouchDevice;
};
