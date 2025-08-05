'use client';

import { cn } from '@/lib/utils';

import { THEME_RESET_COLORS, THEME_RESET_STYLE } from '@/styles/theme-reset';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
}

const EDITOR_THEME = { ...THEME_RESET_COLORS.light, ...THEME_RESET_STYLE };

export function ThemeWrapper({ children, className, defaultTheme }: ThemeWrapperProps) {
  return (
    <>
      <div
        style={EDITOR_THEME}
        className={cn(
          'themes-wrapper h-full w-full overflow-hidden bg-transparent antialiased',
          className
        )}>
        {children}
      </div>

      {/* <ThemesStyle /> */}
    </>
  );
}
