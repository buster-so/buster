import { cn } from '@/lib/classMerge';

/**
 * Shared styling utilities for Dropdown and ContextMenu components
 * This ensures visual consistency across both menu systems
 */

/**
 * Base animation and layout classes for menu content
 * Used by both dropdown and context menu content containers
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
 * Dropdown-specific content padding
 * Dropdowns use min-width instead of padding
 */
export const dropdownContentClass = cn(baseContentClass, 'min-w-48');

/**
 * Context menu-specific content padding
 * Context menus use padding instead of min-width
 */
export const contextMenuContentClass = cn(baseContentClass, 'p-1');

/**
 * Base classes for menu items (used by SubTrigger and regular items)
 * Common across both systems
 */
export const baseItemClass = cn(
  'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0'
);

/**
 * Dropdown item styling with custom margin/spacing rules
 * Includes the special dropdown-item class with first/last/adjacent selectors
 */
export const dropdownItemClass = cn(
  baseItemClass,
  'gap-2 text-base',
  'focus:bg-item-select focus:text-foreground',
  'dropdown-item mx-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:last-child]:mb-1!',
  'group'
);

/**
 * Context menu item styling
 * Simpler than dropdown, uses different focus color and gap
 */
export const contextMenuItemClass = cn(
  baseItemClass,
  'gap-1.5 text-sm',
  'focus:bg-item-hover focus:text-foreground',
  'transition-colors',
  'group'
);

/**
 * Base checkbox/selectable item class
 * Used by both single and multiple selection variants
 */
export const baseSelectableItemClass = cn(
  'relative flex cursor-pointer items-center rounded-sm py-1.5 outline-none select-none',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  'focus:bg-item-hover focus:text-foreground'
);

/**
 * Dropdown checkbox item (single select) styling
 */
export const dropdownCheckboxSingleClass = cn(
  baseSelectableItemClass,
  'gap-1.5 text-base',
  'data-[state=checked]:bg-item-select',
  'pr-6 pl-2',
  'mx-1 dropdown-item',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Dropdown checkbox item (multiple select) styling
 */
export const dropdownCheckboxMultipleClass = cn(
  baseSelectableItemClass,
  'gap-1.5 text-base',
  'group pr-2 pl-7',
  'mx-1 dropdown-item',
  '[&.dropdown-item:has(+.dropdown-separator)]:mb-1',
  '[&.dropdown-item:has(~.dropdown-separator)]:mt-1',
  '[&.dropdown-item:first-child]:mt-1!',
  '[&.dropdown-item:last-child]:mb-1!'
);

/**
 * Context menu checkbox item styling
 */
export const contextMenuCheckboxClass = cn(
  baseSelectableItemClass,
  'gap-1.5 text-sm',
  'data-[state=checked]:bg-item-hover',
  'pr-6 pl-2',
  'transition-colors'
);

/**
 * SubTrigger styling for dropdown
 */
export const dropdownSubTriggerClass = cn(
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
 * SubTrigger styling for context menu
 */
export const contextMenuSubTriggerClass = cn(
  'focus:bg-item-hover data-[state=open]:bg-item-hover',
  'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0'
);

/**
 * Separator styling for dropdown
 * Includes complex hiding rules for adjacent/first/last separators
 */
export const dropdownSeparatorClass = cn(
  'bg-border dropdown-separator -mx-1 my-1 h-[0.5px]',
  '[&.dropdown-separator:first-child]:hidden',
  '[&.dropdown-separator:has(+.dropdown-separator)]:hidden',
  '[&.dropdown-separator:last-child]:hidden'
);

/**
 * Separator styling for context menu
 * Simpler than dropdown
 */
export const contextMenuSeparatorClass = cn('bg-border -mx-1 my-1 h-[0.5px]');

/**
 * Shortcut text styling (shared)
 */
export const shortcutClass = cn('ml-auto text-xs tracking-widest opacity-60');

/**
 * Label styling for dropdown
 */
export const dropdownLabelClass = cn('text-gray-dark px-2 py-1.5 text-base');

/**
 * Label styling for context menu
 */
export const contextMenuLabelClass = cn('text-gray-dark px-2 py-1.5 text-sm');

/**
 * Caret icon size for dropdown SubTrigger
 */
export const dropdownSubTriggerCaretClass = cn('text-2xs text-icon-color ml-auto');

/**
 * Caret icon size for context menu SubTrigger
 */
export const contextMenuSubTriggerCaretClass = cn('text-3xs text-icon-color ml-auto');

/**
 * Scrollable content area with max-height
 * Applied to both main menu content and submenu content
 */
export const menuScrollableContentClass = cn('max-h-[395px] overflow-y-auto scrollbar-thin');
