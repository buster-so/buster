import { cn } from '@/lib/classMerge';
import React, { PropsWithChildren } from 'react';
import { Button } from '../buttons';
import { SidebarLeft } from '../icons';
import { AppTooltip } from '../tooltip';
import { COLLAPSED_COLUMN } from './config';

interface SidebarFooterProps extends PropsWithChildren {
  className?: string;
  useCollapsible?: boolean;
  onCollapseClick: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = React.memo(
  ({ children, className, useCollapsible, onCollapseClick }) => {
    return (
      <div
        className={cn(
          COLLAPSED_COLUMN,
          'mt-auto mb-3.5 flex items-center justify-center gap-2 pt-2.5',
          className
        )}
        data-testid="sidebar-footer">
        {children}
        {useCollapsible && <CollapseButton onClick={onCollapseClick} />}
      </div>
    );
  }
);

SidebarFooter.displayName = 'SidebarFooter';

const CollapseButton: React.FC<{
  onClick: () => void;
}> = React.memo(({ onClick }) => {
  return (
    <AppTooltip title="Toggle sidebar" delayDuration={350}>
      <Button
        variant={'outlined'}
        rounding={'large'}
        className="text-md!"
        size={'tall'}
        prefix={<SidebarLeft />}
        onClick={onClick}
      />
    </AppTooltip>
  );
});

CollapseButton.displayName = 'CollapseButton';
