import { Command } from 'cmdk';
import type React from 'react';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';

export const MentionInputSuggestionsEmpty = ({
  emptyComponent,
  className,
}: {
  className?: string;
  emptyComponent: React.ReactNode;
}) => {
  return (
    <Command.Empty
      className={cn(
        'text-gray-light py-6 text-center text-base',
        !emptyComponent && 'hidden',
        className
      )}
    >
      {emptyComponent}
    </Command.Empty>
  );
};
