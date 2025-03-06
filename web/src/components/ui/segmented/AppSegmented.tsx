'use client';

import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { useEffect, useState, useLayoutEffect, useTransition } from 'react';
import { cva } from 'class-variance-authority';
import { useMemoizedFn } from 'ahooks';
import { Tooltip } from '../tooltip/Tooltip';

export interface SegmentedItem<T extends string | number = string> {
  value: T;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
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

const heightVariants = cva('h-[24px]', {
  variants: {
    size: {
      default: 'h-[24px]',
      medium: 'h-[28px]',
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
  'relative z-10 flex items-center justify-center gap-x-1.5 gap-y-1 rounded transition-colors ',
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
  React.forwardRef(
    <T extends string | number = string>(
      {
        options,
        type = 'track',
        value,
        onChange,
        className,
        size = 'default',
        block = false
      }: AppSegmentedProps<T>,
      ref: React.ForwardedRef<HTMLDivElement>
    ) => {
      const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
      const [selectedValue, setSelectedValue] = useState(value || options[0]?.value);
      const [gliderStyle, setGliderStyle] = useState({
        width: 0,
        transform: 'translateX(0)'
      });
      const [isMeasured, setIsMeasured] = useState(false);
      const [isPending, startTransition] = useTransition();

      useEffect(() => {
        if (value !== undefined && value !== selectedValue) {
          startTransition(() => {
            setSelectedValue(value);
          });
        }
      }, [value, selectedValue]);

      // Use useLayoutEffect to measure before paint
      useLayoutEffect(() => {
        const updateGliderStyle = () => {
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
        };

        // Run immediately
        updateGliderStyle();

        // Also run after a short delay to ensure DOM is fully rendered
        const timeoutId = setTimeout(updateGliderStyle, 25);

        return () => clearTimeout(timeoutId);
      }, [selectedValue]);

      const handleTabClick = useMemoizedFn((value: string) => {
        const item = options.find((item) => item.value === value);
        if (item && !item.disabled) {
          startTransition(() => {
            setSelectedValue(item.value);
            onChange?.(item);
          });
        }
      });

      return (
        <Tabs.Root
          ref={ref}
          value={selectedValue as string}
          onValueChange={handleTabClick}
          className={cn(segmentedVariants({ block, type }), heightVariants({ size }), className)}>
          {isMeasured && (
            <motion.div
              className={cn(gliderVariants({ type }), heightVariants({ size }))}
              initial={{
                width: gliderStyle.width,
                x: parseInt(gliderStyle.transform.replace('translateX(', '').replace('px)', ''))
              }}
              animate={{
                width: gliderStyle.width,
                x: parseInt(gliderStyle.transform.replace('translateX(', '').replace('px)', ''))
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
              />
            ))}
          </Tabs.List>
        </Tabs.Root>
      );
    }
  )
) as AppSegmentedComponent;

AppSegmented.displayName = 'AppSegmented';

interface SegmentedTriggerProps<T extends string = string> {
  item: SegmentedItem<T>;
  selectedValue: string;
  size: AppSegmentedProps<T>['size'];
  block: AppSegmentedProps<T>['block'];
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

function SegmentedTriggerComponent<T extends string = string>(props: SegmentedTriggerProps<T>) {
  const { item, selectedValue, size, block, tabRefs } = props;

  return (
    <Tooltip title={item.tooltip || ''} sideOffset={10}>
      <Tabs.Trigger
        key={item.value}
        value={item.value}
        disabled={item.disabled}
        ref={(el) => {
          if (el) tabRefs.current.set(item.value, el);
        }}
        className={cn(
          'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          triggerVariants({
            size,
            block,
            disabled: item.disabled,
            selected: selectedValue === item.value
          })
        )}>
        <>
          {item.icon && <span className={cn('flex items-center text-sm')}>{item.icon}</span>}
          {item.label && <span className={cn('text-sm')}>{item.label}</span>}
        </>
      </Tabs.Trigger>
    </Tooltip>
  );
}

SegmentedTriggerComponent.displayName = 'SegmentedTrigger';

const SegmentedTrigger = React.memo(SegmentedTriggerComponent) as typeof SegmentedTriggerComponent;
SegmentedTrigger.displayName = 'SegmentedTrigger';
