import type { PropsWithChildren } from 'react';
import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../scroll-area/ScrollArea';

export const AppPageLayoutContent: React.FC<
  PropsWithChildren<{
    className?: string;
    scrollable?: boolean;
    id?: string;
    viewportRef?: React.RefObject<HTMLDivElement | null>;
    scrollContainerStyle?: React.CSSProperties;
  }>
> = ({
  viewportRef,
  scrollContainerStyle,
  className: classNameProp = '',
  children,
  scrollable = true,
  id,
}) => {
  const Selector = scrollable ? ScrollArea : 'main';
  const ChildSelector = scrollable ? 'main' : React.Fragment;
  const className = cn(
    'bg-page-background app-content h-full max-h-full overflow-hidden',
    'relative', //added this to error boundary components
    classNameProp
  );

  const props = scrollable
    ? { id, viewportRef, style: scrollContainerStyle, className }
    : {
        className,
        style: scrollContainerStyle,
        id,
      };

  return (
    <Selector {...props}>
      <ChildSelector>{children}</ChildSelector>
    </Selector>
  );
};
