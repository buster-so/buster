import React, { type PropsWithChildren } from 'react';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons';
import { SidebarLeft } from '../icons';
import { AppTooltip } from '../tooltip';
import { COLLAPSED_COLUMN } from './config';
import { useSidebarOnCollapseClick } from './SidebarContext';

interface SidebarFooterProps extends PropsWithChildren {
  className?: string;
  useCollapsible?: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  children,
  className,
  useCollapsible,
}) => {
  return (
    <div
      className={cn(
        COLLAPSED_COLUMN,
        'mt-auto mb-3.5 flex items-center justify-center gap-2 pt-2.5',
        className
      )}
      data-testid="sidebar-footer"
    >
      {children}
      {useCollapsible && <CollapseButton />}
    </div>
  );
};

SidebarFooter.displayName = 'SidebarFooter';

const CollapseButton = React.memo(() => {
  const onCollapseClick = useSidebarOnCollapseClick();
  return (
    <AppTooltip title="Toggle sidebar" delayDuration={350}>
      <Button
        variant={'outlined'}
        rounding={'large'}
        className="text-md!"
        size={'tall'}
        prefix={<SidebarLeft />}
        onClick={onCollapseClick}
      />
    </AppTooltip>
  );
});

CollapseButton.displayName = 'CollapseButton';
