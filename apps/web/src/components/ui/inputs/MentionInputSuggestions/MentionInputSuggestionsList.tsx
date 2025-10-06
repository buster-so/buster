import { Command, useCommandState } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

interface MentionInputSuggestionsListProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  show?: boolean;
}

export const MentionInputSuggestionsList = ({
  className,
  style,
  children,
  show = true,
}: MentionInputSuggestionsListProps) => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;

  if (!show) return null;

  return (
    <Command.List className={cn(hasResults && 'py-1.5', className)} style={style}>
      {children}
    </Command.List>
  );
};
