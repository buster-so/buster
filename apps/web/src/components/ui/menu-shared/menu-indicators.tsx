import type * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, ShapeCircle as Circle } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  menuIndicatorIconClass,
  menuIndicatorIndexClass,
  menuIndicatorLeftCheckboxClass,
  menuIndicatorLeftRadioClass,
  menuIndicatorRightClass,
} from './menu-base.styles';

/**
 * Shared menu indicator components
 * Used by both Dropdown and ContextMenu to ensure IDENTICAL rendering
 */

interface MenuCheckIndicatorSingleProps {
  ItemIndicator: React.ComponentType<{ children: React.ReactNode }>;
  index?: number;
}

/**
 * Single select checkbox indicator (right side, Check icon)
 * Used by both DropdownMenuCheckboxItemSingle and ContextMenuCheckboxItem
 */
export function MenuCheckIndicatorSingle({ ItemIndicator, index }: MenuCheckIndicatorSingleProps) {
  return (
    <span className={menuIndicatorRightClass}>
      <ItemIndicator>
        <div className={menuIndicatorIconClass}>
          <Check />
        </div>
      </ItemIndicator>
      {index !== undefined && <span className={menuIndicatorIndexClass}>{index}</span>}
    </span>
  );
}

/**
 * Multiple select checkbox indicator (left side, Checkbox component)
 * Used by DropdownMenuCheckboxItemMultiple
 */
export function MenuCheckIndicatorMultiple({
  checked,
}: {
  checked: boolean | 'indeterminate' | undefined;
}) {
  return (
    <span className={cn(menuIndicatorLeftCheckboxClass, checked && 'opacity-100')}>
      <Checkbox size="default" checked={!!checked} />
    </span>
  );
}

interface MenuRadioIndicatorProps {
  ItemIndicator: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Radio indicator (left side, Circle icon)
 * Used by ContextMenuRadioItem
 */
export function MenuRadioIndicator({ ItemIndicator }: MenuRadioIndicatorProps) {
  return (
    <span className={menuIndicatorLeftRadioClass}>
      <ItemIndicator>
        <div className={menuIndicatorIconClass}>
          <Circle />
        </div>
      </ItemIndicator>
    </span>
  );
}
