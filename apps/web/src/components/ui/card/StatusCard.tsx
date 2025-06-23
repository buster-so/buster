import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from '@/lib/classMerge';
import { Xmark } from '../icons';
import { Text } from '../typography';

const statusVariants = cva('shadow p-3 rounded', {
  variants: {
    variant: {
      danger: 'bg-danger-foreground text-white',
      default: 'bg-background text-foreground border'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export const StatusCard: React.FC<
  {
    message: string;
    title?: string;
    className?: string;
    onClose?: () => void;
    extra?: React.ReactNode;
  } & VariantProps<typeof statusVariants>
> = ({ message, title, variant = 'default', className, onClose, extra }) => {
  return (
    <div className={cn('flex flex-col gap-1', statusVariants({ variant }), className)}>
      {title && <Text variant={'inherit'}>{title}</Text>}
      <Text
        className={cn(
          variant === 'danger' && 'text-white',
          variant === 'default' && 'text-text-secondary',
          'leading-[1.3]'
        )}>
        {message}
      </Text>

      {extra && extra}
      {onClose && (
        <button type="button" onClick={onClose} className="absolute top-2 right-2 cursor-pointer">
          <Xmark />
        </button>
      )}
    </div>
  );
};
