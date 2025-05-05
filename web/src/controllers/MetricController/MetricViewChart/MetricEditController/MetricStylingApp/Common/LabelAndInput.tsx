import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const LabelAndInput: React.FC<{
  label: string;
  children: React.ReactNode;
  dataTestId?: string;
}> = ({ label, children, dataTestId }) => {
  return (
    <div
      data-testid={dataTestId}
      className={cn('grid w-full grid-cols-[minmax(115px,115px)_1fr] items-center gap-2', 'h-7')}>
      <Text size="sm" variant="secondary">
        {label}
      </Text>

      {children}
    </div>
  );
};
