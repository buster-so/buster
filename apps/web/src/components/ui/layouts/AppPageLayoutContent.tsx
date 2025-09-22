import React, { type PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../scroll-area/ScrollArea';

export const AppPageLayoutContent: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
    id?: string;
  }>
> = ({ className = '', children, scrollable = true, id }) => {
  const Selector = scrollable ? ScrollArea : 'main';
  const ChildSelector = scrollable ? 'main' : React.Fragment;

  return (
    <Selector
      id={id}
      className={cn(
        'bg-page-background app-content h-full max-h-full overflow-hidden',
        'relative', //added this to error boundary components
        className
      )}
    >
      <ChildSelector>{children}</ChildSelector>
    </Selector>
  );
};
