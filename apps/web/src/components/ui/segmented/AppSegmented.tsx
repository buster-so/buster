import * as Tabs from '@radix-ui/react-tabs';
import {
  Link,
  type LinkProps,
  type RegisteredRouter,
  type ValidateFromPath,
} from '@tanstack/react-router';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useLayoutEffect, useState, useTransition } from 'react';
import { useIsBlockerEnabled } from '@/context/Routes/blocker-store';
import { useDebounce } from '@/hooks/useDebounce';
import { useSize } from '@/hooks/useSize';
import { cn } from '@/lib/classMerge';
import type { ILinkProps } from '@/types/routes';
import { Tooltip } from '../tooltip/Tooltip';

export interface SegmentedItem<
  T extends string | number = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
  link?: ILinkProps<TRouter, TOptions, TFrom>;
  respectBlocker?: boolean; //links automatically respect blocker
}

export interface AppSegmentedProps<
  T extends string | number = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  options: SegmentedItem<T, TRouter, TOptions, TFrom>[];
  value?: T;
  onChange?: (value: SegmentedItem<T, TRouter, TOptions, TFrom>) => void;
  className?: string;
  size?: 'default' | 'large' | 'medium';
  block?: boolean;
  type?: 'button' | 'track';
  disabled?: boolean;
  from?: ValidateFromPath<TRouter, TFrom>;
}

const heightVariants = cva('h-6', {
  variants: {
    size: {
      default: 'h-6',
      medium: 'h-7',
      large: 'h-[50px]',
    },
  },
});

const segmentedVariants = cva('relative inline-flex items-center rounded', {
  variants: {
    block: {
      true: 'w-full',
      false: '',
    },
    type: {
      button: 'bg-transparent',
      track: 'bg-item-select',
    },
  },
});

const triggerVariants = cva(
  'relative z-10 flex items-center justify-center gap-x-1.5 gap-y-1 rounded transition-colors ',
  {
    variants: {
      size: {
        default: 'flex-row min-w-6',
        medium: 'min-w-7 flex-row',
        large: 'px-3 flex-col',
      },
      block: {
        true: 'flex-1',
        false: '',
      },
      disabled: {
        true: '!text-foreground/30 !hover:text-foreground/30 cursor-not-allowed',
        false: 'cursor-pointer',
      },
      selected: {
        true: 'text-foreground',
        false: 'text-gray-dark hover:text-foreground',
      },
    },
    defaultVariants: {
      size: 'default',
      block: false,
      disabled: false,
      selected: false,
    },
  }
);

const gliderVariants = cva('glider absolute border-border rounded border', {
  variants: {
    type: {
      button: 'bg-item-select',
      track: 'bg-background',
    },
  },
});

