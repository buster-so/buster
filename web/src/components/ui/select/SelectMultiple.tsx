'use client';

import React, { useMemo } from 'react';
import type { SelectItem } from './Select';
import { selectVariants } from './SelectBase';
import { cn } from '@/lib/classMerge';
import { Dropdown, type DropdownItem } from '../dropdown/Dropdown';
import type { VariantProps } from 'class-variance-authority';
import { useMemoizedFn } from '@/hooks';
import { InputTag } from '../inputs/InputTag';

interface SelectMultipleProps extends VariantProps<typeof selectVariants> {
  items: SelectItem[];
  onChange: (item: string[]) => void;
  className?: string;
  placeholder?: string;
  value: string[];
  disabled?: boolean;
  useSearch?: boolean;
}

export const SelectMultiple: React.FC<SelectMultipleProps> = React.memo(
  ({
    items: itemsProp,
    onChange,
    className,
    placeholder = 'Select items...',
    size = 'default',
    variant = 'default',
    value,
    disabled,
    useSearch = true
  }) => {
    const selectedRecord = useMemo(() => {
      return itemsProp.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.value] = value.includes(item.value);
        return acc;
      }, {});
    }, [value]);

    const handleRemoveTag = (valueToRemove: string) => {
      const newSelected = itemsProp
        .filter((item) => item.value !== valueToRemove && selectedRecord[item.value])
        .map((item) => item.value);
      onChange(newSelected);
    };

    const handleSelect = useMemoizedFn((itemId: string) => {
      const item = itemsProp.find((item) => item.value === itemId);
      if (item) {
        if (selectedRecord[item.value]) {
          handleRemoveTag(item.value);
        } else {
          const newSelected = itemsProp
            .filter((item) => selectedRecord[item.value])
            .map((item) => item.value);
          onChange([...newSelected, item.value]);
        }
      }
    });

    const items = useMemo(() => {
      return itemsProp.map((item) => ({
        ...item,
        selected: selectedRecord[item.value]
      }));
    }, [itemsProp, selectedRecord]);

    const selectedItems: DropdownItem[] = useMemo(() => {
      return items.filter((item) => item.selected);
    }, [items]);

    return (
      <Dropdown
        items={items}
        onSelect={handleSelect}
        menuHeader={useSearch ? 'Search...' : undefined}
        selectType="multiple"
        align="start"
        modal={false}
        className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-full!">
        <div
          className={cn(
            selectVariants({ variant, size }),
            'relative overflow-hidden pr-0',
            selectedItems.length > 0 && 'pl-1!',
            disabled && 'cursor-not-allowed opacity-80',
            className
          )}>
          <div className="scrollbar-hide flex h-full flex-nowrap items-center gap-1 overflow-x-auto">
            {selectedItems.map((item) => (
              <InputTag
                key={item.value}
                label={item.label}
                value={item.value}
                disabled={disabled}
                onRemove={handleRemoveTag}
              />
            ))}
            {selectedItems.length === 0 && (
              <span className="text-gray-light text-base">{placeholder}</span>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="from-background via-background/80 pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l to-transparent" />
          )}
        </div>
      </Dropdown>
    );
  }
);
SelectMultiple.displayName = 'SelectMultiple';
