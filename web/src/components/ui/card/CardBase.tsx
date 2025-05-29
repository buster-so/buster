import { cn } from '@/lib/classMerge';
import { type VariantProps, cva } from 'class-variance-authority';
import React from 'react';

const sizeVariants = cva('', {
  variants: {
    size: {
      xsmall: 'h-[32px] min-h-[32px] px-2.5',
      small: 'p-2.5',
      default: 'p-4'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-background text-foreground flex flex-col overflow-hidden rounded border shadow',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const headerVariants = cva('', {
  variants: {
    variant: {
      default: '',
      gray: 'bg-item-select border-b',
      white: 'bg-white border-b'
    }
  }
});

const footerVariants = cva('', {
  variants: {
    border: {
      true: 'border-t pt-2',
      false: ''
    },
    size: {
      small: '',
      default: ''
    }
  },
  compoundVariants: [
    {
      border: true,
      size: 'small',
      className: 'pt-2.5'
    },
    {
      border: true,
      size: 'default',
      className: 'pt-4'
    }
  ],
  defaultVariants: {
    border: false,
    size: 'default'
  }
});

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof sizeVariants> &
    VariantProps<typeof headerVariants>
>(({ className, size, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-y-1.5',
        sizeVariants({ size }),
        headerVariants({ variant }),
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-lg leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-gray-dark text-sm', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof sizeVariants>
>(({ className, size, ...props }, ref) => (
  <div ref={ref} className={cn(sizeVariants({ size }), 'text-base', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof sizeVariants> &
    VariantProps<typeof footerVariants>
>(({ className, size, border, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      sizeVariants({ size }),
      footerVariants({ border }),
      'text-base',
      'flex items-center',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
