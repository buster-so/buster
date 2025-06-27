import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from '@/lib/utils';

const headerVariants = cva(
  'bg-page-background flex max-h-[38px] min-h-[38px] items-center justify-between ml-[0.5px] gap-x-2.5 relative',
  {
    variants: {
      sizeVariant: {
        default: 'px-4.5',
        list: 'px-7.5'
      },
      borderVariant: {
        default: 'border-b',
        ghost: 'border-b-0'
      }
    },
    defaultVariants: {
      borderVariant: 'default',
      sizeVariant: 'default'
    },
    compoundVariants: [
      {
        borderVariant: 'ghost',
        sizeVariant: 'default',
        className: 'max-h-[37.5px] min-h-[37.5px]' // hack. figure out a better way to do this
      }
    ]
  }
);

export const AppPageLayoutHeader: React.FC<
  React.PropsWithChildren<
    {
      className?: string;
    } & VariantProps<typeof headerVariants>
  >
> = ({ children, className = '', sizeVariant = 'default', borderVariant = 'default' }) => {
  return (
    <div className={cn(headerVariants({ sizeVariant, borderVariant }), className)}>{children}</div>
  );
};
