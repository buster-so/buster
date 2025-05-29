'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip/TooltipBase';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '../error';

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  min?: number;
  max?: number;
  step?: number;
  showTooltip?: boolean;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      className,
      min = 0,
      max = 100,
      step = 1,
      showTooltip = true,
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [useTooltip, setUseTooltip] = React.useState(false);
    const [internalValues, setInternalValues] = React.useState<number[]>(
      value || defaultValue || [min]
    );
    const currentValue: number[] = value || defaultValue || [min];

    const handleValueChange = useMemoizedFn((newValue: number[]) => {
      onValueChange?.(newValue);
      setInternalValues(newValue);
      setUseTooltip(true);
    });

    const handleValueCommit = useMemoizedFn(() => {
      setUseTooltip(false);
      setInternalValues(currentValue);
    });

    return (
      <ErrorBoundary errorComponent={<div>Error</div>}>
        <SliderPrimitive.Root
          ref={ref}
          className={cn('relative flex w-full touch-none items-center select-none', className)}
          min={min}
          max={max}
          step={step}
          value={value}
          defaultValue={internalValues}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          {...props}>
          <SliderPrimitive.Track className="bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full">
            <SliderPrimitive.Range className="bg-primary absolute h-full" />
          </SliderPrimitive.Track>

          <TooltipProvider>
            <Tooltip open={useTooltip}>
              <TooltipTrigger asChild>
                <SliderPrimitive.Thumb
                  onMouseEnter={() => setUseTooltip(true)}
                  onMouseLeave={() => setUseTooltip(false)}
                  className="border-primary bg-background block h-4 w-4 cursor-pointer rounded-full border-2 shadow transition-all hover:scale-110 focus:outline-0 disabled:pointer-events-none disabled:opacity-50"
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5}>
                {internalValues[0]}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SliderPrimitive.Root>
      </ErrorBoundary>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
