'use client';

import { cn } from '@/lib/utils';
import * as LabelPrimitive from '@radix-ui/react-label';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

const labelVariants = cva(
  'text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'text-lg'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, size, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ size }), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
