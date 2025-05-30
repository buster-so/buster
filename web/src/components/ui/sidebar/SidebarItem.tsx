import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons/Button';
import { Xmark } from '../icons';
import type { ISidebarItem } from './interfaces';
import { COLLAPSED_HIDDEN_BLOCK } from './config';
import { AppTooltip } from '../tooltip';

const itemVariants = cva(
  'flex items-center group justify-between rounded px-1.5 min-h-7 max-h-7 text-base transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        default: 'hover:bg-nav-item-hover text-text-default',
        emphasized: 'shadow bg-background border border-border text-text-default'
      },
      active: {
        true: '',
        false: ''
      },
      disabled: {
        true: 'cursor-not-allowed',
        false: ''
      }
    },
    compoundVariants: [
      {
        active: true,
        disabled: false,
        variant: 'default',
        className: 'bg-nav-item-select hover:bg-nav-item-select'
      },
      {
        active: false,
        disabled: true,
        variant: 'default',
        className: 'text-text-disabled! bg-transparent'
      },
      {
        active: true,
        disabled: false,
        variant: 'emphasized',
        className: 'bg-nav-item-select hover:bg-nav-item-select '
      },
      {
        active: false,
        disabled: true,
        variant: 'emphasized',
        className: 'bg-nav-item-select hover:bg-nav-item-select'
      },
      {
        active: false,
        disabled: false,
        variant: 'emphasized',
        className: 'hover:bg-item-hover '
      }
    ]
  }
);

export const SidebarItem: React.FC<
  ISidebarItem &
    VariantProps<typeof itemVariants> & {
      className?: string;
    }
> = React.memo(
  ({
    label,
    icon,
    route,
    id,
    disabled = false,
    active = false,
    variant = 'default',
    onRemove,
    className = '',
    onClick,
    collapsedTooltip
  }) => {
    const ItemNode = disabled || !route ? 'div' : Link;

    return (
      <ItemNode
        href={route || ''}
        className={cn(itemVariants({ active, disabled, variant }), className)}
        onClick={onClick}>
        <div className="flex items-center gap-2 overflow-hidden">
          <AppTooltip
            title={collapsedTooltip || label}
            side="right"
            sideOffset={8}
            delayDuration={750}>
            <span
              className={cn('text-icon-size! text-icon-color', {
                'text-text-disabled': disabled,
                'pl-4.5': !icon //hmmm... maybe this should be a prop?
              })}>
              {icon}
            </span>
          </AppTooltip>
          <span className={cn(COLLAPSED_HIDDEN_BLOCK, 'leading-1.3 truncate', className)}>
            {label}
          </span>
        </div>
        {onRemove && (
          <Button
            className="hidden group-hover:flex"
            variant="ghost"
            size={'small'}
            prefix={<Xmark />}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }}
          />
        )}
      </ItemNode>
    );
  }
);

SidebarItem.displayName = 'SidebarItem';
