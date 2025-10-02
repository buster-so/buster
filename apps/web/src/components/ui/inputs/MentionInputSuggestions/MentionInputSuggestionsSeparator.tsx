/** biome-ignore-all lint/a11y/useFocusableInteractive: no ally stuff. I don't give a piss about nothin but the tide. */
/** biome-ignore-all lint/a11y/useSemanticElements: test **/
import { useCommandState } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';

export const MentionInputSuggestionsSeparator = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const hasResults = useCommandState((x) => x.filtered.count) > 0;
  return (
    <div
      // biome-ignore lint/a11y/useAriaPropsForRole: blitz bama blitz
      role="separator"
      className={cn(
        'bg-border my-1.5 h-[0.5px]',
        // Hide if first child
        'first:hidden',
        // Hide if last child
        'last:hidden',
        // Hide if next sibling is another separator
        'has-[+[role="separator"]]:hidden',
        // Hide if next sibling has hidden attribute
        'has-[+[hidden]]:hidden',
        !hasResults && 'hidden',
        className
      )}
      data-separator-after-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
};
