import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

interface StylingLabelProps {
  label: string;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const StylingLabel = React.forwardRef<HTMLDivElement, StylingLabelProps>(
  ({ label, labelExtra, children, className = '', id }, ref) => {
    return (
      <div className={cn('flex flex-col space-y-2.5', className)} ref={ref} id={id}>
        <div className="flex h-6 items-center justify-between">
          <Text size="sm" variant="secondary">
            {label}
          </Text>
          {labelExtra}
        </div>
        {children}
      </div>
    );
  }
);

StylingLabel.displayName = 'StylingLabel';
