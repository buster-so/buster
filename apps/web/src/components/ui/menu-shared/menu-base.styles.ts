import { cn } from '@/lib/classMerge';

/**
 * Shared styling utilities for Dropdown and ContextMenu components
 * Both menu systems use IDENTICAL styles
 */

/**
 * Base animation and layout classes for menu content
 */
export const baseContentClass = cn(
  // Animation classes
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
  'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  // Layout
  'z-50 min-w-[8rem] overflow-hidden',
  // Theme
  'bg-background text-foreground',
  // Border
  'rounded-md border'
);

/**
 * Dropdown content styling - adds min-width to base content
 */
export const dropdownContentClass = cn(baseContentClass, 'min-w-48');

/**
 * Context menu content styling - uses base content without additional styling
 */
export const contextMenuContentClass = baseContentClass;

/**
 * Shared menu item styling
 * Used by both dropdown and context menu - IDENTICAL appearance and spacing
 */
export const menuItemClass = cn(
  // Base structure
  'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  // Visual styles
  'gap-2 text-base',
  'focus:bg-item-hover focus:text-foreground',
  'transition-colors',
  'group',
  // Spacing model
  'dropdown-item mx-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Shared checkbox item styling (single select)
 * Used by both dropdown and context menu - IDENTICAL
 */
export const menuCheckboxSingleClass = cn(
  'relative flex cursor-pointer items-center rounded-sm py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  'focus:bg-item-hover focus:text-foreground',
  'data-[state=checked]:bg-item-hover',
  'gap-1.5 text-base',
  'transition-colors',
  'pr-6 pl-2',
  'mx-1 dropdown-item',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Shared checkbox item styling (multiple select)
 */
export const menuCheckboxMultipleClass = cn(
  'relative flex cursor-pointer items-center rounded-sm py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  'focus:bg-item-hover focus:text-foreground',
  'data-[state=checked]:bg-item-hover',
  'gap-1.5 text-base',
  'transition-colors',
  'group pr-2 pl-7',
  'mx-1 dropdown-item',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Shared radio item styling
 * Used by both dropdown and context menu - IDENTICAL
 */
export const menuRadioClass = cn(
  'relative flex cursor-pointer items-center rounded-sm py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  'focus:bg-item-hover focus:text-foreground',
  'gap-1.5 text-base',
  'transition-colors',
  'pr-2 pl-8',
  'mx-1 dropdown-item',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Shared SubTrigger styling
 * Used by both dropdown and context menu - IDENTICAL
 */
export const menuSubTriggerClass = cn(
  'focus:bg-item-hover data-[state=open]:bg-item-hover',
  'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  'dropdown-item mx-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Shared separator styling
 * Used by both dropdown and context menu - IDENTICAL
 */
export const menuSeparatorClass = cn(
  'bg-border -mx-1 my-1 h-[0.5px]',
  'dropdown-separator',
  '[&.dropdown-separator:first-child]:hidden',
  '[&.dropdown-separator:has(+.dropdown-separator)]:hidden',
  '[&.dropdown-separator:last-child]:hidden'
);

/**
 * Shared shortcut text styling
 */
export const shortcutClass = cn('ml-auto text-xs tracking-widest opacity-60');

/**
 * Shared indicator wrapper styling (right side, for check icons)
 */
export const menuIndicatorRightClass = cn(
  'absolute right-2 flex h-3.5 w-fit items-center justify-center space-x-1'
);

/**
 * Shared indicator wrapper styling (left side, for checkboxes)
 */
export const menuIndicatorLeftCheckboxClass = cn(
  'absolute left-2 flex h-3.5 w-3.5 items-center justify-center opacity-0 group-hover:opacity-100'
);

/**
 * Shared indicator wrapper styling (left side, for radio buttons)
 */
export const menuIndicatorLeftRadioClass = cn(
  'absolute left-2 flex h-3.5 w-3.5 items-center justify-center'
);

/**
 * Shared indicator icon styling
 */
export const menuIndicatorIconClass = cn(
  'text-icon-color flex items-center justify-center text-sm'
);

/**
 * Shared indicator index number styling
 */
export const menuIndicatorIndexClass = cn('text-gray-dark ml-auto w-2 text-center');

/**
 * Shared inset padding (used by SubTrigger, Label, etc.)
 */
export const menuInsetClass = 'pl-8';

/**
 * Shared label styling
 */
export const menuLabelClass = cn('text-gray-dark px-2 py-1.5 text-base');

/**
 * Shared caret icon size for SubTrigger
 */
export const menuSubTriggerCaretClass = cn('text-2xs text-icon-color ml-auto');

/**
 * Scrollable content area with max-height
 * Applied to both main menu content and submenu content
 */
export const menuScrollableContentClass = cn('max-h-[395px] overflow-y-auto scrollbar-thin');
