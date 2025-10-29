import { Link } from '@tanstack/react-router';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons/Button';
import { Xmark } from '../icons';
import { AppTooltip } from '../tooltip';
import type { ISidebarItem } from './interfaces';
import { useSidebarIsCollapsed } from './SidebarContext';

const itemVariants = cva(
  cn(
    'flex items-center group rounded px-1.5 min-h-7 max-h-7 text-base transition-colors cursor-pointer',
    // Active state styles using data-status attribute
    'data-[status=active]:bg-nav-item-select data-[status=active]:hover:bg-nav-item-select'
    // COLLAPSED_JUSTIFY_CENTER
  ),
  {
    variants: {
      variant: {
        default: 'hover:bg-nav-item-hover text-text-default',
        emphasized: 'shadow bg-background border border-border text-text-default',
      },
      disabled: {
        true: 'cursor-not-allowed text-text-disabled bg-transparent',
        false: '',
      },
    },
    compoundVariants: [
      {
        disabled: true,
        variant: 'default',
        className: 'hover:bg-transparent',
      },
    ],
  }
);

export const SidebarItem: React.FC<
  ISidebarItem &
    VariantProps<typeof itemVariants> & {
      hideTooltip?: boolean;
    }
> = ({
  label,
  icon,
  link,
  id,
  disabled = false,
  active = false,
  variant = 'default',
  onRemove,
  className = '',
  onClick,
  collapsedTooltip,
  hideTooltip,
  ...rest
}) => {
  const isSidebarCollapsed = useSidebarIsCollapsed();

  const wrapperProps = {
    className: cn(itemVariants({ disabled, variant }), 'justify-between', className),
    onClick,
    'data-testid': `sidebar-item-${id}`,
    'data-status': active ? 'active' : undefined,
    disabled,
    ...rest,
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (isSidebarCollapsed && !hideTooltip) {
      return (
        <AppTooltip side="right" align="start" title={label}>
          {children}
        </AppTooltip>
      );
    }
    return <React.Fragment>{children}</React.Fragment>;
  };

  const content = (
    <>
      <div className={'flex items-center gap-2 overflow-hidden'}>
        {icon && (
          <span
            className={cn('text-icon-size! text-icon-color', {
              'text-text-disabled': disabled,
            })}
          >
            {icon}
          </span>
        )}

        <span className={cn('leading-1.3 truncate')}>{label}</span>
      </div>
      {onRemove && (
        <Button
          className={cn('hidden group-hover:flex')}
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
    </>
  );

  const wrapperSwitch =
    disabled || !link ? (
      <div {...wrapperProps}>{content}</div>
    ) : (
      <Link {...wrapperProps} {...link}>
        {content}
      </Link>
    );

  return <Wrapper>{wrapperSwitch}</Wrapper>;
};

SidebarItem.displayName = 'SidebarItem';
