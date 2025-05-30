import omit from 'lodash/omit';
import React from 'react';
import { KeyboardShortcutPill } from '../pills/KeyboardShortcutPills';
import {
  Tooltip as TooltipBase,
  TooltipContent as TooltipContentBase,
  TooltipProvider,
  TooltipTrigger
} from './TooltipBase';
import { cn } from '@/lib/classMerge';

export interface TooltipProps
  extends Pick<React.ComponentProps<typeof TooltipContentBase>, 'align' | 'side' | 'sideOffset'>,
    Pick<React.ComponentProps<typeof TooltipProvider>, 'delayDuration' | 'skipDelayDuration'> {
  children: React.ReactNode;
  title: string | React.ReactNode | undefined;
  shortcuts?: string[];
  open?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
}

export const Tooltip = React.memo(
  React.forwardRef<HTMLSpanElement, TooltipProps>(
    (
      {
        children,
        title,
        sideOffset,
        shortcuts,
        delayDuration = 0,
        skipDelayDuration,
        align,
        side,
        open,
        triggerClassName,
        contentClassName
      },
      ref
    ) => {
      if (!title || (!title && !shortcuts?.length)) return children;

      return (
        <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
          <TooltipBase open={open}>
            <TooltipTrigger asChild>
              <span ref={ref}>{children}</span>
            </TooltipTrigger>
            <TooltipContentBase
              align={align}
              side={side}
              sideOffset={sideOffset}
              className={contentClassName}>
              <TooltipContent title={title} shortcut={shortcuts} />
            </TooltipContentBase>
          </TooltipBase>
        </TooltipProvider>
      );
    }
  ),
  (prevProps, nextProps) => {
    return omit(prevProps, 'shortcut') === omit(nextProps, 'shortcut');
  }
);

const TooltipContent: React.FC<{
  title: string | React.ReactNode;
  shortcut?: string[];
  className?: string;
}> = ({ title, shortcut, className }) => {
  return (
    <div className={cn('flex h-3 max-h-3 min-h-3 items-center gap-x-1.5', className)}>
      <span className="text-sm">{title}</span>
      <KeyboardShortcutPill shortcut={shortcut} />
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
