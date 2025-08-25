'use client';

import { cn } from '@/lib/utils';

import { THEME_RESET_COLORS, THEME_RESET_STYLE } from '@/styles/theme-reset';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
  id?: string;
}

/**
 * Theme overrides for the report editor
 *
 * We need to override the default theme for the report editor because:
 *
 * 1. **Consistent Styling**: The report editor needs to maintain consistent
 *    appearance regardless of the parent application's theme (light/dark mode)
 *
 * 2. **Design System Isolation**: Reports should render with their own design
 *    system to ensure they look the same when shared, exported, or embedded
 *
 * 3. **Theme Reset**: We reset CSS variables and styles to prevent inheritance
 *    from parent components that might interfere with report rendering
 *
 * 4. **Cross-Environment Consistency**: Reports need to look identical whether
 *    viewed in the editor, shared via link, or exported as PDF/image
 *
 * The EDITOR_THEME combines light theme colors with reset styles to create
 * a clean, controlled environment for report content.
 */

// ${Object.entries(themesConfig.activeTheme.light)
//   .map(([key, value]) => `${key}: hsl(${value});`)
//   .join('\n')}

const CSS_VARIABLES_THEME = Object.entries(THEME_RESET_COLORS.light).reduce(
  (acc, [key, value]) => {
    acc[`--${key}`] = `hsl(${value})`;
    return acc;
  },
  {} as Record<string, string>
);

const EDITOR_THEME = { ...CSS_VARIABLES_THEME, ...THEME_RESET_STYLE };

export function ThemeWrapper({ children, className, defaultTheme, id }: ThemeWrapperProps) {
  return (
    <div
      id={id}
      style={EDITOR_THEME}
      className={cn('themes-wrapper w-full bg-transparent antialiased', className)}>
      {children}
    </div>
  );
}
