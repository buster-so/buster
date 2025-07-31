'use client';

import { cn } from '@/lib/utils';

import { ThemesStyle } from './ThemeStyles';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
}

export function ThemeWrapper({ children, className, defaultTheme }: ThemeWrapperProps) {
  return (
    <div
      className={cn(
        // `theme-${defaultTheme || config.theme}`,
        'themes-wrapper',
        'w-full',
        className
      )}>
      <ThemesStyle />

      {children}
    </div>
  );
}
