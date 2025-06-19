import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const VersionPill: React.FC<{ version_number: number }> = React.memo(
  ({ version_number = 1 }) => {
    const text = `v${version_number}`;

    return (
      <div
        className={cn(
          'flex h-[18px] w-fit min-w-[18px] items-center justify-center rounded-sm border bg-disabled px-0.5'
        )}>
        <Text variant="secondary" size="sm">
          {text}
        </Text>
      </div>
    );
  }
);

VersionPill.displayName = 'VersionPill';
