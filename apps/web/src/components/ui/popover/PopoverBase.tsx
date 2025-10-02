import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export type PopoverTriggerType = 'click' | 'hover';

function PopoverBase({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

interface PopoverProps extends React.ComponentPropsWithoutRef<typeof PopoverBase> {
  trigger?: PopoverTriggerType;
  children: React.ReactNode;
  open?: boolean;
  delayDuration?: number;
}

const PopoverRoot: React.FC<PopoverProps> = ({
  children,
  trigger = 'click',
  delayDuration = 0,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(props.open ?? false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, delayDuration);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const content =
    trigger === 'hover' ? (
      <span className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <span className="relative z-10">{children}</span>
      </span>
    ) : (
      children
    );

  return (
    <PopoverBase {...props} open={trigger === 'hover' ? isOpen : undefined}>
      {content}
    </PopoverBase>
  );
};

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

const popoverContentVariant = cva('', {
  variants: {
    size: {
      none: '',
      sm: 'p-2',
      default: 'p-2.5',
      md: 'p-3',
      lg: 'p-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export type PopoverContentVariant = VariantProps<typeof popoverContentVariant>;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & PopoverContentVariant
>(({ className, align = 'center', children, sideOffset = 4, size, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground',
        'w-fit rounded border shadow outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50'
      )}
      {...props}
    >
      <div className={cn(popoverContentVariant({ size }), className)}>{children}</div>
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { PopoverBase, PopoverRoot, PopoverTrigger, PopoverContent, PopoverAnchor };
