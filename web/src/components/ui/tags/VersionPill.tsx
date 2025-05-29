import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const VersionPill: React.FC<{ version_number: number }> = React.memo(
  ({ version_number = 1 }) => {
    const text = `v${version_number}`;

    return (
      <div
        className={cn(
          'bg-disabled rounded-sm border px-0.5',
          'h-[18px] w-fit min-w-[18px]',
          'flex items-center justify-center'
        )}>
        <Text variant="secondary" size="sm">
          {text}
        </Text>
      </div>
    );
  }
);

VersionPill.displayName = 'VersionPill';
