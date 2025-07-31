'use client';

import { useMounted } from '@/hooks/useMount';
import { useThemesConfig } from './useThemesConfig';

export function ThemesStyle() {
  const { activeTheme } = useThemesConfig();
  const mounted = useMounted();

  if (!activeTheme || !mounted) {
    return null;
  }

  return (
    <style>
      {`
.themes-wrapper,
[data-chart] {
  ${Object.entries(activeTheme.light)
    .map(([key, value]) => `${key}: hsl(${value});`)
    .join('\n')}
 
}

.dark .themes-wrapper,
.dark [data-chart] {
  ${Object.entries(activeTheme.dark)
    .map(([key, value]) => `${key}: hsl(${value});`)
    .join('\n')}
 
}
  `}
    </style>
  );
}
