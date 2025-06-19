'use client';

import { useEffect, useState } from 'react';

export const useWindowWidth = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 900);
    };

    // Initial check
    checkWidth();

    // Add event listener
    window.addEventListener('resize', checkWidth);

    // Cleanup
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return isMobile;
};
