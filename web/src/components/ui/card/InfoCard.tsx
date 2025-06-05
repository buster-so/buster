import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/classMerge';

const infoCardVariants = cva('rounded relative flex gap-1 w-full h-full justify-between', {
  variants: {
    size: {
      default: 'px-4 py-3.5'
    },
    variant: {
      default: 'border bg-background shadow',
      gray: 'border bg-item-hover shadow',
      ghost: 'border-none bg-transparent shadow-none'
    },
    selectable: {
      true: 'cursor-pointer',
      false: ''
    },
    selected: {
      true: '',
      false: ''
    }
  },
  compoundVariants: [
    {
      selectable: true,
      variant: 'default',
      className: 'hover:bg-item-hover'
    },
    {
      selectable: true,
      variant: 'gray',
      className: 'hover:bg-item-active'
    },
    {
      selected: true,
      variant: 'default',
      className: 'bg-item-hover'
    },
    {
      selected: true,
      variant: 'gray',
      className: 'bg-item-active'
    }
  ]
});

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof infoCardVariants>['variant'];
  size?: VariantProps<typeof infoCardVariants>['size'];
  title: string;
  description: string;
  icon: React.ReactNode;
  iconPosition?: 'top' | 'center' | 'bottom' | 'absolute-top';
  onClick?: () => void;
  selected?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = React.memo(
  ({
    size = 'default',
    variant = 'default',
    title,
    description,
    icon,
    iconPosition = 'center',
    className,
    onClick,
    selected = false,
    ...props
  }) => {
    return (
      <div
        className={cn(
          infoCardVariants({ size, variant, selectable: !!onClick, selected }),
          className
        )}
        {...props}>
        <div className="flex flex-1 flex-col gap-1.5">
          <h3 className="text-foreground text-base">{title}</h3>
          <p className="text-gray-dark text-xs">{description}</p>
        </div>
        {icon && (
          <div
            className={cn(
              'text-icon-color hover:text-foreground flex min-h-full',
              iconPosition === 'absolute-top' ? 'absolute top-3 right-3' : 'pl-4',
              {
                'items-start': iconPosition === 'top',
                'items-center': iconPosition === 'center',
                'items-end': iconPosition === 'bottom'
              }
            )}>
            <span className="h-fit">{icon}</span>
          </div>
        )}
      </div>
    );
  }
);

InfoCard.displayName = 'InfoCard';
