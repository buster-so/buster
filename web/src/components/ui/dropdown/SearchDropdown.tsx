import { cn } from '@/lib/classMerge';
import React from 'react';
import { ArrowRight } from '../icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './DropdownBase';

export interface SearchDropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
}

interface SearchDropdownProps {
  items: SearchDropdownItem[];
  onSelect: (item: SearchDropdownItem) => void;
  className?: string;
  style?: React.CSSProperties;
  open: boolean;
  children: React.ReactNode;
  useLinkIcon?: boolean;
  contentClassName?: string;
  offset?: number;
}

export const SearchDropdown = React.memo(
  ({
    items,
    useLinkIcon = true,
    onSelect,
    className,
    offset = 0,
    children,
    open,
    contentClassName = 'rounded-t-none'
  }: SearchDropdownProps) => {
    return (
      <DropdownMenu open={open} defaultOpen={open} modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            'w-full min-w-[var(--radix-popper-anchor-width)]',
            'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
            contentClassName
          )}
          sideOffset={offset}
          align={'center'}
          side={'bottom'}
          loop>
          {items.map((item, index) => (
            <DropdownMenuItem
              disabled={item.disabled}
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={index}
              className="group min-h-10"
              onClick={() => onSelect(item)}>
              {item.label}
              {useLinkIcon && <ArrowRightIcon />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

SearchDropdown.displayName = 'SearchDropdown';

const ArrowRightIcon = React.memo(() => {
  return (
    <div className="ml-auto opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus:opacity-100">
      <ArrowRight />
    </div>
  );
});

ArrowRightIcon.displayName = 'ArrowRightIcon';
