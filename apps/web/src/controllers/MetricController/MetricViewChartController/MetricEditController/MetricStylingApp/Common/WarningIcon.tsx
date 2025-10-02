import React from 'react';
import { TriangleWarning } from '@/components/ui/icons';
import { Popover } from '@/components/ui/popover/Popover';
import { cn } from '@/lib/classMerge';

export const WarningIcon: React.FC<{
  showWarning: boolean;
  warningText: string;
  className?: string;
  icon?: React.ReactNode;
}> = React.memo(({ showWarning, warningText, className, icon = <TriangleWarning /> }) => {
  if (!showWarning) {
    return null;
  }
  return (
    <Popover
      side="left"
      align="center"
      size="none"
      content={<div className={cn('max-w-[170px] p-2', className)}>{warningText}</div>}
    >
      <div
        className={cn(
          'text-text-tertiary hover:text-text-secondary flex h-full cursor-pointer items-center'
        )}
      >
        {icon}
      </div>
    </Popover>
  );
});
WarningIcon.displayName = 'WarningIcon';
