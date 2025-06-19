import * as SwitchPrimitive from '@radix-ui/react-switch';
import type * as React from 'react';
import { cn } from '@/lib/classMerge';

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & {
  checked?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  onCheckedChange?(checked: boolean): void;
};

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-track-background inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background pointer-events-none block size-4 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
