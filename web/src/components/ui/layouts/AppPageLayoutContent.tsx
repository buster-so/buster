import { cn } from '@/lib/utils';
import React, { type PropsWithChildren } from 'react';
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
      className={cn('bg-page-background app-content h-full max-h-full overflow-hidden', className)}>
      <ChildSelector>{children}</ChildSelector>
    </Selector>
  );
};