// Create a type for the forwardRef component that includes displayName
type AppSegmentedComponent = (<
  T extends string | number = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(
  props: AppSegmentedProps<T, TRouter, TOptions, TFrom> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => React.ReactElement) & {
  displayName?: string;
};

// Update the component definition to properly handle generics
export const AppSegmented: AppSegmentedComponent = (<
  T extends string | number = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>({
  options,
  type = 'track',
  value,
  onChange,
  className,
  size = 'default',
  block = false,
  from,
}: AppSegmentedProps<T, TRouter, TOptions, TFrom>) => {
  const { blocker } = useIsBlockerEnabled();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const rawElementSize = useSize(rootRef, 25);
  const elementSize = useDebounce(rawElementSize, { wait: 25 });
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const [selectedValue, setSelectedValue] = useState(value || options[0]?.value);
  const [gliderStyle, setGliderStyle] = useState({
    width: 0,
    transform: 'translateX(0)',
  });
  const [isMeasured, setIsMeasured] = useState(false);
  const [_isPending, startTransition] = useTransition();

  const handleTabClick = (value: string) => {
    const item = options.find((item) => item.value === value);

    if (blocker && (item?.link || item?.respectBlocker)) {
      return;
    }

    if (item && !item.disabled && value !== selectedValue) {
      setSelectedValue(item.value);
      startTransition(() => {
        onChange?.(item);
      });
    }
  };

  const updateGliderStyle = () => {
    const selectedTab = tabRefs.current.get(selectedValue as string);
    if (selectedTab) {
      const { offsetWidth, offsetLeft } = selectedTab;
      if (offsetWidth > 0) {
        startTransition(() => {
          setGliderStyle({
            width: offsetWidth,
            transform: `translateX(${offsetLeft}px)`,
          });
          setIsMeasured(true);
        });
      }
    }
  };

  // Use useLayoutEffect to measure before paint
  useLayoutEffect(() => {
    updateGliderStyle();
  }, [selectedValue, elementSize?.width]);

  useEffect(() => {
    if (value !== undefined && value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value]);

  return (
    <Tabs.Root
      ref={rootRef}
      value={selectedValue as string}
      className={cn(segmentedVariants({ block, type }), heightVariants({ size }), className)}
    >
      {isMeasured && (
        <motion.div
          className={cn(gliderVariants({ type }), heightVariants({ size }))}
          initial={{
            width: gliderStyle.width,
            x: Number.parseInt(
              gliderStyle.transform.replace('translateX(', '').replace('px)', ''),
              10
            ),
          }}
          animate={{
            width: gliderStyle.width,
            x: Number.parseInt(
              gliderStyle.transform.replace('translateX(', '').replace('px)', ''),
              10
            ),
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
          }}
        />
      )}
      <Tabs.List
        className="relative z-10 flex w-full items-center gap-0.5"
        aria-label="Segmented Control"
      >
        {options.map((item) => (
          <SegmentedTrigger
            key={item.value}
            item={item as SegmentedItem<string, TRouter, TOptions, TFrom>}
            selectedValue={selectedValue as string}
            size={size}
            block={block}
            tabRefs={tabRefs}
            handleTabClick={handleTabClick}
            from={from}
          />
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}) as AppSegmentedComponent;

AppSegmented.displayName = 'AppSegmented';

interface SegmentedTriggerProps<
  T extends string = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
> {
  item: SegmentedItem<T, TRouter, TOptions, TFrom>;
  selectedValue: string;
  size: AppSegmentedProps<T, TRouter, TOptions, TFrom>['size'];
  block: AppSegmentedProps<T, TRouter, TOptions, TFrom>['block'];
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  handleTabClick: (value: string) => void;
  from?: ValidateFromPath<TRouter, TFrom>;
}

function SegmentedTriggerComponent<
  T extends string = string,
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
  TFrom extends string = string,
>(props: SegmentedTriggerProps<T, TRouter, TOptions, TFrom>) {
  const { item, selectedValue, size, block, tabRefs, handleTabClick, from } = props;
  const { tooltip, label, icon, disabled, value, link } = item;

  const handleClick = (_e: React.MouseEvent) => {
    handleTabClick(value);
  };

  const commonProps = {
    onClick: handleClick,
    'data-testid': `segmented-trigger-${value}`,
  };

  const linkContent = (
    <>
      {icon && (
        <span className={cn('flex items-center text-sm', size === 'medium' && 'text-lg')}>
          {icon}
        </span>
      )}
      {label && <span className={cn('text-sm')}>{label}</span>}
    </>
  );

  const linkDiv = link ? (
    <Link
      {...(link as LinkProps)}
      from={(from === './' ? undefined : from) as '/'}
      {...commonProps}
    >
      {linkContent}
    </Link>
  ) : (
    <div {...commonProps}>{linkContent}</div>
  );

  // Determine padding based on size, icon, and label presence
  const getPaddingClass = () => {
    if (size === 'default') {
      // If there's an icon but no label, use p-0
      if (icon && !label) {
        return 'p-0';
      }
      // If there's a label, use p-2
      if (label) {
        return 'p-2';
      }
      // Default fallback for edge cases
      return 'p-2';
    }
    // For other sizes, no additional padding (they have their own px-3)
    return '';
  };

  return (
    <Tooltip title={tooltip || ''} sideOffset={10} delayDuration={150}>
      <Tabs.Trigger
        key={value}
        value={value}
        disabled={disabled}
        asChild
        ref={(el) => {
          if (el) tabRefs.current.set(value, el);
        }}
        className={cn(
          triggerVariants({
            size,
            block,
            disabled,
            selected: selectedValue === value,
          }),
          getPaddingClass()
        )}
      >
        {linkDiv}
      </Tabs.Trigger>
    </Tooltip>
  );
}

SegmentedTriggerComponent.displayName = 'SegmentedTrigger';

const SegmentedTrigger = React.memo(SegmentedTriggerComponent) as typeof SegmentedTriggerComponent;
SegmentedTrigger.displayName = 'SegmentedTrigger';

export function createSegmentedItem<T extends string | number = string>() {
  return <
    TRouter extends RegisteredRouter = RegisteredRouter,
    TOptions = Record<string, unknown>,
    TFrom extends string = string,
  >(
    item: SegmentedItem<T, TRouter, TOptions, TFrom>
  ) => item as SegmentedItem<T, TRouter, TOptions, TFrom>;
}

export function createSegmentedItems<T extends string | number = string>() {
  return <
    TRouter extends RegisteredRouter = RegisteredRouter,
    TOptions = Record<string, unknown>,
    TFrom extends string = string,
  >(
    items: SegmentedItem<T, TRouter, TOptions, TFrom>[]
  ) => items as SegmentedItem<T, TRouter, TOptions, TFrom>[];
}
