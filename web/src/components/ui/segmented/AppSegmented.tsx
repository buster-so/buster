'use client';

import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { useEffect, useState, useLayoutEffect, useTransition } from 'react';
import { cva } from 'class-variance-authority';
import { useMemoizedFn, useMount, useSize } from '@/hooks';
import { Tooltip } from '../tooltip/Tooltip';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export interface SegmentedItem<T extends string | number = string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
  link?: string;
}

export interface AppSegmentedProps<T extends string | number = string> {
  options: SegmentedItem<T>[];
  value?: T;
  onChange?: (value: SegmentedItem<T>) => void;
  className?: string;
  size?: 'default' | 'large';
  block?: boolean;
  type?: 'button' | 'track';
  disabled?: boolean;
}

const heightVariants = cva('h-6', {
  variants: {
    size: {
      default: 'h-6',
      medium: 'h-7',
      large: 'h-[50px]'
    }
  }
});

const segmentedVariants = cva('relative inline-flex items-center rounded', {
  variants: {
    block: {
      true: 'w-full',
      false: ''
    },
    type: {
      button: 'bg-transparent',
      track: 'bg-item-select'
    }
  }
});

const triggerVariants = cva(
  'relative z-10 flex items-center h-6 justify-center gap-x-1.5 gap-y-1 rounded transition-colors ',
  {
    variants: {
      size: {
        default: 'px-2 flex-row',
        medium: 'px-3 flex-row',
        large: 'px-3 flex-col'
      },
      block: {
        true: 'flex-1',
        false: ''
      },
      disabled: {
        true: '!text-foreground/30 !hover:text-foreground/30 cursor-not-allowed',
        false: 'cursor-pointer'
      },
      selected: {
        true: 'text-foreground',
        false: 'text-gray-dark hover:text-foreground'
      }
    },
    defaultVariants: {
      size: 'default',
      block: false,
      disabled: false,
      selected: false
    }
  }
);

const gliderVariants = cva('absolute border-border rounded border', {
  variants: {
    type: {
      button: 'bg-item-select',
      track: 'bg-background'
    }
  }
});

// Create a type for the forwardRef component that includes displayName
type AppSegmentedComponent = (<T extends string = string>(
  props: AppSegmentedProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement<any>) & {
  displayName?: string;
};

// Update the component definition to properly handle generics
export const AppSegmented: AppSegmentedComponent = React.memo(
  <T extends string | number = string>({
    options,
    type = 'track',
    value,
    onChange,
    className,
    size = 'default',
    block = false
  }: AppSegmentedProps<T>) => {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const elementSize = useSize(rootRef, 25);
    const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const [selectedValue, setSelectedValue] = useState(value || options[0]?.value);
    const [gliderStyle, setGliderStyle] = useState({
      width: 0,
      transform: 'translateX(0)'
    });
    const [isMeasured, setIsMeasured] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleTabClick = useMemoizedFn((value: string) => {
      const item = options.find((item) => item.value === value);
      if (item && !item.disabled && value !== selectedValue) {
        setSelectedValue(item.value);
        startTransition(() => {
          onChange?.(item);
        });
      }
    });

    const updateGliderStyle = useMemoizedFn(() => {
      const selectedTab = tabRefs.current.get(selectedValue as string);
      if (selectedTab) {
        const { offsetWidth, offsetLeft } = selectedTab;
        if (offsetWidth > 0) {
          startTransition(() => {
            setGliderStyle({
              width: offsetWidth,
              transform: `translateX(${offsetLeft}px)`
            });
            setIsMeasured(true);
          });
        }
      }
    });

    // Use useLayoutEffect to measure before paint
    useLayoutEffect(() => {
      updateGliderStyle();
    }, [selectedValue, elementSize?.width]);

    useEffect(() => {
      if (value !== undefined && value !== selectedValue) {
        startTransition(() => {
          setSelectedValue(value);
        });
      }
    }, [value]);

    return (
      <Tabs.Root
        ref={rootRef}
        value={selectedValue as string}
        // onValueChange={handleTabClick}
        className={cn(segmentedVariants({ block, type }), heightVariants({ size }), className)}>
        {isMeasured && (
          <motion.div
            className={cn(gliderVariants({ type }), heightVariants({ size }))}
            initial={{
              width: gliderStyle.width,
              x: Number.parseInt(gliderStyle.transform.replace('translateX(', '').replace('px)', ''))
            }}
            animate={{
              width: gliderStyle.width,
              x: Number.parseInt(gliderStyle.transform.replace('translateX(', '').replace('px)', ''))
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 35
            }}
          />
        )}
        <Tabs.List
          className="relative z-10 flex w-full items-center gap-0.5"
          aria-label="Segmented Control">
          {options.map((item) => (
            <SegmentedTrigger
              key={item.value}
              item={item as SegmentedItem<string>}
              selectedValue={selectedValue as string}
              size={size}
              block={block}
              tabRefs={tabRefs}
              handleTabClick={handleTabClick}
            />
          ))}
        </Tabs.List>
      </Tabs.Root>
    );
  }
) as AppSegmentedComponent;

AppSegmented.displayName = 'AppSegmented';

interface SegmentedTriggerProps<T extends string = string> {
  item: SegmentedItem<T>;
  selectedValue: string;
  size: AppSegmentedProps<T>['size'];
  block: AppSegmentedProps<T>['block'];
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  handleTabClick: (value: string) => void;
}

function SegmentedTriggerComponent<T extends string = string>(props: SegmentedTriggerProps<T>) {
  const { item, selectedValue, size, block, tabRefs, handleTabClick } = props;
  const { tooltip, label, icon, disabled, value, link } = item;
  const router = useRouter();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const LinkDiv = link ? Link : 'div';

  const handleClick = async (e: React.MouseEvent) => {
    if (link) {
      e.preventDefault();
      handleTabClick(value);
      // Wait for a short duration to allow the animation to complete
      await new Promise((resolve) => setTimeout(resolve, 1));
      onChangePage(link);
    } else {
      handleTabClick(value);
    }
  };

  useMount(() => {
    if (link) {
      router.prefetch(link);
    }
  });

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
            selected: selectedValue === value
          })
        )}>
        <LinkDiv href={link || ''} onClick={handleClick} data-testid={`segmented-trigger-${value}`}>
          {icon && <span className={cn('flex items-center text-sm')}>{icon}</span>}
          {label && <span className={cn('text-sm')}>{label}</span>}
        </LinkDiv>
      </Tabs.Trigger>
    </Tooltip>
  );
}

SegmentedTriggerComponent.displayName = 'SegmentedTrigger';

const SegmentedTrigger = React.memo(SegmentedTriggerComponent) as typeof SegmentedTriggerComponent;
SegmentedTrigger.displayName = 'SegmentedTrigger';
