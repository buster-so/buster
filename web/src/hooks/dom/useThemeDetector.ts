'use client';

import { ENABLE_DARK_MODE } from '@/context/BusterStyles/BusterStyles';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useLayoutEffect, useState } from 'react';
import { isServer } from '@tanstack/react-query';

const DARK_MODE_MEDIA = '(prefers-color-scheme: dark)';

export const useThemeDetector = ({ addDarkClass }: { addDarkClass?: boolean }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(() => getSystemTheme());

  const getSystemTheme = (e?: MediaQueryList | MediaQueryListEvent) => {
    if (!ENABLE_DARK_MODE) return false;
    if (isServer) return false;
    if (!e) e = window.matchMedia(DARK_MODE_MEDIA);
    const isDark = e.matches;
    return isDark;
  };

  const getCurrentTheme = useMemoizedFn(() => {
    if (!isServer) {
      document.documentElement.style.display = 'none';

      const isDarkMode = getSystemTheme();

      if (addDarkClass) {
        const d = document.documentElement;
        d.classList.toggle('dark', isDarkMode);
        d.classList.toggle('bg-black', isDarkMode);
        d.setAttribute('data-color-scheme', !isDarkMode ? 'light' : 'dark');
      }

      // trigger reflow so that overflow style is applied
      document.documentElement.style.display = '';

      return isDarkMode;
    }
    return false;
  });

  const mqListener = useMemoizedFn(() => {
    setIsDarkTheme(getCurrentTheme());
  });

  useEffect(() => {
    const darkThemeMq = window.matchMedia(DARK_MODE_MEDIA);
    darkThemeMq.addEventListener('change', mqListener);
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, []);

  useLayoutEffect(() => {
    setIsDarkTheme(getCurrentTheme());
  }, []);

  return isDarkTheme;
};
