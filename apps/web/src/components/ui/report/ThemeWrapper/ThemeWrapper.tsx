'use client';

import { cn } from '@/lib/utils';

import { ThemesStyle } from './ThemeStyles';
import { THEME_RESET_STYLE } from '@/styles/theme-reset';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
}

export function ThemeWrapper({ children, className, defaultTheme }: ThemeWrapperProps) {
  return (
    <>
      <div
        style={THEME_RESET_STYLE}
        className={cn('themes-wrapper h-full w-full overflow-hidden antialiased', className)}>
        {children}
      </div>

      <ThemesStyle />
    </>
  );
}
